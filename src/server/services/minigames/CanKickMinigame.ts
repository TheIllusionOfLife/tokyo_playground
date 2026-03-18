import { Janitor } from "@rbxts/janitor";
import { ServerStorage, Workspace } from "@rbxts/services";
import {
	CAN_FREED_SPEED_BOOST,
	CAN_FREED_SPEED_BOOST_DURATION,
	CAN_KICK_RADIUS,
	CAN_RATTLE_TARGET,
	CAN_RELOCATE_INTERVAL,
	DEFAULT_WALK_SPEED,
	ONI_CATCH_RADIUS,
	ONI_COUNT_DURATION,
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
	fireHintText,
	startOniCountdown,
	stopOniCountdown,
} from "../../utils/oni-helpers";
import { IMinigame } from "./MinigameBase";

type ServerEvents = ReturnType<typeof GlobalEvents.createServer>;

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
			"Oni is counting... Hide!",
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
					DEFAULT_WALK_SPEED,
				);
				this.lastHintText = fireHintText(
					this.serverEvents,
					"Oni is hunting! Run and hide!",
					this.lastHintText,
				);
			},
		);
	}

	tick(_dt: number) {
		if (this.oniCounting || !this.canModel || !this.canOrigin) return;
		this.canRelocateElapsed += _dt;
		if (this.canRelocateElapsed < CAN_RELOCATE_INTERVAL) return;
		this.canRelocateElapsed = 0;

		const sockets = [
			new Vector3(0, 0, 0),
			new Vector3(18, 0, 12),
			new Vector3(-16, 0, -10),
		];
		this.canSocketIndex = (this.canSocketIndex + 1) % sockets.size();
		const nextPosition = this.canOrigin.add(sockets[this.canSocketIndex]);
		this.canModel.PivotTo(new CFrame(nextPosition));
		this.lastHintText = fireHintText(
			this.serverEvents,
			"The can rolled to a new alley!",
			this.lastHintText,
		);
	}

	handleCatchRequest(player: Player) {
		const oniState = this.playerStates.get(player.UserId);
		if (!oniState || oniState.role !== PlayerRole.Oni) return;
		if (this.oniCounting) return;

		const oniChar = player.Character;
		if (!oniChar) return;
		const oniPos = oniChar.GetPivot().Position;

		// Find closest uncaught hider in range
		let closestHider: Player | undefined;
		let closestDist = ONI_CATCH_RADIUS;

		for (const [userId, state] of this.playerStates) {
			if (state.role !== PlayerRole.Hider || state.isCaught) continue;
			const hiderPlayer = this.playerObjects.get(userId);
			if (!hiderPlayer?.Character) continue;

			const hiderPos = hiderPlayer.Character.GetPivot().Position;
			const dist = oniPos.sub(hiderPos).Magnitude;
			if (dist <= closestDist) {
				closestDist = dist;
				closestHider = hiderPlayer;
			}
		}

		if (!closestHider) return;

		const hiderState = this.playerStates.get(closestHider.UserId);
		if (!hiderState) return;

		// Mark caught
		hiderState.isCaught = true;
		hiderState.isInJail = true;
		oniState.catchCount += 1;

		// Teleport to jail
		if (this.jailZone && closestHider.Character) {
			closestHider.Character.PivotTo(
				new CFrame(this.jailZone.Position.add(new Vector3(0, 3, 0))),
			);
		}

		this.serverEvents.playerCaught.broadcast(closestHider.UserId);
		this.lastHintText = fireHintText(
			this.serverEvents,
			`${closestHider.Name} was caught!`,
			this.lastHintText,
		);
		print(
			`[CanKick] ${closestHider.Name} caught by ${player.Name} (${oniState.catchCount} catches)`,
		);
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
			this.serverEvents.hintTextChanged.fire(
				player,
				`RATTLE ${this.rattleProgress}/${CAN_RATTLE_TARGET}`,
			);
			if (this.rattleProgress >= CAN_RATTLE_TARGET) {
				this.rattleProgress = 0;
				for (const [userId, state] of this.playerStates) {
					if (state.isInJail) this.boostEligible.add(userId);
					if (state.role !== PlayerRole.Hider) continue;
					const hider = this.playerObjects.get(userId);
					if (hider) {
						this.serverEvents.hintTextChanged.fire(
							hider,
							"Jail rattled! Oni revealed for 2 seconds!",
						);
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

		this.lastHintText = fireHintText(
			this.serverEvents,
			`${player.Name} kicked the can! ${freedIds.size()} freed!`,
			this.lastHintText,
		);
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
			DEFAULT_WALK_SPEED,
		);
		this.countdownThread = undefined;
	}

	cleanup() {
		// stopCountdown unfreezes Oni and cancels the thread — must run before clearing playerStates
		this.stopCountdown();
		this.lastHintText = "";
		this.oniUserId = undefined;
		this.canRelocateElapsed = 0;
		this.canSocketIndex = 0;
		this.canOrigin = undefined;
		this.rattleProgress = 0;
		this.boostEligible.clear();
		this.playerStates.clear();
		this.playerObjects.clear();
		this.canModel = undefined;
		this.jailZone = undefined;
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
