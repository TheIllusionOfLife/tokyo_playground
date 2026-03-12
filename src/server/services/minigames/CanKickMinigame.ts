import { Janitor } from "@rbxts/janitor";
import { ServerStorage, Workspace } from "@rbxts/services";
import {
	CAN_KICK_RADIUS,
	ONI_CATCH_RADIUS,
	ONI_COUNT_DURATION,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import {
	CanKickPlayerState,
	MinigameId,
	PlayerRole,
	RoundResult,
} from "shared/types";
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
			print("[CanKick] Warning: GiantCan not found in ServerStorage");
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
			print("[CanKick] Warning: JailZone not found in ServerStorage");
		}

		// Initialize player states
		for (const player of players) {
			this.playerStates.set(player.UserId, {
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

		this.fireHintText("Oni is counting... Hide!");

		// Countdown during counting
		this.countdownThread = task.spawn(() => {
			for (let i = ONI_COUNT_DURATION; i >= 1; i--) {
				if (!this.oniCounting) break;
				this.serverEvents.countdownTick.broadcast(i);
				task.wait(1);
			}

			// Clear countdown overlay now that counting is done
			this.serverEvents.countdownTick.broadcast(0);

			// Guard: if round ended during counting, do not run the tail
			if (!this.oniCounting) return;

			// Unfreeze Oni
			this.oniCounting = false;
			for (const [userId, state] of this.playerStates) {
				if (state.role === PlayerRole.Oni) {
					const player = this.playerObjects.get(userId);
					if (player?.Character) {
						const humanoid = player.Character.FindFirstChildOfClass("Humanoid");
						if (humanoid) {
							humanoid.WalkSpeed = 16;
						}
					}
				}
			}
			this.fireHintText("Oni is hunting! Run and hide!");
		});
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
		this.fireHintText(`${closestHider.Name} was caught!`);
		print(
			`[CanKick] ${closestHider.Name} caught by ${player.Name} (${oniState.catchCount} catches)`,
		);
	}

	handleKickCanRequest(player: Player): boolean {
		const kickerState = this.playerStates.get(player.UserId);
		if (!kickerState || kickerState.role !== PlayerRole.Hider) return false;
		if (kickerState.isCaught) return false;

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

		this.fireHintText(
			`${player.Name} kicked the can! ${freedIds.size()} freed!`,
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

		if (hiderCount === 0 || caughtCount >= hiderCount) {
			return RoundResult.OniWins;
		}

		return undefined;
	}

	getPlayerStates(): Map<number, CanKickPlayerState> {
		return this.playerStates;
	}

	removePlayer(userId: number) {
		this.playerStates.delete(userId);
		this.playerObjects.delete(userId);
	}

	stopCountdown() {
		this.oniCounting = false;
		// Clear countdown overlay on all clients immediately
		this.serverEvents.countdownTick.broadcast(0);
		if (this.countdownThread) {
			task.cancel(this.countdownThread);
			this.countdownThread = undefined;
		}
		// Unfreeze Oni — the coroutine tail is now skipped, so restore WalkSpeed here
		for (const [userId, state] of this.playerStates) {
			if (state.role === PlayerRole.Oni) {
				const player = this.playerObjects.get(userId);
				if (player?.Character) {
					const humanoid = player.Character.FindFirstChildOfClass("Humanoid");
					if (humanoid) {
						humanoid.WalkSpeed = 16;
					}
				}
			}
		}
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

	private fireHintText(text: string) {
		if (text === this.lastHintText) return;
		this.lastHintText = text;
		this.serverEvents.hintTextChanged.broadcast(text);
	}
}
