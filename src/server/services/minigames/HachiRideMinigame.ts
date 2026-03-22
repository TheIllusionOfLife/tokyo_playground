import { Janitor } from "@rbxts/janitor";
import {
	CollectionService,
	Players,
	ServerStorage,
	TweenService,
	Workspace,
} from "@rbxts/services";
import {
	HACHI_ANTICHEAT_CHECK_INTERVAL,
	HACHI_ANTICHEAT_GRACE_STUDS,
	HACHI_ANTICHEAT_STRIKE_DECAY,
	HACHI_ANTICHEAT_STRIKE_LIMIT,
	HACHI_BIG_SCALE,
	HACHI_BONUS_ITEM_COUNT,
	HACHI_BONUS_ITEM_VALUE,
	HACHI_COLLECTION_RADIUS,
	HACHI_DEFAULT_SCALE,
	HACHI_EJECT_COOLDOWN,
	HACHI_EJECT_SEAT_DISABLE_DURATION,
	HACHI_EVOLUTION_THRESHOLDS,
	HACHI_FINAL_SPRINT_MULTIPLIER,
	HACHI_FINAL_SPRINT_WINDOW,
	HACHI_HOTSPOT_MULTIPLIER,
	HACHI_HOTSPOT_RADIUS,
	HACHI_HOTSPOT_ROTATION_INTERVAL,
	HACHI_ITEM_TAG,
	HACHI_ITEMS_TO_SPAWN,
	HACHI_JUMP_COOLDOWN,
	HACHI_KEY_ITEM_TAG,
	HACHI_MAX_SPEED_TOLERANCE,
	HACHI_ROUND_DURATION,
	HACHI_SLIDE_FORCE_RESTORE_DELAY,
	HACHI_SPAWN_TAG,
	HACHI_WALK_SPEEDS,
	HACHI_WALL_RUN_MAX_DUR,
	HACHI_WALL_RUN_RAYCAST,
	HACHI_WALL_RUN_SPEED,
	SCRAMBLE_SLIDE_COOLDOWN,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import {
	AnyPlayerState,
	HachiRidePlayerState,
	MinigameId,
	PlayerRole,
	RoundResult,
} from "shared/types";
import { buildHachiRaceSnapshot } from "shared/utils/hachiRace";
import { animateHachi, HachiAnimState } from "../../utils/animateHachi";
import { animateItemCollect } from "../../utils/animateItemCollect";
import { IMinigame } from "./MinigameBase";

type ServerEvents = ReturnType<typeof GlobalEvents.createServer>;

interface WallRunState {
	running: boolean;
	duration: number;
	normal: Vector3;
	wallDir: Vector3;
	origMaxForce: Vector3;
}

interface Hotspot {
	center: Vector3;
	label: string;
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
	static activeInstance?: HachiRideMinigame;
	readonly id = MinigameId.HachiRide;

	private playerStates = new Map<number, HachiRidePlayerState>();
	private playerObjects = new Map<number, Player>();
	private hachiModels = new Map<number, Model>();
	private hachiAnimStates = new Map<number, HachiAnimState>();
	private activeItems: BasePart[] = [];
	private activeTweens: Tween[] = [];
	private bonusItems = new Set<BasePart>();
	private keyItems: BasePart[] = [];
	private spawnParts: BasePart[] = [];
	private wallRunStates = new Map<number, WallRunState>();
	private jumpCooldowns = new Map<number, number>();
	private ejectCooldowns = new Map<number, number>();
	private doubleJumpUsed = new Map<number, boolean>();
	private jumpPhase = new Map<number, number>();
	private jumpTime = new Map<number, number>();
	private lastPositions = new Map<number, Vector3>();
	private lastPositionTime = 0;
	private strikes = new Map<number, number>();
	private lastStrikeTime = new Map<number, number>();
	private hachiSlideActive = new Set<number>();
	private slideCooldowns = new Map<number, number>();
	private roundStarted = false;
	private respawnGrace = new Map<number, number>();
	private seatOccupantConns: RBXScriptConnection[] = [];
	private hotspots: Hotspot[] = [];
	private activeHotspotIndex = 0;
	private hotspotElapsed = 0;
	private roundElapsed = 0;
	private raceUpdateElapsed = 0;
	private finalSprintStarted = false;

	constructor(private readonly serverEvents: ServerEvents) {
		HachiRideMinigame.activeInstance = this;
	}

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
		// Show chosen items (CanCollide=false so they don't block Hachi)
		// First HACHI_BONUS_ITEM_COUNT items are bonus (shuffled = random)
		const originalColors = new Map<BasePart, Color3>();
		const originalSizes = new Map<BasePart, Vector3>();
		const originalCFrames = new Map<BasePart, CFrame>();
		for (let i = 0; i < chosen.size(); i++) {
			const part = chosen[i];
			originalCFrames.set(part, part.CFrame);
			originalSizes.set(part, part.Size);
			part.Transparency = 1; // Hidden until startRound
			part.CanCollide = false;
			part.CanQuery = false;
			this.activeItems.push(part);
			if (i < HACHI_BONUS_ITEM_COUNT) {
				// Mark as bonus: bigger, gold color
				this.bonusItems.add(part);
				originalColors.set(part, part.Color);
				part.Size = part.Size.mul(2.5);
				part.Color = Color3.fromRGB(255, 215, 0);
				part.Material = Enum.Material.Neon;
			}
		}
		this.hotspots = this.buildHotspots(chosen);

		// Register cleanup: cancel active tweens, restore all anchors to hidden state
		matchJanitor.Add(() => {
			for (const tween of this.activeTweens) {
				tween.Cancel();
			}
			this.activeTweens = [];
			for (const part of allAnchors) {
				part.Transparency = 1;
				part.CanCollide = false;
				part.CanQuery = false;
				// Restore original CFrame/Size for all items (animation may have changed them)
				const origCFrame = originalCFrames.get(part);
				if (origCFrame) part.CFrame = origCFrame;
				const origSize = originalSizes.get(part);
				if (origSize) part.Size = origSize;
				// Restore original color for bonus items
				const origColor = originalColors.get(part);
				if (origColor) part.Color = origColor;
			}
			this.activeItems = [];
			this.bonusItems.clear();
		});

		// Key items — always visible
		this.keyItems = CollectionService.GetTagged(HACHI_KEY_ITEM_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);
		if (this.keyItems.size() === 0) {
			warn("[HachiRide] Missing Studio asset: HachiKeyItem — check map setup");
		}
		for (let i = 0; i < this.keyItems.size(); i++) {
			const item = this.keyItems[i];
			item.Transparency = 1; // Hidden until round starts
			item.CanCollide = false;
			item.CanQuery = false;
			if (i === 0) this.bonusItems.add(item); // Only first key item is bonus
		}

		// Spawn points (cached for reuse in assignRoles)
		this.spawnParts = CollectionService.GetTagged(HACHI_SPAWN_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);
		const spawnParts = this.spawnParts;
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
			// Apply default scale (50% of template size).
			// ScaleTo handles all parts, welds, attachments, and joints uniformly.
			clone.ScaleTo(HACHI_DEFAULT_SCALE);
			// MaxSpeed=0.01: tiny so VehicleSeat barely moves, but Throttle/Steer
			// are still populated for client-side direct movement control.
			const cloneSeat = clone.FindFirstChildOfClass("VehicleSeat") as
				| VehicleSeat
				| undefined;
			if (cloneSeat) cloneSeat.MaxSpeed = 0.01;
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
				this.respawnGrace.set(player.UserId, os.clock());
				task.wait(0.5);
				const spawnPart = spawnParts[0];
				if (spawnPart && player.Character) {
					player.Character.PivotTo(
						new CFrame(spawnPart.Position.add(new Vector3(0, 3, 0))),
					);
					this.resetAnticheatBaseline(player.UserId, spawnPart.Position);
				}
			});
			matchJanitor.Add(conn);
		}

		// Force-reseat: if a player pops out of their Hachi during the round,
		// snap them back in using the authoritative Seat:Sit() API.
		for (const [userId, hachiModel] of this.hachiModels) {
			const seat = hachiModel.FindFirstChildOfClass("VehicleSeat") as
				| VehicleSeat
				| undefined;
			if (!seat) continue;
			const conn = seat.GetPropertyChangedSignal("Occupant").Connect(() => {
				if (seat.Occupant !== undefined) return; // Someone sat down, ignore
				if (!this.roundStarted) return;
				const player = this.playerObjects.get(userId);
				if (!player) return;
				// Skip during respawn grace period to avoid fighting the spawn system
				const graceTime = this.respawnGrace.get(userId) ?? 0;
				if (os.clock() - graceTime < 1.5) return;
				// Wait 1 frame to avoid single-frame physics glitches
				task.defer(() => {
					if (!this.roundStarted) return;
					if (seat.Occupant !== undefined) return; // Re-seated naturally
					const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
					if (!humanoid) {
						warn(
							`[HachiRide] Force-reseat skipped for userId ${userId}: humanoid nil (roundStarted=${this.roundStarted}, graceTime=${this.respawnGrace.get(userId) ?? 0})`,
						);
						return;
					}
					const hrp = player.Character?.FindFirstChild("HumanoidRootPart") as
						| BasePart
						| undefined;
					if (hrp) hrp.CFrame = seat.CFrame.add(new Vector3(0, 2, 0));
					seat.Sit(humanoid);
					humanoid.Jump = false;
				});
			});
			this.seatOccupantConns.push(conn);
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
		matchJanitor.Add(
			this.serverEvents.hachiDoubleJump.connect((player) => {
				if (!this.roundStarted) return;
				this.handleDoubleJumpEvent(player);
			}),
		);

		// Track slide state for anti-cheat exemption (rate-limited to prevent bypass)
		matchJanitor.Add(
			this.serverEvents.requestHachiSlide.connect((player) => {
				if (!this.roundStarted) return;
				if (!this.playerStates.has(player.UserId)) return;

				// Verify player is seated in their own Hachi
				const hachiModel = this.hachiModels.get(player.UserId);
				if (!hachiModel) return;
				const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
				const seat = hachiModel.FindFirstChildOfClass("VehicleSeat") as
					| VehicleSeat
					| undefined;
				if (!seat || !humanoid || seat.Occupant !== humanoid) return;

				const now = os.clock();
				if (
					now - (this.slideCooldowns.get(player.UserId) ?? 0) <
					SCRAMBLE_SLIDE_COOLDOWN
				)
					return;
				this.slideCooldowns.set(player.UserId, now);
				this.hachiSlideActive.add(player.UserId);
				task.delay(HACHI_SLIDE_FORCE_RESTORE_DELAY, () => {
					this.hachiSlideActive.delete(player.UserId);
				});
			}),
		);
	}

	assignRoles(players: Player[]): Map<Player, PlayerRole> {
		const roles = new Map<Player, PlayerRole>();
		const spawnParts = this.spawnParts;

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
				this.resetAnticheatBaseline(player.UserId, spawnPart.Position);
			}
		}

		this.serverEvents.hintTextChanged.broadcast(
			"Mount Hachi and jump! Collect trash! 3... 2... 1...",
		);
		return roles;
	}

	startRound() {
		this.roundStarted = true;
		this.roundElapsed = 0;
		this.hotspotElapsed = 0;
		this.raceUpdateElapsed = 0;
		this.finalSprintStarted = false;
		// Reveal all items now
		for (const item of this.activeItems) {
			item.Transparency = 0;
			item.CanQuery = true;
		}
		for (const item of this.keyItems) {
			item.Transparency = 0;
			item.CanQuery = true;
		}
		this.serverEvents.hintTextChanged.broadcast(
			"Go! Collect as much trash as you can!",
		);
		this.broadcastRaceState();
	}

	tick(dt: number) {
		if (!this.roundStarted) return;
		this.roundElapsed += dt;
		this.hotspotElapsed += dt;
		this.raceUpdateElapsed += dt;
		this.checkItemCollection();
		this.resetLandedJumps();
		this.detectWallRun(dt);
		this.tickHachiAnimation(dt);
		this.checkSpeedViolations(dt);
		this.updateHotspotState();
		if (this.raceUpdateElapsed >= 1) {
			this.raceUpdateElapsed = 0;
			this.broadcastRaceState();
		}
	}

	handleCatchRequest(_player: Player): void {}
	handleKickCanRequest(_player: Player): boolean {
		return false;
	}
	handleSpiritWaveRequest(_player: Player): void {}
	stopCountdown(): void {}

	checkWinCondition(): RoundResult | undefined {
		// Timer-based — MatchService handles expiry
		return undefined;
	}

	getPlayerStates(): Map<number, AnyPlayerState> {
		return this.playerStates as Map<number, AnyPlayerState>;
	}

	/** Admin debug: set evolution level for a player mid-match. */
	adminSetEvolution(player: Player, level: number) {
		const state = this.playerStates.get(player.UserId);
		if (!state) return;
		const userId = player.UserId;
		const hachiModel = this.hachiModels.get(userId);

		// Apply visual effects for each level up to target
		if (level >= 3 && state.evolutionLevel < 3 && hachiModel) {
			for (const part of hachiModel.GetDescendants()) {
				if (part.IsA("BasePart") && !part.IsA("UnionOperation")) {
					TweenService.Create(part, new TweenInfo(0.5, Enum.EasingStyle.Quad), {
						Size: part.Size.mul(HACHI_BIG_SCALE),
					}).Play();
				}
			}
		}
		if (level >= 4 && state.evolutionLevel < 4 && hachiModel) {
			const fluffyColor = Color3.fromRGB(255, 182, 193);
			for (const part of hachiModel.GetDescendants()) {
				if (part.IsA("BasePart")) {
					TweenService.Create(part, new TweenInfo(1, Enum.EasingStyle.Quad), {
						Color: fluffyColor,
					}).Play();
				}
			}
		}

		state.evolutionLevel = level;
		state.itemCount = level * 15;
		this.serverEvents.hachiEvolved.fire(player, level);
		this.serverEvents.hachiItemCollected.fire(player, state.itemCount);
		if (level >= 1) {
			this.serverEvents.hachiDoubleJumpGranted.fire(player);
		}
		this.serverEvents.hintTextChanged.fire(player, this.getAbilityText(level));
	}

	/** Admin debug: set item count and trigger evolution checks. */
	adminSetItems(player: Player, count: number) {
		const state = this.playerStates.get(player.UserId);
		if (!state) return;
		state.itemCount = count;
		state.catchCount = count;
		this.serverEvents.hachiItemCollected.fire(player, count);
		this.tryEvolve(player.UserId, state, player);
	}

	cleanup() {
		// Stop the round FIRST so the force-reseat Occupant.Changed handler
		// becomes a no-op and won't fight the eject loop below.
		this.roundStarted = false;
		HachiRideMinigame.activeInstance = undefined;

		// Disconnect seat occupant watchers before ejecting
		for (const conn of this.seatOccupantConns) {
			conn.Disconnect();
		}
		this.seatOccupantConns = [];

		// Eject players from VehicleSeats before janitor destroys Hachi models.
		// Use seat.Disabled=true (server-authoritative) instead of Jump=true,
		// because the client unconditionally suppresses Jump while seated.
		for (const [, model] of this.hachiModels) {
			const seat = model.FindFirstChildOfClass("VehicleSeat") as
				| VehicleSeat
				| undefined;
			if (seat?.Occupant) {
				seat.Disabled = true;
			}
		}

		// Re-show key items
		for (const item of this.keyItems) {
			item.Transparency = 0;
		}

		// Restore BodyVelocity for any Hachi still wall-running at round end
		for (const [userId] of this.wallRunStates) {
			const player = this.playerObjects.get(userId);
			if (player) this.stopWallRun(userId, player);
		}

		this.playerStates.clear();
		this.playerObjects.clear();
		this.hachiModels.clear();
		this.hachiAnimStates.clear();
		this.wallRunStates.clear();
		this.jumpCooldowns.clear();
		this.ejectCooldowns.clear();
		this.doubleJumpUsed.clear();
		this.jumpPhase.clear();
		this.jumpTime.clear();
		this.lastPositions.clear();
		this.lastPositionTime = 0;
		this.strikes.clear();
		this.lastStrikeTime.clear();
		this.hachiSlideActive.clear();
		this.slideCooldowns.clear();
		this.respawnGrace.clear();
		this.keyItems = [];
		this.spawnParts = [];
		this.hotspots = [];
		this.activeHotspotIndex = 0;
		this.hotspotElapsed = 0;
		this.roundElapsed = 0;
		this.raceUpdateElapsed = 0;
		this.finalSprintStarted = false;
	}

	removePlayer(userId: number) {
		const player = this.playerObjects.get(userId);
		if (player) {
			this.stopWallRun(userId, player);
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
		this.hachiAnimStates.delete(userId);
		this.wallRunStates.delete(userId);
		this.jumpCooldowns.delete(userId);
		this.ejectCooldowns.delete(userId);
		this.doubleJumpUsed.delete(userId);
		this.jumpPhase.delete(userId);
		this.jumpTime.delete(userId);
		this.lastPositions.delete(userId);
		this.strikes.delete(userId);
		this.lastStrikeTime.delete(userId);
		this.hachiSlideActive.delete(userId);
		this.slideCooldowns.delete(userId);
		this.respawnGrace.delete(userId);
	}

	private handleJumpRequest(player: Player) {
		const hachiModel = this.hachiModels.get(player.UserId);
		if (!hachiModel) return;

		// Verify player is actually seated in their Hachi before applying any effect.
		const seat = hachiModel.FindFirstChildOfClass("VehicleSeat") as
			| VehicleSeat
			| undefined;
		if (!seat) return;
		const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
		if (!humanoid || seat.Occupant !== humanoid) return;

		const now = os.clock();
		if (
			now - (this.jumpCooldowns.get(player.UserId) ?? 0) <
			HACHI_JUMP_COOLDOWN
		)
			return;

		const body = hachiModel.FindFirstChild("Body") as BasePart | undefined;
		if (!body) return;

		// Jump phase: 0 = grounded/ready, 1 = jumped once (double available), 2 = fully used
		const phase = this.jumpPhase.get(player.UserId) ?? 0;

		if (phase === 0) {
			// Ground check is done client-side (tryLocalJump). Server skips
			// the Y-velocity guard because the client applies impulse before
			// firing this event, so body.Y may already be high.
			this.jumpCooldowns.set(player.UserId, now);
			// Impulse is applied client-side for instant feel (client has
			// network ownership of the Hachi while seated in VehicleSeat).
			const state = this.playerStates.get(player.UserId);
			this.jumpPhase.set(
				player.UserId,
				state && state.evolutionLevel >= 1 ? 1 : 2,
			);
			this.jumpTime.set(player.UserId, now);
		} else if (phase === 1) {
			// Double jump (midair, evolution >= 1)
			this.jumpCooldowns.set(player.UserId, now);
			this.jumpPhase.set(player.UserId, 2);
		}
		// phase 2: reject
	}

	/** Reset jump phase when Hachi has landed (Y velocity settled after jump). */
	private resetLandedJumps() {
		const now = os.clock();
		for (const [userId] of this.playerStates) {
			const phase = this.jumpPhase.get(userId) ?? 0;
			if (phase === 0) continue; // Already ready
			const wallState = this.wallRunStates.get(userId);
			if (wallState?.running) continue; // Don't reset during wall-run
			const jumpT = this.jumpTime.get(userId) ?? 0;
			if (now - jumpT < 1.0) continue; // Too soon after jump (avoid apex false positive)
			const hachiModel = this.hachiModels.get(userId);
			const body = hachiModel?.FindFirstChild("Body") as BasePart | undefined;
			if (!body) continue;
			if (math.abs(body.AssemblyLinearVelocity.Y) < 5) {
				this.jumpPhase.set(userId, 0);
			}
		}
	}

	private handleEjectRequest(player: Player) {
		// Block voluntary eject during the round
		if (this.roundStarted) return;

		const hachiModel = this.hachiModels.get(player.UserId);
		if (!hachiModel) return;

		// Verify player is actually seated in their Hachi before applying any effect.
		const seat = hachiModel.FindFirstChildOfClass("VehicleSeat") as
			| VehicleSeat
			| undefined;
		if (!seat) return;
		const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
		if (!humanoid || seat.Occupant !== humanoid) return;

		const now = os.clock();
		if (
			now - (this.ejectCooldowns.get(player.UserId) ?? 0) <
			HACHI_EJECT_COOLDOWN
		)
			return;
		this.ejectCooldowns.set(player.UserId, now);

		seat.Disabled = true;
		task.delay(HACHI_EJECT_SEAT_DISABLE_DURATION, () => {
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

			// Use Hachi body position when seated — HRP sits ~5-8 studs above ground.
			// Use this.hachiModels to verify ownership (not tags — another player's
			// tagged Hachi would incorrectly shift collection position).
			const ownHachi = this.hachiModels.get(userId);
			const humanoid = player.Character.FindFirstChildOfClass("Humanoid");
			const seatPart = humanoid?.SeatPart;
			const isSeatedInOwnHachi =
				ownHachi !== undefined &&
				seatPart !== undefined &&
				seatPart.IsDescendantOf(ownHachi);
			const hachiBody = isSeatedInOwnHachi
				? (ownHachi.FindFirstChild("Body") as BasePart | undefined)
				: undefined;
			const pos = hachiBody?.Position ?? hrp.Position;

			// Check regular collectible items
			const toRemove: BasePart[] = [];
			for (const item of this.activeItems) {
				if (!item.Parent) {
					toRemove.push(item);
					continue;
				}
				if (pos.sub(item.Position).Magnitude <= HACHI_COLLECTION_RADIUS) {
					item.CanQuery = false;
					item.CanCollide = false;
					item.Transparency = 1;
					toRemove.push(item);
					this.onItemCollected(userId, state, player, item);
					const tween = animateItemCollect(item, this.bonusItems.has(item));
					this.activeTweens.push(tween);
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
					item.CanQuery = false;
					item.CanCollide = false;
					item.Transparency = 1;
					this.onItemCollected(userId, state, player, item);
					const tween = animateItemCollect(item, this.bonusItems.has(item));
					this.activeTweens.push(tween);
				}
			}
		}
	}

	private onItemCollected(
		userId: number,
		state: HachiRidePlayerState,
		player: Player,
		item: BasePart,
	) {
		const isBonus = this.bonusItems.has(item);
		const hotspotMultiplier = this.isInActiveHotspot(item.Position)
			? HACHI_HOTSPOT_MULTIPLIER
			: 1;
		const finalSprintMultiplier =
			this.finalSprintStarted && this.keyItems.includes(item)
				? HACHI_FINAL_SPRINT_MULTIPLIER
				: 1;
		const value =
			(isBonus ? HACHI_BONUS_ITEM_VALUE : 1) *
			hotspotMultiplier *
			finalSprintMultiplier;
		state.itemCount += value;
		state.catchCount = state.itemCount; // mirror for scoreboard
		if (isBonus) {
			// Fire bonus BEFORE item so the client's bonusThisFrame flag
			// is set when the item handler runs (both arrive same frame).
			this.serverEvents.hachiBonusCollected.fire(player);
			this.serverEvents.hintTextChanged.fire(
				player,
				`BONUS! +${value} points!`,
			);
		}
		// Always fire item event — HUD needs the count update.
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

		// Show ability description
		const abilityText = this.getAbilityText(newLevel);
		this.serverEvents.hintTextChanged.fire(player, abilityText);

		// Also show level-up in generic hint after a delay
		task.delay(3, () => {
			if (!this.roundStarted) return;
			this.serverEvents.hintTextChanged.fire(player, "Keep collecting!");
		});

		print(
			`[HachiRide] ${player.Name} evolved to level ${newLevel} (${state.itemCount} items)`,
		);
	}

	private getAbilityText(level: number): string {
		switch (level) {
			case 1:
				return "Level 1: DOUBLE JUMP unlocked! Press Space mid-air!";
			case 2:
				return "Level 2: WALL RUN unlocked! Jump near walls!";
			case 3:
				return "Level 3: BIG HACHI! Bigger and faster!";
			case 4:
				return "Level 4: FLUFFY HACHI! Maximum cuteness!";
			default:
				return `Hachi evolved to level ${level}!`;
		}
	}

	private buildHotspots(items: BasePart[]): Hotspot[] {
		if (items.size() === 0) return [];
		const labels = ["City Loop 1", "City Loop 2", "City Loop 3"];
		const samples = [
			items[0],
			items[math.floor(items.size() / 2)],
			items[items.size() - 1],
		];
		return samples.map((item, index) => ({
			center: item.Position,
			label: labels[index] ?? `Hotspot ${index + 1}`,
		}));
	}

	private updateHotspotState() {
		if (
			this.hotspots.size() > 0 &&
			this.hotspotElapsed >= HACHI_HOTSPOT_ROTATION_INTERVAL
		) {
			this.hotspotElapsed = 0;
			this.activeHotspotIndex =
				(this.activeHotspotIndex + 1) % this.hotspots.size();
			this.serverEvents.hintTextChanged.broadcast(
				`Hotspot moved to ${this.hotspots[this.activeHotspotIndex].label}!`,
			);
		}

		const timeRemaining = HACHI_ROUND_DURATION - this.roundElapsed;
		if (
			!this.finalSprintStarted &&
			timeRemaining <= HACHI_FINAL_SPRINT_WINDOW
		) {
			this.finalSprintStarted = true;
			this.serverEvents.hintTextChanged.broadcast(
				"Final sprint! Key items are worth triple now!",
			);
		}
	}

	private isInActiveHotspot(position: Vector3) {
		const hotspot = this.hotspots[this.activeHotspotIndex];
		if (!hotspot) return false;
		return position.sub(hotspot.center).Magnitude <= HACHI_HOTSPOT_RADIUS;
	}

	private broadcastRaceState() {
		if (!this.roundStarted) return;

		const names = new Map<number, string>();
		for (const [userId, player] of this.playerObjects) {
			names.set(userId, player.Name);
		}

		const hotspot = this.hotspots[this.activeHotspotIndex];
		const hotspotTimeLeft = math.max(
			0,
			math.ceil(HACHI_HOTSPOT_ROTATION_INTERVAL - this.hotspotElapsed),
		);

		for (const [userId, player] of this.playerObjects) {
			const snapshot = buildHachiRaceSnapshot(
				this.playerStates,
				names,
				userId,
				HACHI_EVOLUTION_THRESHOLDS,
			);
			this.serverEvents.hachiRaceState.fire(player, {
				...snapshot,
				hotspotLabel: hotspot?.label ?? "City Loop",
				hotspotTimeLeft,
			});
		}
	}

	private tickHachiAnimation(dt: number) {
		for (const [userId] of this.playerStates) {
			const hachiModel = this.hachiModels.get(userId);
			if (!hachiModel) continue;
			const body = hachiModel.FindFirstChild("Body") as BasePart | undefined;
			if (!body) continue;
			const state = this.hachiAnimStates.get(userId) ?? {
				animTime: 0,
				airborne: false,
			};
			this.hachiAnimStates.set(userId, animateHachi(body, dt, state));
		}
	}

	private resetAnticheatBaseline(userId: number, position: Vector3) {
		this.lastPositions.set(userId, position);
		this.strikes.set(userId, 0);
		this.lastStrikeTime.delete(userId);
	}

	private handleDoubleJumpEvent(player: Player) {
		const state = this.playerStates.get(player.UserId);
		if (!state) return;
		// Require evolution >= 1 (double jump unlock)
		if (state.evolutionLevel < 1) return;
		// Reject if already used this airborne session
		if (this.doubleJumpUsed.get(player.UserId)) return;
		this.doubleJumpUsed.set(player.UserId, true);
	}

	private checkSpeedViolations(_dt: number) {
		const now = os.clock();
		if (now - this.lastPositionTime < HACHI_ANTICHEAT_CHECK_INTERVAL) return;
		const elapsed = now - this.lastPositionTime;
		this.lastPositionTime = now;

		const maxSpeed =
			HACHI_WALK_SPEEDS[HACHI_WALK_SPEEDS.size() - 1] *
			HACHI_MAX_SPEED_TOLERANCE;
		const maxDist = maxSpeed * elapsed + HACHI_ANTICHEAT_GRACE_STUDS;

		for (const [userId] of this.playerStates) {
			// Skip players currently in a slide impulse (speed far exceeds walk threshold)
			// but refresh their baseline so there's no stale delta when exemption ends
			if (this.hachiSlideActive.has(userId)) {
				const p = this.playerObjects.get(userId);
				const h = p?.Character?.FindFirstChild("HumanoidRootPart") as
					| BasePart
					| undefined;
				if (h) this.lastPositions.set(userId, h.Position);
				continue;
			}

			const player = this.playerObjects.get(userId);
			if (!player?.Character) continue;
			const hrp = player.Character.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (!hrp) continue;

			const pos = hrp.Position;
			const lastPos = this.lastPositions.get(userId);
			this.lastPositions.set(userId, pos);

			if (!lastPos) continue;

			const dist = pos.sub(lastPos).Magnitude;
			if (dist <= maxDist) {
				// Clean movement: decay strikes over time
				const lastStrike = this.lastStrikeTime.get(userId) ?? 0;
				if (
					now - lastStrike > HACHI_ANTICHEAT_STRIKE_DECAY &&
					(this.strikes.get(userId) ?? 0) > 0
				) {
					this.strikes.set(userId, 0);
				}
				continue;
			}

			// Speed violation
			const currentStrikes = (this.strikes.get(userId) ?? 0) + 1;
			this.strikes.set(userId, currentStrikes);
			this.lastStrikeTime.set(userId, now);

			if (currentStrikes < HACHI_ANTICHEAT_STRIKE_LIMIT) {
				warn(
					`[HachiRide] Speed warning for ${player.Name}: ${math.floor(dist)} studs in ${string.format("%.1f", elapsed)}s (strike ${currentStrikes})`,
				);
			} else {
				// Teleport back to last valid position
				warn(
					`[HachiRide] Snapback for ${player.Name}: ${math.floor(dist)} studs in ${string.format("%.1f", elapsed)}s (strike ${currentStrikes})`,
				);
				player.Character?.PivotTo(new CFrame(lastPos));
				if (hrp) hrp.AssemblyLinearVelocity = Vector3.zero;
				this.lastPositions.set(userId, lastPos);
			}
		}
	}

	private stopWallRun(userId: number, player: Player) {
		const wallState = this.wallRunStates.get(userId);
		if (!wallState?.running) return;
		wallState.running = false;
		this.serverEvents.hachiWallRunStop.fire(player);

		// Restore BodyVelocity MaxForce
		const hachiModel = this.hachiModels.get(userId);
		const body = hachiModel?.FindFirstChild("Body") as BasePart | undefined;
		const bv = body?.FindFirstChildOfClass("BodyVelocity");
		if (bv) bv.MaxForce = wallState.origMaxForce;
	}

	private detectWallRun(dt: number) {
		for (const [userId, state] of this.playerStates) {
			const player = this.playerObjects.get(userId);
			if (!player?.Character) continue;

			// Wall-run is a Hachi ability: must be seated
			const hachiModel = this.hachiModels.get(userId);
			if (!hachiModel) continue;
			const body = hachiModel.FindFirstChild("Body") as BasePart | undefined;
			if (!body) continue;
			const humanoid = player.Character.FindFirstChildOfClass("Humanoid");
			if (!humanoid) continue;
			const seat = hachiModel.FindFirstChildOfClass("VehicleSeat") as
				| VehicleSeat
				| undefined;
			if (!seat || seat.Occupant !== humanoid) {
				this.stopWallRun(userId, player);
				continue;
			}

			// Grounded detection via Y velocity (avoids model geometry issues)
			const isGrounded = math.abs(body.AssemblyLinearVelocity.Y) < 5;

			if (isGrounded) {
				this.doubleJumpUsed.set(userId, false);
				this.stopWallRun(userId, player);
				continue;
			}

			// Wall-run requires evolution >= 2
			if (state.evolutionLevel < 2) continue;

			const rayParams = new RaycastParams();
			rayParams.FilterDescendantsInstances = [
				hachiModel,
				...(player.Character ? [player.Character] : []),
			];
			rayParams.FilterType = Enum.RaycastFilterType.Exclude;

			// Cast left and right from Hachi body
			const left = body.CFrame.RightVector.mul(-HACHI_WALL_RUN_RAYCAST);
			const right = body.CFrame.RightVector.mul(HACHI_WALL_RUN_RAYCAST);
			const leftResult = Workspace.Raycast(body.Position, left, rayParams);
			const rightResult = Workspace.Raycast(body.Position, right, rayParams);

			let wallResult: RaycastResult | undefined;
			if (leftResult && rightResult) {
				const leftDist = body.Position.sub(leftResult.Position).Magnitude;
				const rightDist = body.Position.sub(rightResult.Position).Magnitude;
				wallResult = leftDist <= rightDist ? leftResult : rightResult;
			} else {
				wallResult = leftResult ?? rightResult;
			}

			if (wallResult) {
				let wallState = this.wallRunStates.get(userId);

				if (!wallState || !wallState.running) {
					// Compute wall-run direction from Hachi body forward
					const eps = 1e-4;
					const xzRaw = new Vector3(
						body.CFrame.LookVector.X,
						0,
						body.CFrame.LookVector.Z,
					);
					const forward =
						xzRaw.Magnitude > eps ? xzRaw.Unit : new Vector3(0, 0, 1);
					const projected = forward.sub(
						wallResult.Normal.mul(forward.Dot(wallResult.Normal)),
					);
					let wallDir: Vector3;
					if (projected.Magnitude > eps) {
						wallDir = projected.Unit;
					} else {
						const perp = new Vector3(
							wallResult.Normal.Z,
							0,
							-wallResult.Normal.X,
						);
						wallDir =
							perp.Magnitude > eps
								? perp.Unit
								: Vector3.yAxis.Cross(wallResult.Normal).Unit;
					}

					// Zero BodyVelocity so it doesn't fight wall-run
					const bv = body.FindFirstChildOfClass("BodyVelocity");
					const origForce = bv?.MaxForce ?? Vector3.zero;
					if (bv) bv.MaxForce = Vector3.zero;

					wallState = {
						running: true,
						duration: 0,
						normal: wallResult.Normal,
						wallDir,
						origMaxForce: origForce,
					};
					this.wallRunStates.set(userId, wallState);
					this.serverEvents.hachiWallRunStart.fire(player, wallResult.Normal);
				}

				wallState.duration += dt;
				if (wallState.duration >= HACHI_WALL_RUN_MAX_DUR) {
					this.stopWallRun(userId, player);
				} else {
					// Apply wall-run velocity to Hachi body each tick
					body.AssemblyLinearVelocity = new Vector3(
						wallState.wallDir.X * HACHI_WALL_RUN_SPEED,
						body.AssemblyLinearVelocity.Y,
						wallState.wallDir.Z * HACHI_WALL_RUN_SPEED,
					);
				}
			} else {
				this.stopWallRun(userId, player);
			}
		}
	}
}
