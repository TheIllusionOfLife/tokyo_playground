import { Janitor } from "@rbxts/janitor";
import {
	CollectionService,
	Players,
	TweenService,
	Workspace,
} from "@rbxts/services";
import {
	DEFAULT_WALK_SPEED,
	SCRAMBLE_CROWD_NPC_COUNT,
	SCRAMBLE_CROWD_WAVE_DURATION,
	SCRAMBLE_CROWD_WAVE_INTERVAL,
	SCRAMBLE_MAX_ACTIVE_SPIRIT_WAVES,
	SCRAMBLE_ONI_COUNT_DURATION,
	SCRAMBLE_ROOFTOP_TP_COOLDOWN,
	SCRAMBLE_ROOFTOP_TP_DEST,
	SCRAMBLE_ROOFTOP_TP_TAG,
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
	private activeCrowdNPCs: Part[] = [];
	private slideCooldowns = new Map<number, number>();
	private rooftopTpCooldowns = new Map<number, number>();
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

		// Connect rooftop teleport pad handlers
		const tpPads = CollectionService.GetTagged(SCRAMBLE_ROOFTOP_TP_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);
		if (tpPads.size() === 0) {
			warn(
				"[ShibuyaScramble] Missing Studio asset: ShibuyaRooftopTP — check map setup",
			);
		}
		for (const pad of tpPads) {
			matchJanitor.Add(
				pad.Touched.Connect((touching) => this.handleRooftopTpTouch(touching)),
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

		this.spiritCharges.set(player.UserId, 0);
		this.serverEvents.spiritChargeChanged.fire(player, 0);
		this.activeSpiritWaveCount += 1;
		const wave = this.spawnCrowdWave(
			SCRAMBLE_SPIRIT_WAVE_DURATION,
			"Crowd Spirit! Extra cover for the hiders!",
		);
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
		this.rooftopTpCooldowns.delete(userId);
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
	}

	cleanup() {
		this.stopCountdown();
		this.crowdLoopRunning = false;
		if (this.crowdThread) {
			task.cancel(this.crowdThread);
			this.crowdThread = undefined;
		}
		this.despawnCrowdNPCs();
		this.lastHintText = "";
		this.playerStates.clear();
		this.playerObjects.clear();
		this.slideCooldowns.clear();
		this.rooftopTpCooldowns.clear();
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
		this.serverEvents.crowdWaveStarted.broadcast(4);
		this.lastHintText = fireHintText(
			this.serverEvents,
			hintText,
			this.lastHintText,
		);

		const waypointsFolder = Workspace.FindFirstChild("CrowdWaypoints");
		if (!waypointsFolder) return [];
		const waveNpcs: Part[] = [];

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
					(math.random() - 0.5) * 4,
					0,
					(math.random() - 0.5) * 4,
				);

				const npcPart = new Instance("Part");
				npcPart.Size = new Vector3(1, 3, 1);
				npcPart.Anchored = true;
				npcPart.CanCollide = false;
				npcPart.CanTouch = false;
				npcPart.CanQuery = false;
				npcPart.Color = Color3.fromRGB(150, 150, 150);
				npcPart.Position = startPart.Position.add(offset);
				npcPart.Parent = Workspace;

				this.activeCrowdNPCs.push(npcPart);
				waveNpcs.push(npcPart);

				TweenService.Create(
					npcPart,
					new TweenInfo(duration, Enum.EasingStyle.Linear),
					{ Position: endPart.Position.add(offset) },
				).Play();
			}
		}

		return waveNpcs;
	}

	private despawnCrowdNPCs(npcs = this.activeCrowdNPCs) {
		for (const npc of npcs) {
			npc.Destroy();
		}
		this.activeCrowdNPCs = this.activeCrowdNPCs.filter(
			(npc) => !npcs.includes(npc),
		);
	}

	private handleRooftopTpTouch(touching: BasePart) {
		const character = touching.FindFirstAncestorOfClass("Model");
		if (!character) return;
		const player = Players.GetPlayerFromCharacter(character);
		if (!player) return;

		const state = this.playerStates.get(player.UserId);
		if (
			!state ||
			state.isTagged ||
			state.role === PlayerRole.Oni ||
			this.oniCounting
		)
			return;

		const now = os.clock();
		if (
			now - (this.rooftopTpCooldowns.get(player.UserId) ?? 0) <
			SCRAMBLE_ROOFTOP_TP_COOLDOWN
		)
			return;
		this.rooftopTpCooldowns.set(player.UserId, now);

		player.Character?.PivotTo(new CFrame(SCRAMBLE_ROOFTOP_TP_DEST));
		// Targeted hint — broadcasting would reveal a hider's position to the Oni
		this.serverEvents.hintTextChanged.fire(player, "You reached the rooftop!");
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

		if (state.role === PlayerRole.Hider) {
			this.missionService.onSlideUsed(player);
		}
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
