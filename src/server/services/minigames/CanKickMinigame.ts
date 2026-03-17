import { Janitor } from "@rbxts/janitor";
import { ServerStorage, Workspace } from "@rbxts/services";
import {
	CAN_KICK_RADIUS,
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
		// Oni counting handled in startRound coroutine
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
		if (kickerState.isCaught) return false;
		if (this.oniCounting) return false;

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

		this.serverEvents.canKicked.broadcast(player.UserId);
		if (freedIds.size() > 0) {
			this.serverEvents.playerFreed.broadcast(freedIds);
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
