import { Janitor } from "@rbxts/janitor";
import { CollectionService, Players, Workspace } from "@rbxts/services";
import {
	ACTION_COOLDOWN,
	DEFAULT_WALK_SPEED,
	HACHI_ONI_EVOLUTION,
	HACHI_WALK_SPEEDS,
	SCRAMBLE_MOUNTED_TAG_RADIUS,
	SCRAMBLE_ONI_COUNT_DURATION,
	SCRAMBLE_SLIDE_COOLDOWN,
	SCRAMBLE_SLIDE_SPEED,
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
	VehicleId,
} from "shared/types";
import {
	equipHachiCostume,
	forceUnmount,
	isPlayerMounted,
	unequipHachiCostume,
} from "../../utils/hachiCostume";
import {
	fireHintText,
	startOniCountdown,
	stopOniCountdown,
} from "../../utils/oni-helpers";
import { getVehicleTemplate } from "../../utils/vehicleTemplate";
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
	private slideCooldowns = new Map<number, number>();
	private lastHintText = "";
	private lastAutoCatchTime = 0;
	private oniUserId?: number;

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
		const hiderSpawns = CollectionService.GetTagged(HIDER_SPAWN_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);
		if (hiderSpawns.size() === 0) {
			warn(
				"[ShibuyaScramble] Missing Studio asset: ShibuyaScrambleHiderSpawn — check map setup",
			);
		}

		// Handle mid-match respawns (player resets or falls off map)
		for (const player of players) {
			const conn = player.CharacterAdded.Connect(() => {
				task.wait(0.5);
				const state = this.playerStates.get(player.UserId);
				if (!state || !player.Character) return;
				if (state.isTagged) {
					// Tagged hiders: re-anchor and hide (they're in spectator mode)
					const character = player.Character;
					for (const part of character.GetDescendants()) {
						if (part.IsA("BasePart")) {
							part.Transparency = 1;
							part.CanCollide = false;
						} else if (part.IsA("Decal") || part.IsA("Texture")) {
							part.Transparency = 1;
						}
					}
					const hrp = character.FindFirstChild("HumanoidRootPart") as
						| BasePart
						| undefined;
					if (hrp) hrp.Anchored = true;
					const humanoid = character.FindFirstChildOfClass("Humanoid");
					if (humanoid) {
						humanoid.WalkSpeed = 0;
						humanoid.JumpHeight = 0;
					}
				} else if (state.role === PlayerRole.Oni) {
					// Oni: respawn near oni spawn
					const oniSpawns = CollectionService.GetTagged(ONI_SPAWN_TAG).filter(
						(i): i is BasePart => i.IsA("BasePart"),
					);
					if (oniSpawns.size() > 0) {
						player.Character.PivotTo(
							new CFrame(oniSpawns[0].Position.add(new Vector3(0, 3, 0))),
						);
					}
					this.mountOni(player);
				} else if (hiderSpawns.size() > 0) {
					// Hider: respawn at a random hider spawn
					const spawn = hiderSpawns[math.random(0, hiderSpawns.size() - 1)];
					player.Character.PivotTo(
						new CFrame(spawn.Position.add(new Vector3(0, 3, 0))),
					);
				}
			});
			matchJanitor.Add(conn);
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
			if (role === PlayerRole.Oni) this.oniUserId = player.UserId;
		}

		this.teleportPlayers(players, roles);

		// Auto-mount Oni on Hachi
		for (const player of players) {
			if (roles.get(player) === PlayerRole.Oni) {
				this.mountOni(player);
			}
		}

		return roles;
	}

	startRound() {
		this.oniCounting = true;
		this.setOniWalkSpeed(0);
		this.lastHintText = fireHintText(
			this.serverEvents,
			"hint_oni_counting",
			this.lastHintText,
			undefined,
			3,
		);

		this.countdownThread = startOniCountdown(
			this.serverEvents,
			SCRAMBLE_ONI_COUNT_DURATION,
			() => {
				if (!this.oniCounting) return;
				this.oniCounting = false;
				this.setOniWalkSpeed(HACHI_WALK_SPEEDS[0]);
				this.lastHintText = fireHintText(
					this.serverEvents,
					"hint_oni_hunting",
					this.lastHintText,
				);
			},
		);
	}

	tick(_dt: number) {
		if (this.oniCounting) return;
		this.checkAutoCatch();
	}

	private checkAutoCatch() {
		const now = os.clock();
		if (now - this.lastAutoCatchTime < ACTION_COOLDOWN) return;

		if (this.oniUserId === undefined) return;
		const oniPlayer = this.playerObjects.get(this.oniUserId);
		if (!oniPlayer?.Character) return;
		const oniHrp = oniPlayer.Character.FindFirstChild("HumanoidRootPart") as
			| BasePart
			| undefined;
		if (!oniHrp) return;

		const oniPos = oniHrp.Position;
		const mounted = isPlayerMounted(oniPlayer);
		const tagRadius = mounted
			? SCRAMBLE_MOUNTED_TAG_RADIUS
			: SCRAMBLE_TAG_RADIUS;

		let closestHider: Player | undefined;
		let closestDist = tagRadius;

		for (const [userId, state] of this.playerStates) {
			if (state.role !== PlayerRole.Hider || state.isTagged) continue;
			const hiderPlayer = this.playerObjects.get(userId);
			if (!hiderPlayer?.Character) continue;
			const hiderHrp = hiderPlayer.Character.FindFirstChild(
				"HumanoidRootPart",
			) as BasePart | undefined;
			if (!hiderHrp) continue;

			const dist = oniPos.sub(hiderHrp.Position).Magnitude;
			if (dist <= closestDist) {
				closestDist = dist;
				closestHider = hiderPlayer;
			}
		}

		if (!closestHider) return;

		this.lastAutoCatchTime = now;
		this.tagHider(oniPlayer, closestHider);
	}

	private tagHider(oniPlayer: Player, hider: Player) {
		const oniState = this.playerStates.get(oniPlayer.UserId);
		const hiderState = this.playerStates.get(hider.UserId);
		if (!oniState || !hiderState) return;

		hiderState.isTagged = true;
		oniState.catchCount += 1;

		this.serverEvents.playerCaught.broadcast(hider.UserId);

		// Hide tagged hider's character so they disappear from the map
		const character = hider.Character;
		if (character) {
			for (const part of character.GetDescendants()) {
				if (part.IsA("BasePart")) {
					part.Transparency = 1;
					part.CanCollide = false;
				} else if (part.IsA("Decal") || part.IsA("Texture")) {
					part.Transparency = 1;
				}
			}
			const hrp = character.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (hrp) {
				hrp.Anchored = true;
			}
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			if (humanoid) {
				humanoid.WalkSpeed = 0;
				humanoid.JumpHeight = 0;
			}
		}

		this.lastHintText = fireHintText(
			this.serverEvents,
			"hint_player_tagged",
			this.lastHintText,
			[hider.Name],
		);
		print(
			`[ShibuyaScramble] ${hider.Name} tagged by ${oniPlayer.Name} (${oniState.catchCount} tags)`,
		);
	}

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

	handleCatchRequest(_player: Player) {
		// Auto-catch in tick() handles all tagging now
	}

	removePlayer(userId: number) {
		this.playerStates.delete(userId);
		this.playerObjects.delete(userId);
		this.slideCooldowns.delete(userId);
	}

	stopCountdown() {
		this.oniCounting = false;
		stopOniCountdown(
			this.countdownThread,
			this.serverEvents,
			this.playerStates,
			this.playerObjects,
			HACHI_WALK_SPEEDS[0],
		);
		this.countdownThread = undefined;
	}

	cleanup() {
		this.stopCountdown();
		// Collect tagged hiders before iterating (LoadCharacter yields,
		// and a disconnect during the yield could modify playerStates)
		const taggedPlayers: Player[] = [];
		for (const [userId, state] of this.playerStates) {
			if (!state.isTagged) continue;
			const player = this.playerObjects.get(userId);
			if (player) taggedPlayers.push(player);
		}
		// Respawn tagged hiders (each call yields, safe since we're off the map now)
		for (const player of taggedPlayers) {
			task.spawn(() => player.LoadCharacter());
		}
		// Unequip Oni's Hachi mount before clearing state
		if (this.oniUserId !== undefined) {
			const oniPlayer = this.playerObjects.get(this.oniUserId);
			if (oniPlayer) {
				if (!unequipHachiCostume(oniPlayer)) {
					forceUnmount(oniPlayer);
				}
			}
		}
		this.lastHintText = "";
		this.lastAutoCatchTime = 0;
		this.oniUserId = undefined;
		this.playerStates.clear();
		this.playerObjects.clear();
		this.slideCooldowns.clear();
	}

	private mountOni(player: Player) {
		const hachiTemplate = getVehicleTemplate(VehicleId.DefaultHachi);
		if (!hachiTemplate) {
			warn("[ShibuyaScramble] HachiTemplate not found for Oni mount");
			return;
		}
		const hachiClone = hachiTemplate.Clone();
		if (!equipHachiCostume(player, hachiClone, HACHI_ONI_EVOLUTION)) {
			hachiClone.Destroy();
		}
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
