import { Janitor } from "@rbxts/janitor";
import { ServerStorage, Workspace } from "@rbxts/services";
import {
	ACTION_COOLDOWN,
	CAN_FREED_SPEED_BOOST,
	CAN_FREED_SPEED_BOOST_DURATION,
	CAN_KICK_RADIUS,
	CAN_RATTLE_TARGET,
	CAN_RELOCATE_INTERVAL,
	DEFAULT_WALK_SPEED,
	HACHI_WALK_SPEEDS,
	ONI_CATCH_RADIUS,
	ONI_COUNT_DURATION,
	ONI_MOUNTED_CATCH_RADIUS,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import {
	AnyPlayerState,
	CanKickPlayerState,
	MinigameId,
	PlayerRole,
	RoundResult,
} from "shared/types";
import { isInsideJailRattleZone } from "shared/utils/canKickRattle";
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
import { IMinigame } from "./MinigameBase";

type ServerEvents = ReturnType<typeof GlobalEvents.createServer>;
const CAN_SOCKET_OFFSETS = [
	new Vector3(0, 0, 0),
	new Vector3(18, 0, 12),
	new Vector3(-16, 0, -10),
];

export class CanKickMinigame implements IMinigame {
	readonly id = MinigameId.CanKick;

	private playerStates = new Map<number, CanKickPlayerState>();
	private playerObjects = new Map<number, Player>();
	private canModel?: Model;
	private jailZone?: Part;
	private oniCounting = false;
	private countdownThread?: thread;
	private lastHintText = "";
	private oniUserId?: number;
	private canRelocateElapsed = 0;
	private canSocketIndex = 0;
	private canOrigin?: Vector3;
	private rattleProgress = 0;
	private readonly boostEligible = new Set<number>();
	private lastAutoCatchTime = 0;

	constructor(private readonly serverEvents: ServerEvents) {}

	prepare(players: Player[], matchJanitor: Janitor) {
		// Clone GiantCan from ServerStorage
		const canTemplate = ServerStorage.FindFirstChild("GiantCan") as
			| Model
			| undefined;
		if (canTemplate) {
			this.canModel = canTemplate.Clone();
			this.canModel.Parent = Workspace;
			matchJanitor.Add(this.canModel);
			this.canOrigin = this.canModel.GetPivot().Position;
		} else {
			warn("[CanKick] GiantCan not found in ServerStorage");
		}

		// Clone JailZone from ServerStorage
		const jailTemplate = ServerStorage.FindFirstChild("JailZone") as
			| Part
			| undefined;
		if (jailTemplate) {
			this.jailZone = jailTemplate.Clone();
			this.jailZone.Parent = Workspace;
			matchJanitor.Add(this.jailZone);
		} else {
			warn("[CanKick] JailZone not found in ServerStorage");
		}

		// Initialize player states
		for (const player of players) {
			this.playerStates.set(player.UserId, {
				minigameId: MinigameId.CanKick,
				playerId: player.UserId,
				role: PlayerRole.None,
				isCaught: false,
				isInJail: false,
				rescueCount: 0,
				catchCount: 0,
			});
			this.playerObjects.set(player.UserId, player);
		}
	}

	assignRoles(players: Player[]): Map<Player, PlayerRole> {
		const roles = new Map<Player, PlayerRole>();
		if (players.size() === 0) return roles;

		// Random Oni selection
		const oniIndex = math.random(0, players.size() - 1);
		for (let i = 0; i < players.size(); i++) {
			const player = players[i];
			const role = i === oniIndex ? PlayerRole.Oni : PlayerRole.Hider;
			roles.set(player, role);

			const state = this.playerStates.get(player.UserId);
			if (state) {
				state.role = role;
			}
			if (role === PlayerRole.Oni) {
				this.oniUserId = player.UserId;
			}
		}

		// Teleport players to positions
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
		// Oni counting phase
		this.oniCounting = true;

		// Freeze Oni
		for (const [userId, state] of this.playerStates) {
			if (state.role === PlayerRole.Oni) {
				const player = this.playerObjects.get(userId);
				if (player?.Character) {
					const humanoid = player.Character.FindFirstChildOfClass("Humanoid");
					if (humanoid) {
						humanoid.WalkSpeed = 0;
					}
				}
			}
		}

		this.lastHintText = fireHintText(
			this.serverEvents,
			"hint_oni_counting",
			this.lastHintText,
		);

		this.countdownThread = startOniCountdown(
			this.serverEvents,
			ONI_COUNT_DURATION,
			() => {
				if (!this.oniCounting) return;
				this.oniCounting = false;
				stopOniCountdown(
					undefined,
					this.serverEvents,
					this.playerStates,
					this.playerObjects,
					HACHI_WALK_SPEEDS[0],
				);
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

		// Auto-catch: check if Oni is near any uncaught hider
		this.checkAutoCatch();

		// Can relocation
		if (!this.canModel || !this.canOrigin) return;
		this.canRelocateElapsed += _dt;
		if (this.canRelocateElapsed < CAN_RELOCATE_INTERVAL) return;
		this.canRelocateElapsed = 0;

		this.canSocketIndex = (this.canSocketIndex + 1) % CAN_SOCKET_OFFSETS.size();
		const nextPosition = this.canOrigin.add(
			CAN_SOCKET_OFFSETS[this.canSocketIndex],
		);
		this.canModel.PivotTo(new CFrame(nextPosition));
		this.lastHintText = fireHintText(
			this.serverEvents,
			"hint_can_moved",
			this.lastHintText,
		);
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
		const catchRadius = mounted ? ONI_MOUNTED_CATCH_RADIUS : ONI_CATCH_RADIUS;

		// Find closest uncaught hider in range
		let closestHider: Player | undefined;
		let closestDist = catchRadius;

		for (const [userId, state] of this.playerStates) {
			if (state.role !== PlayerRole.Hider || state.isCaught) continue;
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
		this.catchHider(oniPlayer, closestHider);
	}

	private catchHider(oniPlayer: Player, hider: Player) {
		const oniState = this.playerStates.get(oniPlayer.UserId);
		const hiderState = this.playerStates.get(hider.UserId);
		if (!oniState || !hiderState) return;

		// Mark caught
		hiderState.isCaught = true;
		hiderState.isInJail = true;
		oniState.catchCount += 1;

		// Fire catch events first so red flash is visible before jail fade
		this.serverEvents.playerCaught.broadcast(hider.UserId);
		this.serverEvents.catchHighlight.broadcast(hider.UserId);

		// Fire jail teleport fade after a brief delay so red flash shows first
		task.delay(0.3, () => {
			this.serverEvents.jailTeleportFade.fire(hider);
		});

		// Teleport to jail after fade-in completes (0.3s flash + 0.2s fade buffer)
		const caughtCharacter = hider.Character;
		const hiderId = hider.UserId;
		task.delay(0.5, () => {
			// Only teleport if still the same character, still in jail (not freed by can kick)
			const hiderState2 = this.playerStates.get(hiderId);
			if (
				this.jailZone &&
				hiderState2?.isInJail &&
				hider.Character &&
				hider.Character === caughtCharacter
			) {
				hider.Character.PivotTo(
					new CFrame(this.jailZone.Position.add(new Vector3(0, 3, 0))),
				);
			}
		});
		this.lastHintText = fireHintText(
			this.serverEvents,
			"hint_player_caught",
			this.lastHintText,
			[hider.Name],
		);
		print(
			`[CanKick] ${hider.Name} caught by ${oniPlayer.Name} (${oniState.catchCount} catches)`,
		);
	}

	handleCatchRequest(player: Player) {
		// Auto-catch handles this now; keep for backward compat but no-op
		const oniState = this.playerStates.get(player.UserId);
		if (!oniState || oniState.role !== PlayerRole.Oni) return;
		// No-op: auto-catch in tick() handles all catches
	}

	handleKickCanRequest(player: Player): boolean {
		const kickerState = this.playerStates.get(player.UserId);
		if (!kickerState || kickerState.role !== PlayerRole.Hider) return false;
		if (this.oniCounting) return false;
		if (kickerState.isCaught) {
			const kickerChar = player.Character;
			if (!kickerState.isInJail || !kickerChar || !this.jailZone) return false;
			const localPos = this.jailZone.CFrame.PointToObjectSpace(
				kickerChar.GetPivot().Position,
			);
			const halfSize = this.jailZone.Size.mul(0.5);
			if (!isInsideJailRattleZone(localPos, halfSize)) return false;

			this.rattleProgress = math.min(
				this.rattleProgress + 1,
				CAN_RATTLE_TARGET,
			);
			this.serverEvents.hintTextChanged.fire(player, "hint_rattle_progress", [
				`${this.rattleProgress}`,
				`${CAN_RATTLE_TARGET}`,
			]);
			if (this.rattleProgress >= CAN_RATTLE_TARGET) {
				this.rattleProgress = 0;
				for (const [userId, state] of this.playerStates) {
					if (state.isInJail) this.boostEligible.add(userId);
					if (state.role !== PlayerRole.Hider) continue;
					const hider = this.playerObjects.get(userId);
					if (hider) {
						this.serverEvents.hintTextChanged.fire(hider, "hint_jail_rattled");
					}
				}
				if (this.oniUserId !== undefined) {
					this.serverEvents.oniReveal.broadcast(this.oniUserId, 2);
				}
			}
			return false;
		}

		// Check proximity to can
		const kickerChar = player.Character;
		if (!kickerChar || !this.canModel) return false;

		const kickerPos = kickerChar.GetPivot().Position;
		const canPos = this.canModel.GetPivot().Position;
		const dist = kickerPos.sub(canPos).Magnitude;

		if (dist > CAN_KICK_RADIUS) return false;

		// Free all jailed players
		const freedIds: number[] = [];
		for (const [userId, state] of this.playerStates) {
			if (state.isInJail) {
				state.isCaught = false;
				state.isInJail = false;
				freedIds.push(userId);

				// Teleport freed players near can
				const freedPlayer = this.playerObjects.get(userId);
				if (freedPlayer?.Character) {
					const offset = new Vector3(math.random(-5, 5), 3, math.random(-5, 5));
					freedPlayer.Character.PivotTo(new CFrame(canPos.add(offset)));
				}
			}
		}

		kickerState.rescueCount += freedIds.size();
		this.canRelocateElapsed = 0;

		this.serverEvents.canKicked.broadcast(player.UserId);
		if (this.canModel) {
			this.serverEvents.canKickVisual.broadcast(
				this.canModel.GetPivot().Position,
			);
		}
		if (freedIds.size() > 0) {
			this.serverEvents.playerFreed.broadcast(freedIds);
		}
		for (const freedId of freedIds) {
			if (!this.boostEligible.has(freedId)) continue;
			this.boostEligible.delete(freedId);
			const freedPlayer = this.playerObjects.get(freedId);
			const humanoid =
				freedPlayer?.Character?.FindFirstChildOfClass("Humanoid");
			if (!humanoid) continue;
			humanoid.WalkSpeed = CAN_FREED_SPEED_BOOST;
			task.delay(CAN_FREED_SPEED_BOOST_DURATION, () => {
				if (humanoid.Parent) humanoid.WalkSpeed = DEFAULT_WALK_SPEED;
			});
		}

		// Only announce the hero who kicked (not freed players)
		this.lastHintText = fireHintText(
			this.serverEvents,
			"hint_can_kicked",
			this.lastHintText,
			[player.Name],
		);
		// Send freed hiders a separate hint
		for (const freedId of freedIds) {
			const freedPlayer = this.playerObjects.get(freedId);
			if (freedPlayer) {
				this.serverEvents.hintTextChanged.fire(freedPlayer, "hint_freed_run");
			}
		}
		print(
			`[CanKick] ${player.Name} kicked the can, freed ${freedIds.size()} players`,
		);

		return true;
	}

	handleSpiritWaveRequest(_player: Player): void {}

	checkWinCondition(): RoundResult | undefined {
		if (this.oniCounting) return undefined;

		let hiderCount = 0;
		let caughtCount = 0;

		for (const [, state] of this.playerStates) {
			if (state.role === PlayerRole.Hider) {
				hiderCount++;
				if (state.isCaught) caughtCount++;
			}
		}

		if (hiderCount === 0) {
			return RoundResult.TimerExpired;
		}
		if (caughtCount >= hiderCount) {
			return RoundResult.OniWins;
		}

		return undefined;
	}

	getPlayerStates(): Map<number, AnyPlayerState> {
		return this.playerStates as Map<number, AnyPlayerState>;
	}

	removePlayer(userId: number) {
		this.playerStates.delete(userId);
		this.playerObjects.delete(userId);
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
		// stopCountdown unfreezes Oni and cancels the thread — must run before clearing playerStates
		this.stopCountdown();
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
		this.oniUserId = undefined;
		this.canRelocateElapsed = 0;
		this.canSocketIndex = 0;
		this.canOrigin = undefined;
		this.rattleProgress = 0;
		this.boostEligible.clear();
		this.lastAutoCatchTime = 0;
		this.playerStates.clear();
		this.playerObjects.clear();
		this.canModel = undefined;
		this.jailZone = undefined;
	}

	private mountOni(player: Player) {
		const hachiTemplate = ServerStorage.FindFirstChild("HachiTemplate") as
			| Model
			| undefined;
		if (!hachiTemplate) {
			warn("[CanKick] HachiTemplate not found for Oni mount");
			return;
		}
		const hachiClone = hachiTemplate.Clone();
		if (!equipHachiCostume(player, hachiClone, 0)) {
			hachiClone.Destroy();
		}
	}

	private teleportPlayers(players: Player[], roles: Map<Player, PlayerRole>) {
		for (const player of players) {
			const role = roles.get(player);
			if (!player.Character) continue;

			if (role === PlayerRole.Oni) {
				// Oni spawns near the can
				if (this.canModel) {
					const pos = this.canModel
						.GetPivot()
						.Position.add(new Vector3(5, 3, 0));
					player.Character.PivotTo(new CFrame(pos));
				}
			} else {
				// Hiders scatter around
				const angle = math.random() * math.pi * 2;
				const radius = math.random(30, 60);
				const offset = new Vector3(
					math.cos(angle) * radius,
					3,
					math.sin(angle) * radius,
				);
				const basePos = this.canModel
					? this.canModel.GetPivot().Position
					: new Vector3(0, 0, 0);
				player.Character.PivotTo(new CFrame(basePos.add(offset)));
			}
		}
	}
}
