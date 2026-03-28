import { Janitor } from "@rbxts/janitor";
import {
	CollectionService,
	Players,
	ServerStorage,
	TweenService,
	Workspace,
} from "@rbxts/services";
import {
	DEFAULT_WALK_SPEED,
	SCRAMBLE_CAR_DODGE_RADIUS,
	SCRAMBLE_CAR_SPAWN_INTERVAL,
	SCRAMBLE_CAR_SPEED_DURATION,
	SCRAMBLE_CAR_WAVE_DURATION,
	SCRAMBLE_CROWD_NPC_COUNT,
	SCRAMBLE_CROWD_WAVE_DURATION,
	SCRAMBLE_CROWD_WAVE_INTERVAL,
	SCRAMBLE_MAX_ACTIVE_SPIRIT_WAVES,
	SCRAMBLE_ONI_COUNT_DURATION,
	SCRAMBLE_SLIDE_COOLDOWN,
	SCRAMBLE_SLIDE_SPEED,
	SCRAMBLE_SPIRIT_WAVE_DURATION,
	SCRAMBLE_TAG_RADIUS,
	SLIDE_DIR_Y_OFFSET,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import {
	AnyPlayerState,
	MinigameId,
	MissionId,
	PlayerRole,
	RoundResult,
	ShibuyaScramblePlayerState,
} from "shared/types";
import { canTriggerSpiritWave } from "shared/utils/scrambleCrowd";
import {
	fireHintText,
	startOniCountdown,
	stopOniCountdown,
} from "../../utils/oni-helpers";
import { MissionService } from "../MissionService";
import { IMinigame } from "./MinigameBase";

type ServerEvents = ReturnType<typeof GlobalEvents.createServer>;

const ONI_SPAWN_TAG = "ShibuyaScrambleOniSpawn";
const HIDER_SPAWN_TAG = "ShibuyaScrambleHiderSpawn";
const SLIDE_RAMP_TAG = "ShibuyaSlideRamp";

export class ShibuyaScrambleMinigame implements IMinigame {
	readonly id = MinigameId.ShibuyaScramble;

	private playerStates = new Map<number, ShibuyaScramblePlayerState>();
	private playerObjects = new Map<number, Player>();
	private oniCounting = false;
	private countdownThread?: thread;
	private crowdThread?: thread;
	private crowdLoopRunning = false;
	private activeCrowdNPCs: Model[] = [];
	private carThread?: thread;
	private carLoopRunning = false;
	private activeCarNPCs: Model[] = [];
	private slideCooldowns = new Map<number, number>();
	private lastHintText = "";
	private spiritCharges = new Map<number, number>();
	private activeSpiritWaveCount = 0;

	constructor(
		private readonly serverEvents: ServerEvents,
		private readonly missionService: MissionService,
	) {}

	prepare(players: Player[], matchJanitor: Janitor) {
		for (const player of players) {
			this.playerStates.set(player.UserId, {
				minigameId: MinigameId.ShibuyaScramble,
				playerId: player.UserId,
				role: PlayerRole.None,
				isTagged: false,
				catchCount: 0,
				rescueCount: 0,
				carWavesSurvived: 0,
			});
			this.playerObjects.set(player.UserId, player);
			this.spiritCharges.set(player.UserId, 0);
		}

		// Connect slide ramp touch handlers
		const slideRamps = CollectionService.GetTagged(SLIDE_RAMP_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);
		if (slideRamps.size() === 0) {
			warn(
				"[ShibuyaScramble] Missing Studio asset: ShibuyaSlideRamp — check map setup",
			);
		}
		for (const ramp of slideRamps) {
			matchJanitor.Add(
				ramp.Touched.Connect((touching) =>
					this.handleSlideTouch(touching, ramp),
				),
			);
		}

		// Verify CrowdWaypoints
		const waypointsFolder = Workspace.FindFirstChild("CrowdWaypoints");
		if (!waypointsFolder) {
			warn(
				"[ShibuyaScramble] Missing Studio asset: Workspace.CrowdWaypoints — check map setup",
			);
		} else {
			for (let i = 1; i <= 4; i++) {
				if (!waypointsFolder.FindFirstChild(`Path${i}`)) {
					warn(
						`[ShibuyaScramble] Missing Studio asset: CrowdWaypoints/Path${i} — check map setup`,
					);
				}
			}
		}

		// Verify spawn tags
		if (CollectionService.GetTagged(ONI_SPAWN_TAG).size() === 0) {
			warn(
				"[ShibuyaScramble] Missing Studio asset: ShibuyaScrambleOniSpawn — check map setup",
			);
		}
		if (CollectionService.GetTagged(HIDER_SPAWN_TAG).size() === 0) {
			warn(
				"[ShibuyaScramble] Missing Studio asset: ShibuyaScrambleHiderSpawn — check map setup",
			);
		}
	}

	assignRoles(players: Player[]): Map<Player, PlayerRole> {
		const roles = new Map<Player, PlayerRole>();
		if (players.size() === 0) return roles;

		const oniIndex = math.random(0, players.size() - 1);
		for (let i = 0; i < players.size(); i++) {
			const player = players[i];
			const role = i === oniIndex ? PlayerRole.Oni : PlayerRole.Hider;
			roles.set(player, role);
			const state = this.playerStates.get(player.UserId);
			if (state) state.role = role;
		}

		this.teleportPlayers(players, roles);
		return roles;
	}

	startRound() {
		this.oniCounting = true;
		this.setOniWalkSpeed(0);
		this.lastHintText = fireHintText(
			this.serverEvents,
			"Oni is counting... Hide!",
			this.lastHintText,
		);

		this.countdownThread = startOniCountdown(
			this.serverEvents,
			SCRAMBLE_ONI_COUNT_DURATION,
			() => {
				if (!this.oniCounting) return;
				this.oniCounting = false;
				this.setOniWalkSpeed(DEFAULT_WALK_SPEED);
				this.lastHintText = fireHintText(
					this.serverEvents,
					"Oni is hunting! Run and hide!",
					this.lastHintText,
				);
				this.crowdThread = task.spawn(() => this.runCrowdLoop());
				this.carThread = task.spawn(() => this.runCarLoop());
			},
		);
	}

	tick(_dt: number) {}

	checkWinCondition(): RoundResult | undefined {
		if (this.oniCounting) return undefined;

		let hiderCount = 0;
		let taggedCount = 0;
		for (const [, state] of this.playerStates) {
			if (state.role === PlayerRole.Hider) {
				hiderCount++;
				if (state.isTagged) taggedCount++;
			}
		}

		if (hiderCount === 0) {
			return RoundResult.TimerExpired;
		}
		if (taggedCount >= hiderCount) {
			return RoundResult.OniWins;
		}
		return undefined;
	}

	getPlayerStates(): Map<number, AnyPlayerState> {
		return this.playerStates as Map<number, AnyPlayerState>;
	}

	handleKickCanRequest(_player: Player): boolean {
		return false;
	}

	handleSpiritWaveRequest(player: Player) {
		const state = this.playerStates.get(player.UserId);
		if (!state || state.role !== PlayerRole.Hider || !state.isTagged) return;
		const charges = this.spiritCharges.get(player.UserId) ?? 0;
		if (
			!canTriggerSpiritWave(
				charges,
				this.activeSpiritWaveCount,
				SCRAMBLE_MAX_ACTIVE_SPIRIT_WAVES,
			)
		)
			return;

		const wave = this.spawnCrowdWave(
			SCRAMBLE_SPIRIT_WAVE_DURATION,
			"Crowd Spirit! Extra cover for the hiders!",
		);
		if (wave.size() === 0) return;

		this.spiritCharges.set(player.UserId, 0);
		this.serverEvents.spiritChargeChanged.fire(player, 0);
		this.activeSpiritWaveCount += 1;
		task.delay(SCRAMBLE_SPIRIT_WAVE_DURATION + 1, () => {
			this.despawnCrowdNPCs(wave);
			this.activeSpiritWaveCount = math.max(0, this.activeSpiritWaveCount - 1);
		});
	}

	handleCatchRequest(player: Player) {
		const oniState = this.playerStates.get(player.UserId);
		if (!oniState || oniState.role !== PlayerRole.Oni) return;
		if (this.oniCounting) return;

		const oniChar = player.Character;
		if (!oniChar) return;
		const oniPos = oniChar.GetPivot().Position;

		let closestHider: Player | undefined;
		let closestDist = SCRAMBLE_TAG_RADIUS;

		for (const [userId, state] of this.playerStates) {
			if (state.role !== PlayerRole.Hider || state.isTagged) continue;
			const hiderPlayer = this.playerObjects.get(userId);
			if (!hiderPlayer?.Character) continue;
			const dist = oniPos.sub(
				hiderPlayer.Character.GetPivot().Position,
			).Magnitude;
			if (dist <= closestDist) {
				closestDist = dist;
				closestHider = hiderPlayer;
			}
		}

		if (!closestHider) return;
		const hiderState = this.playerStates.get(closestHider.UserId);
		if (!hiderState) return;

		hiderState.isTagged = true;
		oniState.catchCount += 1;
		this.spiritCharges.set(closestHider.UserId, 1);

		this.serverEvents.playerCaught.broadcast(closestHider.UserId);
		this.serverEvents.spiritChargeChanged.fire(closestHider, 1);
		this.lastHintText = fireHintText(
			this.serverEvents,
			`${closestHider.Name} was tagged!`,
			this.lastHintText,
		);
		print(
			`[ShibuyaScramble] ${closestHider.Name} tagged by ${player.Name} (${oniState.catchCount} tags)`,
		);
	}

	removePlayer(userId: number) {
		this.playerStates.delete(userId);
		this.playerObjects.delete(userId);
		this.slideCooldowns.delete(userId);
		this.spiritCharges.delete(userId);
	}

	stopCountdown() {
		this.oniCounting = false;
		stopOniCountdown(
			this.countdownThread,
			this.serverEvents,
			this.playerStates,
			this.playerObjects,
			DEFAULT_WALK_SPEED,
		);
		this.countdownThread = undefined;
		// Stop crowd wave loop immediately (called before cleanup during results display)
		this.crowdLoopRunning = false;
		if (this.crowdThread) {
			task.cancel(this.crowdThread);
			this.crowdThread = undefined;
		}
		this.despawnCrowdNPCs();
		this.carLoopRunning = false;
		if (this.carThread) {
			task.cancel(this.carThread);
			this.carThread = undefined;
		}
		this.despawnCarNPCs();
	}

	cleanup() {
		this.stopCountdown();
		this.crowdLoopRunning = false;
		if (this.crowdThread) {
			task.cancel(this.crowdThread);
			this.crowdThread = undefined;
		}
		this.despawnCrowdNPCs();
		this.carLoopRunning = false;
		if (this.carThread) {
			task.cancel(this.carThread);
			this.carThread = undefined;
		}
		this.despawnCarNPCs();
		this.lastHintText = "";
		this.playerStates.clear();
		this.playerObjects.clear();
		this.slideCooldowns.clear();
		this.spiritCharges.clear();
		this.activeSpiritWaveCount = 0;
	}

	private runCrowdLoop() {
		this.crowdLoopRunning = true;
		while (this.crowdLoopRunning) {
			task.wait(SCRAMBLE_CROWD_WAVE_INTERVAL);
			if (!this.crowdLoopRunning) break;
			const wave = this.spawnCrowdWave();
			task.wait(SCRAMBLE_CROWD_WAVE_DURATION + 2);
			if (!this.crowdLoopRunning) break;
			this.despawnCrowdNPCs(wave);
		}
	}

	private spawnCrowdWave(
		duration = SCRAMBLE_CROWD_WAVE_DURATION,
		hintText = "Crowd crossing — use them!",
	) {
		const waypointsFolder = Workspace.FindFirstChild("CrowdWaypoints");
		if (!waypointsFolder) return [];
		const noobTemplate = ServerStorage.FindFirstChild("NoobTemplate") as
			| Model
			| undefined;
		const waveNpcs: Model[] = [];

		const npcsPerPath = math.floor(SCRAMBLE_CROWD_NPC_COUNT / 4);
		for (let i = 1; i <= 4; i++) {
			const pathFolder = waypointsFolder.FindFirstChild(`Path${i}`);
			if (!pathFolder) continue;
			const startPart = pathFolder.FindFirstChild("Start") as
				| BasePart
				| undefined;
			const endPart = pathFolder.FindFirstChild("End") as BasePart | undefined;
			if (!startPart || !endPart) continue;

			for (let j = 0; j < npcsPerPath; j++) {
				const offset = new Vector3(
					(math.random() - 0.5) * 6,
					0,
					(math.random() - 0.5) * 6,
				);
				const npc = this.createCrowdNpc(
					noobTemplate,
					startPart.Position.add(offset),
					endPart.Position.add(offset),
					duration,
				);
				this.activeCrowdNPCs.push(npc);
				waveNpcs.push(npc);
			}
		}

		if (waveNpcs.size() === 0) return [];

		this.serverEvents.crowdWaveStarted.broadcast(4);
		this.lastHintText = fireHintText(
			this.serverEvents,
			hintText,
			this.lastHintText,
		);

		return waveNpcs;
	}

	private createCrowdNpc(
		template: Model | undefined,
		startPos: Vector3,
		endPos: Vector3,
		duration: number,
	): Model {
		if (template) {
			const npc = template.Clone();
			for (const desc of npc.GetDescendants()) {
				if (desc.IsA("BasePart")) {
					desc.CanCollide = false;
					desc.CanTouch = false;
					desc.CanQuery = false;
				}
			}
			const hrp = npc.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (hrp) {
				hrp.Anchored = true;
				hrp.CFrame = new CFrame(startPos);
				npc.Parent = Workspace;
				TweenService.Create(
					hrp,
					new TweenInfo(duration, Enum.EasingStyle.Linear),
					{ CFrame: new CFrame(endPos) },
				).Play();
			} else {
				npc.PivotTo(new CFrame(startPos));
				npc.Parent = Workspace;
			}
			return npc;
		}
		// Fallback: gray Part model
		const fallback = new Instance("Model");
		const body = new Instance("Part");
		body.Name = "HumanoidRootPart";
		body.Size = new Vector3(1, 3, 1);
		body.Anchored = true;
		body.CanCollide = false;
		body.CanTouch = false;
		body.CanQuery = false;
		body.Color = Color3.fromRGB(150, 150, 150);
		body.CFrame = new CFrame(startPos);
		body.Parent = fallback;
		fallback.PrimaryPart = body;
		fallback.Parent = Workspace;
		TweenService.Create(
			body,
			new TweenInfo(duration, Enum.EasingStyle.Linear),
			{ CFrame: new CFrame(endPos) },
		).Play();
		return fallback;
	}

	private despawnCrowdNPCs(npcs = this.activeCrowdNPCs) {
		for (const npc of npcs) {
			npc.Destroy();
		}
		this.activeCrowdNPCs = this.activeCrowdNPCs.filter(
			(npc) => !npcs.includes(npc),
		);
	}

	private runCarLoop() {
		this.carLoopRunning = true;
		while (this.carLoopRunning) {
			task.wait(SCRAMBLE_CAR_SPAWN_INTERVAL);
			if (!this.carLoopRunning) break;
			const wave = this.spawnCarWave();
			task.wait(SCRAMBLE_CAR_WAVE_DURATION);
			if (!this.carLoopRunning) break;
			this.awardDodgeCars(wave);
			this.despawnCarNPCs(wave);
		}
	}

	private spawnCarWave(): Model[] {
		const carWP = ServerStorage.FindFirstChild("CarWaypoints");
		if (!carWP) return [];

		const templateNames = ["CarTemplate_1", "CarTemplate_2", "CarTemplate_3"];
		const wave: Model[] = [];

		for (let i = 1; i <= 3; i++) {
			const pathFolder = carWP.FindFirstChild(`Path${i}`);
			if (!pathFolder) continue;
			const startPart = pathFolder.FindFirstChild("Start") as
				| BasePart
				| undefined;
			const endPart = pathFolder.FindFirstChild("End") as BasePart | undefined;
			if (!startPart || !endPart) continue;

			const templateName =
				templateNames[math.random(0, templateNames.size() - 1)];
			const template = ServerStorage.FindFirstChild(templateName) as
				| Model
				| undefined;
			if (!template) continue;

			const car = template.Clone();
			// Only PrimaryPart anchored; rest unanchored so welded parts follow tween
			const primary = car.PrimaryPart;
			for (const desc of car.GetDescendants()) {
				if (desc.IsA("BasePart")) {
					desc.Anchored = desc === primary;
					desc.CanCollide = false;
					desc.CanTouch = false;
					desc.CanQuery = false;
				}
			}

			car.PivotTo(new CFrame(startPart.Position));
			car.Parent = Workspace;

			if (primary) {
				TweenService.Create(
					primary,
					new TweenInfo(SCRAMBLE_CAR_SPEED_DURATION, Enum.EasingStyle.Linear),
					{ CFrame: new CFrame(endPart.Position) },
				).Play();
			}

			this.activeCarNPCs.push(car);
			wave.push(car);
		}

		if (wave.size() > 0) {
			this.lastHintText = fireHintText(
				this.serverEvents,
				"Cars crossing! Watch out!",
				this.lastHintText,
			);
		}

		return wave;
	}

	/** Award DodgeCars mission to hiders alive when car wave ends. */
	private awardDodgeCars(wave: Model[]) {
		if (wave.size() === 0) return;

		for (const [userId, state] of this.playerStates) {
			if (state.role !== PlayerRole.Hider || state.isTagged) continue;
			const player = this.playerObjects.get(userId);
			if (!player?.Character) continue;
			const hrp = player.Character.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (!hrp) continue;

			// Only award if player was near at least one car during this wave
			let nearCar = false;
			for (const car of wave) {
				const primary = car.PrimaryPart;
				if (!primary) continue;
				if (
					hrp.Position.sub(primary.Position).Magnitude <=
					SCRAMBLE_CAR_DODGE_RADIUS
				) {
					nearCar = true;
					break;
				}
			}
			if (!nearCar) continue;

			state.carWavesSurvived += 1;
			this.missionService.incrementAndNotify(player, MissionId.DodgeCars, 1);
		}
	}

	private despawnCarNPCs(cars = this.activeCarNPCs) {
		for (const car of cars) {
			car.Destroy();
		}
		this.activeCarNPCs = this.activeCarNPCs.filter(
			(car) => !cars.includes(car),
		);
	}

	private handleSlideTouch(touching: BasePart, ramp: BasePart) {
		const character = touching.FindFirstAncestorOfClass("Model");
		if (!character) return;
		const player = Players.GetPlayerFromCharacter(character);
		if (!player) return;

		const state = this.playerStates.get(player.UserId);
		if (!state || state.isTagged || this.oniCounting) return;

		const now = os.clock();
		if (
			now - (this.slideCooldowns.get(player.UserId) ?? 0) <
			SCRAMBLE_SLIDE_COOLDOWN
		)
			return;
		this.slideCooldowns.set(player.UserId, now);

		const dir = ramp.CFrame.LookVector.add(
			new Vector3(0, SLIDE_DIR_Y_OFFSET, 0),
		).Unit;
		const rawSpeed = ramp.GetAttribute("SlideSpeed");
		const speed =
			typeIs(rawSpeed, "number") && rawSpeed > 0
				? rawSpeed
				: SCRAMBLE_SLIDE_SPEED;
		// Fire to client — matches LobbyService pattern; client applies speed locally
		this.serverEvents.slideImpulse.fire(player, dir, speed);
	}

	private teleportPlayers(players: Player[], roles: Map<Player, PlayerRole>) {
		const oniSpawns = CollectionService.GetTagged(ONI_SPAWN_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);
		const hiderSpawns = CollectionService.GetTagged(HIDER_SPAWN_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);

		let hiderIndex = 0;
		for (const player of players) {
			if (!player.Character) continue;
			const role = roles.get(player);
			if (role === PlayerRole.Oni) {
				const spawn = oniSpawns[0];
				if (spawn) {
					player.Character.PivotTo(
						new CFrame(spawn.Position.add(new Vector3(0, 3, 0))),
					);
				}
			} else {
				const spawnCount = hiderSpawns.size();
				if (spawnCount > 0) {
					player.Character.PivotTo(
						new CFrame(
							hiderSpawns[hiderIndex % spawnCount].Position.add(
								new Vector3(0, 3, 0),
							),
						),
					);
				}
				hiderIndex++;
			}
		}
	}

	private setOniWalkSpeed(speed: number) {
		for (const [userId, state] of this.playerStates) {
			if (state.role !== PlayerRole.Oni) continue;
			const player = this.playerObjects.get(userId);
			if (!player?.Character) continue;
			const humanoid = player.Character.FindFirstChildOfClass("Humanoid");
			if (humanoid) humanoid.WalkSpeed = speed;
		}
	}
}
