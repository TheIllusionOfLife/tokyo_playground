import { Janitor } from "@rbxts/janitor";
import {
	CollectionService,
	Players,
	ServerStorage,
	TweenService,
	Workspace,
} from "@rbxts/services";
import {
	HACHI_BIG_SCALE,
	HACHI_COLLECTION_RADIUS,
	HACHI_EVOLUTION_THRESHOLDS,
	HACHI_ITEM_TAG,
	HACHI_ITEMS_TO_SPAWN,
	HACHI_JUMP_VELOCITY,
	HACHI_KEY_ITEM_TAG,
	HACHI_SPAWN_TAG,
	HACHI_WALK_SPEEDS,
	HACHI_WALL_RUN_MAX_DUR,
	HACHI_WALL_RUN_RAYCAST,
	HACHI_WALL_RUN_SPEED,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import {
	AnyPlayerState,
	HachiRidePlayerState,
	MinigameId,
	PlayerRole,
	RoundResult,
} from "shared/types";
import { IMinigame } from "./MinigameBase";

type ServerEvents = ReturnType<typeof GlobalEvents.createServer>;

interface WallRunState {
	running: boolean;
	duration: number;
	normal: Vector3;
}

// Fisher-Yates shuffle for BasePart arrays
function shuffle(arr: BasePart[]): BasePart[] {
	const result = [...arr];
	for (let i = result.size() - 1; i > 0; i--) {
		const j = math.random(0, i);
		const tmp = result[i];
		result[i] = result[j];
		result[j] = tmp;
	}
	return result;
}

export class HachiRideMinigame implements IMinigame {
	readonly id = MinigameId.HachiRide;

	private playerStates = new Map<number, HachiRidePlayerState>();
	private playerObjects = new Map<number, Player>();
	private hachiModels = new Map<number, Model>();
	private activeItems: BasePart[] = [];
	private keyItems: BasePart[] = [];
	private wallRunStates = new Map<number, WallRunState>();
	private roundStarted = false;

	constructor(private readonly serverEvents: ServerEvents) {}

	prepare(players: Player[], matchJanitor: Janitor) {
		// Initialise per-player state
		for (const player of players) {
			this.playerStates.set(player.UserId, {
				minigameId: MinigameId.HachiRide,
				playerId: player.UserId,
				role: PlayerRole.None,
				itemCount: 0,
				evolutionLevel: 0,
				catchCount: 0,
				rescueCount: 0,
			});
			this.playerObjects.set(player.UserId, player);
		}

		// Set up collectible items — pick HACHI_ITEMS_TO_SPAWN from all anchors
		const allAnchors = CollectionService.GetTagged(HACHI_ITEM_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);
		if (allAnchors.size() === 0) {
			warn(
				"[HachiRide] Missing Studio asset: HachiCollectible — check map setup",
			);
		}
		const shuffled = shuffle(allAnchors);
		const chosen = shuffled.filter((_, idx) => idx < HACHI_ITEMS_TO_SPAWN);
		const unchosen = shuffled.filter((_, idx) => idx >= HACHI_ITEMS_TO_SPAWN);

		// Hide unchosen items
		for (const part of unchosen) {
			part.Transparency = 1;
			part.CanCollide = false;
			part.CanQuery = false;
		}
		// Show chosen items
		for (const part of chosen) {
			part.Transparency = 0;
			part.CanCollide = true;
			part.CanQuery = true;
			this.activeItems.push(part);
		}

		// Register cleanup: restore all anchors to hidden state
		matchJanitor.Add(() => {
			for (const part of allAnchors) {
				part.Transparency = 1;
				part.CanCollide = false;
				part.CanQuery = false;
			}
			this.activeItems = [];
		});

		// Key items — always visible
		this.keyItems = CollectionService.GetTagged(HACHI_KEY_ITEM_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);
		if (this.keyItems.size() === 0) {
			warn("[HachiRide] Missing Studio asset: HachiKeyItem — check map setup");
		}
		for (const item of this.keyItems) {
			item.Transparency = 0;
			item.CanCollide = true;
			item.CanQuery = true;
		}

		// Spawn points
		const spawnParts = CollectionService.GetTagged(HACHI_SPAWN_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);
		if (spawnParts.size() === 0) {
			warn(
				"[HachiRide] Missing Studio asset: HachiRideSpawn — check map setup",
			);
		}

		// Clone HachiTemplate for each player
		const templateRaw = ServerStorage.FindFirstChild("HachiTemplate");
		const template = templateRaw?.IsA("Model") ? templateRaw : undefined;
		if (!templateRaw) {
			warn(
				"[HachiRide] Missing ServerStorage.HachiTemplate — Hachi models will not spawn",
			);
		} else if (!template) {
			warn(
				"[HachiRide] ServerStorage.HachiTemplate is not a Model — Hachi models will not spawn",
			);
		}

		for (let i = 0; i < players.size(); i++) {
			const player = players[i];
			if (!template) break;

			const clone = template.Clone();
			clone.Name = `Hachi_${player.UserId}`;
			clone.Parent = Workspace;
			this.hachiModels.set(player.UserId, clone);
			matchJanitor.Add(clone);

			// Position near corresponding spawn
			if (spawnParts.size() > 0) {
				const spawnPart = spawnParts[i % spawnParts.size()];
				clone.PivotTo(new CFrame(spawnPart.Position.add(new Vector3(0, 3, 0))));
			}
		}

		// Re-spawn mid-match deaths back to observation deck (not lobby)
		for (const player of players) {
			const conn = player.CharacterAdded.Connect(() => {
				if (!this.roundStarted) return;
				task.wait(0.5);
				const spawnPart = spawnParts[0];
				if (spawnPart && player.Character) {
					player.Character.PivotTo(
						new CFrame(spawnPart.Position.add(new Vector3(0, 3, 0))),
					);
				}
			});
			matchJanitor.Add(conn);
		}

		// Hachi jump and eject requests from client
		matchJanitor.Add(
			this.serverEvents.hachiJump.connect((player) => {
				if (!this.roundStarted) return;
				this.handleJumpRequest(player);
			}),
		);
		matchJanitor.Add(
			this.serverEvents.hachiEject.connect((player) => {
				this.handleEjectRequest(player);
			}),
		);
	}

	assignRoles(players: Player[]): Map<Player, PlayerRole> {
		const roles = new Map<Player, PlayerRole>();

		const spawnParts = CollectionService.GetTagged(HACHI_SPAWN_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);

		for (let i = 0; i < players.size(); i++) {
			const player = players[i];
			roles.set(player, PlayerRole.None);
			const state = this.playerStates.get(player.UserId);
			if (state) state.role = PlayerRole.None;

			// Teleport to observation deck spawn
			if (player.Character && spawnParts.size() > 0) {
				const spawnPart = spawnParts[i % spawnParts.size()];
				player.Character.PivotTo(
					new CFrame(spawnPart.Position.add(new Vector3(0, 3, 0))),
				);
			}
		}

		this.serverEvents.hintTextChanged.broadcast(
			"Mount Hachi and jump! Collect trash! 3... 2... 1...",
		);
		return roles;
	}

	startRound() {
		this.roundStarted = true;
		this.serverEvents.hintTextChanged.broadcast(
			"Go! Collect as much trash as you can!",
		);
	}

	tick(dt: number) {
		if (!this.roundStarted) return;
		this.checkItemCollection();
		this.detectWallRun(dt);
	}

	checkWinCondition(): RoundResult | undefined {
		// Timer-based — MatchService handles expiry
		return undefined;
	}

	getPlayerStates(): Map<number, AnyPlayerState> {
		return this.playerStates as Map<number, AnyPlayerState>;
	}

	cleanup() {
		// Eject players from VehicleSeats before janitor destroys Hachi models
		for (const [, model] of this.hachiModels) {
			const seat = model.FindFirstChildOfClass("VehicleSeat") as
				| VehicleSeat
				| undefined;
			if (seat?.Occupant) {
				seat.Occupant.Jump = true;
			}
		}

		// Re-show key items
		for (const item of this.keyItems) {
			item.Transparency = 0;
		}

		// Release PlatformStand for any player still wall-running at round end
		for (const [userId, wallState] of this.wallRunStates) {
			if (!wallState.running) continue;
			const player = this.playerObjects.get(userId);
			const humanoid = player?.Character?.FindFirstChildOfClass("Humanoid");
			if (humanoid) humanoid.PlatformStand = false;
		}

		this.roundStarted = false;
		this.playerStates.clear();
		this.playerObjects.clear();
		this.hachiModels.clear();
		this.wallRunStates.clear();
		this.keyItems = [];
	}

	removePlayer(userId: number) {
		const player = this.playerObjects.get(userId);
		if (player) {
			// Stop wall run and reset PlatformStand if mid-wall-run
			const wallState = this.wallRunStates.get(userId);
			if (wallState?.running) {
				this.serverEvents.hachiWallRunStop.fire(player);
				const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
				if (humanoid) humanoid.PlatformStand = false;
			}
		}
		// Destroy the player's Hachi model immediately rather than waiting for
		// the round janitor, to avoid orphaned visible models mid-round.
		const hachiModel = this.hachiModels.get(userId);
		if (hachiModel) {
			hachiModel.Destroy();
			this.hachiModels.delete(userId);
		}
		this.playerStates.delete(userId);
		this.playerObjects.delete(userId);
		this.wallRunStates.delete(userId);
	}

	private handleJumpRequest(player: Player) {
		const hachiModel = this.hachiModels.get(player.UserId);
		if (!hachiModel) return;
		const body = hachiModel.FindFirstChild("Body") as BasePart | undefined;
		if (!body) return;
		body.AssemblyLinearVelocity = new Vector3(
			body.AssemblyLinearVelocity.X,
			HACHI_JUMP_VELOCITY,
			body.AssemblyLinearVelocity.Z,
		);
	}

	private handleEjectRequest(player: Player) {
		const hachiModel = this.hachiModels.get(player.UserId);
		if (!hachiModel) return;
		const seat = hachiModel.FindFirstChildOfClass("VehicleSeat") as
			| VehicleSeat
			| undefined;
		if (!seat) return;
		seat.Disabled = true;
		task.delay(0.1, () => {
			if (seat.Parent) seat.Disabled = false;
		});
	}

	private checkItemCollection() {
		for (const [userId, state] of this.playerStates) {
			const player = this.playerObjects.get(userId);
			if (!player?.Character) continue;
			const hrp = player.Character.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (!hrp) continue;
			const pos = hrp.Position;

			// Check regular collectible items
			const toRemove: BasePart[] = [];
			for (const item of this.activeItems) {
				if (!item.Parent) {
					toRemove.push(item);
					continue;
				}
				if (pos.sub(item.Position).Magnitude <= HACHI_COLLECTION_RADIUS) {
					item.Transparency = 1;
					item.CanCollide = false;
					item.CanQuery = false;
					toRemove.push(item);
					this.onItemCollected(userId, state, player);
				}
			}
			for (const item of toRemove) {
				const idx = this.activeItems.indexOf(item);
				if (idx !== -1) this.activeItems.remove(idx);
			}

			// Check key items
			for (const item of this.keyItems) {
				if (!item.Parent) continue;
				if (item.Transparency === 1) continue; // already collected this session
				if (pos.sub(item.Position).Magnitude <= HACHI_COLLECTION_RADIUS) {
					item.Transparency = 1;
					item.CanCollide = false;
					item.CanQuery = false;
					this.onItemCollected(userId, state, player);
				}
			}
		}
	}

	private onItemCollected(
		userId: number,
		state: HachiRidePlayerState,
		player: Player,
	) {
		state.itemCount += 1;
		state.catchCount = state.itemCount; // mirror for scoreboard
		this.serverEvents.hachiItemCollected.fire(player, state.itemCount);
		this.tryEvolve(userId, state, player);
	}

	private tryEvolve(
		userId: number,
		state: HachiRidePlayerState,
		player: Player,
	) {
		let newLevel = state.evolutionLevel;
		for (
			let level = HACHI_EVOLUTION_THRESHOLDS.size() - 1;
			level >= 0;
			level--
		) {
			if (state.itemCount >= HACHI_EVOLUTION_THRESHOLDS[level]) {
				newLevel = level;
				break;
			}
		}

		if (newLevel <= state.evolutionLevel) return;
		state.evolutionLevel = newLevel;

		this.serverEvents.hachiEvolved.fire(player, newLevel);

		// Level 1: grant double jump
		if (newLevel === 1) {
			this.serverEvents.hachiDoubleJumpGranted.fire(player);
		}

		// Level 3: grow Hachi bigger + speed boost
		if (newLevel === 3) {
			const hachiModel = this.hachiModels.get(userId);
			if (hachiModel) {
				// Scale all BaseParts in the model
				for (const part of hachiModel.GetDescendants()) {
					if (part.IsA("BasePart") && !part.IsA("UnionOperation")) {
						TweenService.Create(
							part,
							new TweenInfo(0.5, Enum.EasingStyle.Quad),
							{ Size: part.Size.mul(HACHI_BIG_SCALE) },
						).Play();
					}
				}
			}
		}

		// Level 4: fluffy pink-white color
		if (newLevel === 4) {
			const hachiModel = this.hachiModels.get(userId);
			if (hachiModel) {
				const fluffyColor = Color3.fromRGB(255, 182, 193);
				for (const part of hachiModel.GetDescendants()) {
					if (part.IsA("BasePart")) {
						TweenService.Create(part, new TweenInfo(1, Enum.EasingStyle.Quad), {
							Color: fluffyColor,
						}).Play();
					}
				}
			}
		}

		// Update WalkSpeed (on foot) and Hachi drive speed (while riding)
		const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
		if (humanoid) {
			humanoid.WalkSpeed =
				HACHI_WALK_SPEEDS[math.min(newLevel, HACHI_WALK_SPEEDS.size() - 1)];
		}
		const hachiModel = this.hachiModels.get(userId);
		const seat = hachiModel?.FindFirstChildOfClass("VehicleSeat") as
			| VehicleSeat
			| undefined;
		if (seat) {
			seat.MaxSpeed =
				HACHI_WALK_SPEEDS[math.min(newLevel, HACHI_WALK_SPEEDS.size() - 1)];
		}

		this.serverEvents.hintTextChanged.fire(
			player,
			`Hachi evolved to level ${newLevel}!`,
		);

		print(
			`[HachiRide] ${player.Name} evolved to level ${newLevel} (${state.itemCount} items)`,
		);
	}

	private detectWallRun(dt: number) {
		for (const [userId, state] of this.playerStates) {
			if (state.evolutionLevel < 2) continue;
			const player = this.playerObjects.get(userId);
			if (!player?.Character) continue;
			const hrp = player.Character.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (!hrp) continue;
			const humanoid = player.Character.FindFirstChildOfClass("Humanoid");
			if (!humanoid) continue;

			// Only wall-run when airborne
			if (humanoid.FloorMaterial !== Enum.Material.Air) {
				const wallState = this.wallRunStates.get(userId);
				if (wallState?.running) {
					wallState.running = false;
					this.serverEvents.hachiWallRunStop.fire(player);
					humanoid.PlatformStand = false;
				}
				continue;
			}

			const rayParams = new RaycastParams();
			rayParams.FilterDescendantsInstances = [player.Character];
			rayParams.FilterType = Enum.RaycastFilterType.Exclude;

			// Cast left and right
			const left = hrp.CFrame.RightVector.mul(-HACHI_WALL_RUN_RAYCAST);
			const right = hrp.CFrame.RightVector.mul(HACHI_WALL_RUN_RAYCAST);
			const leftResult = Workspace.Raycast(hrp.Position, left, rayParams);
			const rightResult = Workspace.Raycast(hrp.Position, right, rayParams);

			// Prefer the closer wall; fall back to the other side if only one hit.
			let wallResult: RaycastResult | undefined;
			if (leftResult && rightResult) {
				const leftDist = hrp.Position.sub(leftResult.Position).Magnitude;
				const rightDist = hrp.Position.sub(rightResult.Position).Magnitude;
				wallResult = leftDist <= rightDist ? leftResult : rightResult;
			} else {
				wallResult = leftResult ?? rightResult;
			}

			if (wallResult) {
				let wallState = this.wallRunStates.get(userId);
				if (!wallState) {
					wallState = {
						running: false,
						duration: 0,
						normal: wallResult.Normal,
					};
					this.wallRunStates.set(userId, wallState);
				}

				if (!wallState.running) {
					wallState.running = true;
					wallState.duration = 0;
					wallState.normal = wallResult.Normal;
					this.serverEvents.hachiWallRunStart.fire(player, wallResult.Normal);
					humanoid.PlatformStand = true;
					// Velocity is applied client-side each Heartbeat to avoid
					// network ownership conflicts and physics jitter.
				} else {
					wallState.duration += dt;
					if (wallState.duration >= HACHI_WALL_RUN_MAX_DUR) {
						wallState.running = false;
						this.serverEvents.hachiWallRunStop.fire(player);
						humanoid.PlatformStand = false;
					}
				}
			} else {
				const wallState = this.wallRunStates.get(userId);
				if (wallState?.running) {
					wallState.running = false;
					this.serverEvents.hachiWallRunStop.fire(player);
					humanoid.PlatformStand = false;
				}
			}
		}
	}
}
