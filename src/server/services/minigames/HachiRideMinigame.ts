import { Janitor } from "@rbxts/janitor";
import {
	CollectionService,
	Players,
	ServerStorage,
	TweenService,
	Workspace,
} from "@rbxts/services";
import {
	AnimProfile,
	DEFAULT_JUMP_HEIGHT,
	DEFAULT_WALK_SPEED,
	HACHI_ANTICHEAT_CHECK_INTERVAL,
	HACHI_ANTICHEAT_GRACE_STUDS,
	HACHI_ANTICHEAT_RESPAWN_GRACE,
	HACHI_ANTICHEAT_STRIKE_DECAY,
	HACHI_ANTICHEAT_STRIKE_LIMIT,
	HACHI_ANTICHEAT_TELEPORT_THRESHOLD,
	HACHI_BIG_SCALE,
	HACHI_BLDG_MAX_X,
	HACHI_BLDG_MAX_Z,
	HACHI_BLDG_MIN_X,
	HACHI_BLDG_MIN_Z,
	HACHI_BONUS_ITEM_COUNT,
	HACHI_BONUS_ITEM_VALUE,
	HACHI_CITY_CENTER,
	HACHI_CITY_MAX_X,
	HACHI_CITY_MAX_Z,
	HACHI_CITY_MIN_X,
	HACHI_CITY_MIN_Z,
	HACHI_COIN_MESH_ID,
	HACHI_COIN_TEXTURE_ID,
	HACHI_COLLECTION_RADIUS,
	HACHI_EJECT_COOLDOWN,
	HACHI_EVOLUTION_THRESHOLDS,
	HACHI_FINAL_SPRINT_MULTIPLIER,
	HACHI_FINAL_SPRINT_WINDOW,
	HACHI_ITEMS_TO_SPAWN,
	HACHI_JUMP_COOLDOWN,
	HACHI_JUMP_VELOCITY,
	HACHI_MAX_AIR_JUMPS,
	HACHI_MAX_SPEED_TOLERANCE,
	HACHI_ROOFTOP_BONUS_OFFSET_Y,
	HACHI_ROOFTOP_BUILDINGS,
	HACHI_ROUND_DURATION,
	HACHI_SKY_DROP_ACTIVE_RATIO,
	HACHI_SKY_DROP_BUILDING_BIAS,
	HACHI_SKY_DROP_CENTER_BIAS,
	HACHI_SKY_DROP_DENSE_RADIUS,
	HACHI_SKY_DROP_FALL_DURATION,
	HACHI_SKY_DROP_GROUND_Y,
	HACHI_SKY_DROP_MAX_Y,
	HACHI_SKY_DROP_MIN_Y,
	HACHI_SPAWN_TAG,
	HACHI_STAR_MESH_ID,
	HACHI_STAR_TEXTURE_ID,
	HACHI_STARTING_EVOLUTION,
	HACHI_WALK_SPEEDS,
	HACHI_WALL_RUN_MAX_DUR,
	HACHI_WALL_RUN_RAYCAST,
	HACHI_WALL_RUN_SPEED,
	SCRAMBLE_SLIDE_COOLDOWN,
	SKY_DRAGON_BONUS_VALUE,
	SKY_DRAGON_COLLECTION_RADIUS,
	SKY_DRAGON_HEIGHT,
	SKY_DRAGON_ROUTE_END,
	SKY_DRAGON_ROUTE_START,
	SKY_DRAGON_SCALE,
	SKY_DRAGON_SPEED,
	SKY_DRAGON_YAW_OFFSET,
	VEHICLE_CATALOG,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import {
	AnyPlayerState,
	HachiRidePlayerState,
	MinigameId,
	MissionId,
	PlayerRole,
	RoundResult,
	VehicleId,
} from "shared/types";
import { buildHachiRaceSnapshot } from "shared/utils/hachiRace";
import { animateItemCollect } from "../../utils/animateItemCollect";
import { animateVehicle, HachiAnimState } from "../../utils/animateVehicle";
import { CooldownTracker } from "../../utils/cooldown";
import {
	equipHachiCostume,
	forceUnmount,
	HACHI_SLIDE_DURATION,
	isPlayerMounted,
	unequipHachiCostume,
	updateHachiWalkSpeed,
} from "../../utils/hachiCostume";
import { safeHandler } from "../../utils/safeConnect";
import { getVehicleTemplate } from "../../utils/vehicleTemplate";
import { InventoryService } from "../InventoryService";
import { MissionService } from "../MissionService";
import { PlayerDataService } from "../PlayerDataService";
import {
	checkSpeedViolations,
	resetAnticheatBaseline,
} from "./hachi/anticheat";
import {
	createCollectible,
	generateSpawnPositions,
	getCityPolygon,
	isInsidePolygon,
	raycastLandingY,
	shuffle,
} from "./hachi/collectibles";
import { addFluffyEffect, getAbilityHint, tryEvolve } from "./hachi/evolution";
import {
	cleanupSkyDragon,
	createSkyDragonState,
	spawnSkyDragon,
	tickSkyDragon,
} from "./hachi/sky-dragon";
import { HachiAnticheatContext } from "./hachi/types";
import { IMinigame } from "./MinigameBase";

type ServerEvents = ReturnType<typeof GlobalEvents.createServer>;

interface WallRunState {
	running: boolean;
	duration: number;
	normal: Vector3;
	wallDir: Vector3;
	origWalkSpeed: number;
}

export class HachiRideMinigame implements IMinigame {
	static activeInstance?: HachiRideMinigame;
	readonly id = MinigameId.HachiRide;

	private playerStates = new Map<number, HachiRidePlayerState>();
	private playerObjects = new Map<number, Player>();
	private hachiModels = new Map<number, Model>();
	private hachiAnimStates = new Map<number, HachiAnimState>();
	private hachiVehicleDefs = new Map<
		number,
		(typeof VEHICLE_CATALOG)[number]
	>();
	private activeItems: BasePart[] = [];
	private activeTweens: Tween[] = [];
	private bonusItems = new Set<BasePart>();
	private keyItems: BasePart[] = [];
	private spawnParts: BasePart[] = [];
	private wallRunStates = new Map<number, WallRunState>();
	private jumpCooldowns = new CooldownTracker();
	private ejectCooldowns = new CooldownTracker();
	private airJumpsUsed = new Map<number, number>();
	private jumpPhase = new Map<number, number>();
	private jumpTime = new Map<number, number>();
	private lastPositions = new Map<number, Vector3>();
	private lastPositionTime = 0;
	private strikes = new Map<number, number>();
	private lastStrikeTime = new Map<number, number>();
	private hachiSlideActive = new Set<number>();
	private slideCooldowns = new CooldownTracker();
	private roundStarted = false;
	private respawnGrace = new Map<number, number>();
	private roundElapsed = 0;
	private raceUpdateElapsed = 0;
	private finalSprintStarted = false;
	private itemLandingY = new Map<BasePart, number>();
	private totalRegularSpawned = 0;
	private totalBonusSpawned = 0;
	private remainingRegular = 0;
	private remainingBonus = 0;
	// Sky Dragon
	private skyDragonState = createSkyDragonState();

	constructor(
		private readonly serverEvents: ServerEvents,
		private readonly missionService: MissionService,
		private readonly inventoryService: InventoryService,
		private readonly playerDataService: PlayerDataService,
	) {
		HachiRideMinigame.activeInstance = this;
	}

	private buildAnticheatContext(): HachiAnticheatContext {
		return {
			playerStates: this.playerStates,
			playerObjects: this.playerObjects,
			lastPositions: this.lastPositions,
			lastPositionTime: this.lastPositionTime,
			strikes: this.strikes,
			lastStrikeTime: this.lastStrikeTime,
			respawnGrace: this.respawnGrace,
			wallRunStates: this.wallRunStates,
			hachiSlideActive: this.hachiSlideActive,
		};
	}

	prepare(players: Player[], matchJanitor: Janitor) {
		// Initialise per-player state
		for (const player of players) {
			this.playerStates.set(player.UserId, {
				minigameId: MinigameId.HachiRide,
				playerId: player.UserId,
				role: PlayerRole.None,
				itemCount: HACHI_EVOLUTION_THRESHOLDS[HACHI_STARTING_EVOLUTION] ?? 0,
				evolutionLevel: HACHI_STARTING_EVOLUTION,
				catchCount: 0,
				rescueCount: 0,
			});
			this.playerObjects.set(player.UserId, player);
		}

		// Rooftop bonus items: 30 deterministic (one per top building, centered)
		for (const bldg of HACHI_ROOFTOP_BUILDINGS) {
			const skyPos = new Vector3(
				bldg.x,
				bldg.topY + HACHI_ROOFTOP_BONUS_OFFSET_Y,
				bldg.z,
			);
			const part = createCollectible(skyPos, new Vector3(5, 5, 5), true);
			this.activeItems.push(part);
			this.bonusItems.add(part);
			this.itemLandingY.set(part, bldg.topY + 2);
		}

		// Generate all candidate positions, then randomly select a subset
		const rooftopCount = HACHI_ROOFTOP_BUILDINGS.size();
		const regularTotal = HACHI_ITEMS_TO_SPAWN - HACHI_BONUS_ITEM_COUNT;
		const randomBonusTotal = HACHI_BONUS_ITEM_COUNT - rooftopCount; // 50 - 30 = 20

		// Build pool of candidate items (regular + random bonus)
		interface CandidateItem {
			pos: Vector3;
			sizeVal: Vector3;
			isBonus: boolean;
			landingY: number;
		}
		const candidates: CandidateItem[] = [];

		// Regular items
		const regularPositions = generateSpawnPositions(regularTotal);
		for (const skyPos of regularPositions) {
			candidates.push({
				pos: skyPos,
				sizeVal: new Vector3(2, 2, 2),
				isBonus: false,
				landingY: raycastLandingY(skyPos.X, skyPos.Z),
			});
		}

		// Random bonus items
		const randomBonusPositions = generateSpawnPositions(randomBonusTotal);
		for (const skyPos of randomBonusPositions) {
			candidates.push({
				pos: skyPos,
				sizeVal: new Vector3(5, 5, 5),
				isBonus: true,
				landingY: raycastLandingY(skyPos.X, skyPos.Z),
			});
		}

		// Shuffle and take active ratio (50%)
		shuffle(candidates);
		const activeCount = math.floor(
			candidates.size() * HACHI_SKY_DROP_ACTIVE_RATIO,
		);
		for (let i = 0; i < activeCount; i++) {
			const c = candidates[i];
			const part = createCollectible(c.pos, c.sizeVal, c.isBonus);
			this.activeItems.push(part);
			if (c.isBonus) this.bonusItems.add(part);
			this.itemLandingY.set(part, c.landingY);
		}

		// Store initial field item totals for HUD display
		this.totalBonusSpawned = this.bonusItems.size();
		this.totalRegularSpawned = this.activeItems.size() - this.totalBonusSpawned;
		this.remainingBonus = this.totalBonusSpawned;
		this.remainingRegular = this.totalRegularSpawned;

		// Register cleanup: cancel tweens, destroy dynamic parts
		matchJanitor.Add(() => {
			for (const tween of this.activeTweens) {
				tween.Cancel();
			}
			this.activeTweens = [];
			for (const part of this.activeItems) {
				part.Destroy();
			}
			this.activeItems = [];
			this.bonusItems.clear();
			this.itemLandingY.clear();
		});

		// Key items are now the rooftop bonus items (no separate key item system)
		this.keyItems = [];

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

		// Clone vehicle template for each player (uses their equipped vehicle)
		for (let i = 0; i < players.size(); i++) {
			const player = players[i];
			const vehicleId = this.inventoryService.getEquippedVehicle(player);
			const template = getVehicleTemplate(vehicleId);
			if (!template) {
				warn(
					`[HachiRide] Missing vehicle template for ${player.Name} (${vehicleId})`,
				);
				continue;
			}

			const clone = template.Clone();
			clone.Name = `Hachi_${player.UserId}`;

			// Cache vehicle definition for animation dispatch
			const vDef = VEHICLE_CATALOG.find((v) => v.id === vehicleId);
			if (vDef) this.hachiVehicleDefs.set(player.UserId, vDef);

			// Equip costume on player (welds to HRP, sets WalkSpeed/JumpHeight)
			const evoLevel = HACHI_STARTING_EVOLUTION;
			equipHachiCostume(
				player,
				clone,
				evoLevel,
				false,
				vDef?.weldYawOffset ?? 0,
				vDef?.scaleOverride,
				vDef?.seatHeightOffset ?? 0,
				vDef?.standingMount ?? false,
				vDef?.hipHeightOffset ?? 0,
			);
			this.hachiModels.set(player.UserId, clone);
			matchJanitor.Add(() => {
				unequipHachiCostume(player);
			});

			// Teleport to spawn position
			if (spawnParts.size() > 0 && player.Character) {
				const spawnPart = spawnParts[i % spawnParts.size()];
				player.Character.PivotTo(
					new CFrame(spawnPart.Position.add(new Vector3(0, 3, 0))),
				);
			}
		}

		// Re-spawn mid-match deaths: lose Hachi, reset to normal speed
		for (const player of players) {
			const conn = player.CharacterAdded.Connect(() => {
				if (!this.roundStarted) return;
				this.respawnGrace.set(player.UserId, os.clock());
				task.wait(0.5);
				if (!this.roundStarted) return;
				if (!player.Character) return;
				const spawnPart = spawnParts[0];
				if (spawnPart) {
					player.Character.PivotTo(
						new CFrame(spawnPart.Position.add(new Vector3(0, 3, 0))),
					);
					resetAnticheatBaseline(
						this.buildAnticheatContext(),
						player.UserId,
						spawnPart.Position,
					);
				}
				// Clear stale Hachi state, ensure normal human speed
				forceUnmount(player);
				this.hachiModels.delete(player.UserId);
				const humanoid = player.Character.FindFirstChildOfClass("Humanoid");
				if (humanoid) {
					humanoid.WalkSpeed = DEFAULT_WALK_SPEED;
					humanoid.UseJumpPower = false;
					humanoid.JumpHeight = DEFAULT_JUMP_HEIGHT;
				}
			});
			matchJanitor.Add(conn);
		}

		// Hachi jump and eject requests from client
		matchJanitor.Add(
			this.serverEvents.hachiJump.connect(
				safeHandler("HachiRide.hachiJump", (player) => {
					if (!this.roundStarted) return;
					this.handleJumpRequest(player);
				}),
			),
		);
		matchJanitor.Add(
			this.serverEvents.hachiEject.connect(
				safeHandler("HachiRide.hachiEject", (player) => {
					this.handleEjectRequest(player);
				}),
			),
		);
		matchJanitor.Add(
			this.serverEvents.hachiDoubleJump.connect(
				safeHandler("HachiRide.hachiDoubleJump", (player) => {
					if (!this.roundStarted) return;
					this.handleDoubleJumpEvent(player);
				}),
			),
		);

		// Track slide state for anti-cheat exemption (rate-limited to prevent bypass)
		matchJanitor.Add(
			this.serverEvents.requestHachiSlide.connect(
				safeHandler("HachiRide.requestHachiSlide", (player) => {
					if (!this.roundStarted) return;
					if (!this.playerStates.has(player.UserId)) return;
					if (!isPlayerMounted(player)) return;

					if (
						!this.slideCooldowns.check(player.UserId, SCRAMBLE_SLIDE_COOLDOWN)
					)
						return;
					this.hachiSlideActive.add(player.UserId);
					task.delay(HACHI_SLIDE_DURATION, () => {
						this.hachiSlideActive.delete(player.UserId);
					});
				}),
			),
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
				resetAnticheatBaseline(
					this.buildAnticheatContext(),
					player.UserId,
					spawnPart.Position,
				);
			}
		}

		this.serverEvents.hintTextChanged.broadcast("hint_hachi_start");
		return roles;
	}

	startRound() {
		this.roundStarted = true;
		this.roundElapsed = 0;
		this.raceUpdateElapsed = 0;
		this.finalSprintStarted = false;
		// Notify clients of starting evolution level
		for (const [userId, state] of this.playerStates) {
			const player = this.playerObjects.get(userId);
			if (!player) continue;
			this.serverEvents.hachiEvolved.fire(player, state.evolutionLevel);
			this.serverEvents.hachiItemCollected.fire(player, state.itemCount);
			if (state.evolutionLevel >= 1) {
				this.serverEvents.hachiDoubleJumpGranted.fire(player);
			}
		}
		// Send initial field item counts to all players
		this.broadcastFieldItems();
		// Reveal items and tween them falling from sky
		for (const item of this.activeItems) {
			item.Transparency = 0;
			const shine = item.FindFirstChild("Shine") as ParticleEmitter | undefined;
			if (shine) shine.Enabled = true;
			const landY = this.itemLandingY.get(item) ?? HACHI_SKY_DROP_GROUND_Y;
			const delay = math.random() * 3;
			task.delay(delay, () => {
				if (!item.Parent) return;
				const tween = TweenService.Create(
					item,
					new TweenInfo(
						HACHI_SKY_DROP_FALL_DURATION,
						Enum.EasingStyle.Bounce,
						Enum.EasingDirection.Out,
					),
					{
						Position: new Vector3(item.Position.X, landY, item.Position.Z),
					},
				);
				tween.Completed.Connect(() => {
					if (item.Parent) item.CanQuery = true;
				});
				tween.Play();
				this.activeTweens.push(tween);
			});
		}
		this.serverEvents.hintTextChanged.broadcast("hint_items_falling");
		this.broadcastRaceState();
	}

	tick(dt: number) {
		if (!this.roundStarted) return;
		this.roundElapsed += dt;
		this.raceUpdateElapsed += dt;
		this.checkItemCollection();
		tickSkyDragon(
			this.skyDragonState,
			dt,
			this.playerStates,
			this.playerObjects,
			this.hachiModels,
			this.finalSprintStarted,
			this.serverEvents,
			this.missionService,
		);
		this.resetLandedJumps();
		this.detectWallRun(dt);
		this.tickHachiAnimation(dt);
		this.lastPositionTime = checkSpeedViolations(this.buildAnticheatContext());
		this.updateFinalSprintState();
		if (this.raceUpdateElapsed >= 1) {
			this.raceUpdateElapsed = 0;
			this.broadcastRaceState();
		}
	}

	handleCatchRequest(_player: Player): void {}
	handleKickCanRequest(_player: Player): boolean {
		return false;
	}
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
			const primary =
				hachiModel.PrimaryPart ?? hachiModel.FindFirstChildWhichIsA("BasePart");
			if (primary && !primary.FindFirstChild("FluffyEffect")) {
				addFluffyEffect(primary);
			}
		}

		state.evolutionLevel = level;
		state.itemCount = HACHI_EVOLUTION_THRESHOLDS[level] ?? 0;
		this.serverEvents.hachiEvolved.fire(player, level);
		this.serverEvents.hachiItemCollected.fire(player, state.itemCount);
		if (level >= 1) {
			this.serverEvents.hachiDoubleJumpGranted.fire(player);
		}
		const hint = getAbilityHint(level);
		this.serverEvents.hintTextChanged.fire(player, hint.key, hint.args);
	}

	/** Admin debug: set item count and trigger evolution checks. */
	adminSetItems(player: Player, count: number) {
		const state = this.playerStates.get(player.UserId);
		if (!state) return;
		state.itemCount = count;
		state.catchCount = count;
		this.serverEvents.hachiItemCollected.fire(player, count);
		tryEvolve(
			state,
			player,
			this.hachiModels.get(player.UserId),
			this.serverEvents,
		);
	}

	cleanup() {
		this.roundStarted = false;
		HachiRideMinigame.activeInstance = undefined;

		// Stop wall-runs FIRST (restores WalkSpeed to Hachi speed)
		for (const [userId] of this.wallRunStates) {
			const player = this.playerObjects.get(userId);
			if (player) this.stopWallRun(userId, player);
		}

		// Then unequip costumes (restores WalkSpeed to default)
		for (const [, player] of this.playerObjects) {
			unequipHachiCostume(player);
		}

		// Re-show key items
		for (const item of this.keyItems) {
			item.Transparency = 0;
		}

		// Destroy sky dragon
		cleanupSkyDragon(this.skyDragonState);

		this.playerStates.clear();
		this.playerObjects.clear();
		this.hachiModels.clear();
		this.hachiAnimStates.clear();
		this.hachiVehicleDefs.clear();
		this.wallRunStates.clear();
		this.jumpCooldowns.clear();
		this.ejectCooldowns.clear();
		this.airJumpsUsed.clear();
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
		this.jumpCooldowns.reset(userId);
		this.ejectCooldowns.reset(userId);
		this.airJumpsUsed.delete(userId);
		this.jumpPhase.delete(userId);
		this.jumpTime.delete(userId);
		this.lastPositions.delete(userId);
		this.strikes.delete(userId);
		this.lastStrikeTime.delete(userId);
		this.hachiSlideActive.delete(userId);
		this.slideCooldowns.reset(userId);
		this.respawnGrace.delete(userId);
		this.hachiVehicleDefs.delete(userId);
	}

	private handleJumpRequest(player: Player) {
		if (!isPlayerMounted(player)) return;

		// Jump phase: 0 = grounded/ready, 1 = jumped once (double available), 2 = fully used
		const phase = this.jumpPhase.get(player.UserId) ?? 0;
		if (phase >= 2) return;

		// Phase 1: check multi-jump allowance before consuming cooldown
		if (phase === 1) {
			const state = this.playerStates.get(player.UserId);
			if (!state) return;
			const maxJumps =
				HACHI_MAX_AIR_JUMPS[
					math.min(state.evolutionLevel, HACHI_MAX_AIR_JUMPS.size() - 1)
				];
			const used = this.airJumpsUsed.get(player.UserId) ?? 0;
			if (used >= maxJumps) return;
		}

		if (!this.jumpCooldowns.check(player.UserId, HACHI_JUMP_COOLDOWN)) return;

		const now = os.clock();
		if (phase === 0) {
			const state = this.playerStates.get(player.UserId);
			this.jumpPhase.set(
				player.UserId,
				state && state.evolutionLevel >= 1 ? 1 : 2,
			);
			this.jumpTime.set(player.UserId, now);
		} else if (phase === 1) {
			const state = this.playerStates.get(player.UserId);
			if (!state) return;
			const maxJumps =
				HACHI_MAX_AIR_JUMPS[
					math.min(state.evolutionLevel, HACHI_MAX_AIR_JUMPS.size() - 1)
				];
			const used = this.airJumpsUsed.get(player.UserId) ?? 0;
			this.jumpPhase.set(player.UserId, used + 1 >= maxJumps ? 2 : 1);
		}
	}

	/** Reset jump phase when player has landed (Y velocity settled after jump). */
	private resetLandedJumps() {
		const now = os.clock();
		for (const [userId] of this.playerStates) {
			const phase = this.jumpPhase.get(userId) ?? 0;
			if (phase === 0) continue;
			const wallState = this.wallRunStates.get(userId);
			if (wallState?.running) continue;
			const jumpT = this.jumpTime.get(userId) ?? 0;
			if (now - jumpT < 1.0) continue;
			const player = this.playerObjects.get(userId);
			const hrp = player?.Character?.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (!hrp) continue;
			if (math.abs(hrp.AssemblyLinearVelocity.Y) < 5) {
				this.jumpPhase.set(userId, 0);
				this.airJumpsUsed.set(userId, 0);
			}
		}
	}

	private handleEjectRequest(player: Player) {
		// Block voluntary eject during the round
		if (this.roundStarted) return;
		if (!isPlayerMounted(player)) return;

		if (!this.ejectCooldowns.check(player.UserId, HACHI_EJECT_COOLDOWN)) return;

		unequipHachiCostume(player);
	}

	private checkItemCollection() {
		for (const [userId, state] of this.playerStates) {
			const player = this.playerObjects.get(userId);
			if (!player?.Character) continue;
			const hrp = player.Character.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (!hrp) continue;

			// HRP and Hachi body share the same assembly (welded).
			// Use HRP position directly for collection checks.
			const pos = hrp.Position;

			// Check regular collectible items
			const toRemove: BasePart[] = [];
			for (const item of this.activeItems) {
				if (!item.Parent) {
					toRemove.push(item);
					continue;
				}
				if (!item.CanQuery) continue; // still falling
				if (pos.sub(item.Position).Magnitude <= HACHI_COLLECTION_RADIUS) {
					item.CanQuery = false;
					item.CanCollide = false;
					item.Transparency = 1;
					// Disable particle emitter so it doesn't linger
					const shine = item.FindFirstChild("Shine") as
						| ParticleEmitter
						| undefined;
					if (shine) shine.Enabled = false;
					toRemove.push(item);
					this.onItemCollected(userId, state, player, item);
					const tween = animateItemCollect(item, this.bonusItems.has(item));
					tween.Completed.Once(() => item.Destroy());
					this.activeTweens.push(tween);
				}
			}
			for (const item of toRemove) {
				const idx = this.activeItems.indexOf(item);
				if (idx !== -1) this.activeItems.remove(idx);
			}
			if (toRemove.size() > 0) {
				this.broadcastFieldItems();
			}

			// Check key items
			for (const item of this.keyItems) {
				if (!item.Parent) continue;
				if (item.Transparency === 1) continue; // already collected this session
				if (pos.sub(item.Position).Magnitude <= HACHI_COLLECTION_RADIUS) {
					item.CanQuery = false;
					item.CanCollide = false;
					item.Transparency = 1;
					const shine = item.FindFirstChild("Shine") as
						| ParticleEmitter
						| undefined;
					if (shine) shine.Enabled = false;
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
		const finalSprintMultiplier =
			this.finalSprintStarted && isBonus ? HACHI_FINAL_SPRINT_MULTIPLIER : 1;
		const value =
			(isBonus ? HACHI_BONUS_ITEM_VALUE : 1) * finalSprintMultiplier;
		state.itemCount += value;
		state.catchCount = state.itemCount; // mirror for scoreboard
		if (isBonus) {
			// Fire bonus BEFORE item so the client's bonusThisFrame flag
			// is set when the item handler runs (both arrive same frame).
			this.serverEvents.hachiBonusCollected.fire(player);
			this.missionService.incrementAndNotify(
				player,
				MissionId.CollectBonusItem,
				1,
			);
		}
		// Always fire item event — HUD needs the count update.
		this.serverEvents.hachiItemCollected.fire(player, state.itemCount);
		// Decrement remaining counter (broadcast happens after removal loop)
		if (isBonus) {
			this.remainingBonus--;
		} else {
			this.remainingRegular--;
		}
		tryEvolve(state, player, this.hachiModels.get(userId), this.serverEvents);
	}

	private broadcastFieldItems() {
		this.serverEvents.hachiFieldItems.broadcast(
			this.remainingRegular,
			this.totalRegularSpawned,
			this.remainingBonus,
			this.totalBonusSpawned,
		);
	}

	private updateFinalSprintState() {
		const timeRemaining = HACHI_ROUND_DURATION - this.roundElapsed;

		// Spawn sky dragon at 60 seconds remaining
		if (!this.skyDragonState.spawned && timeRemaining <= 60) {
			this.skyDragonState.spawned = true;
			spawnSkyDragon(this.skyDragonState);
			this.serverEvents.hintTextChanged.broadcast("hint_sky_dragon");
		}

		if (
			!this.finalSprintStarted &&
			timeRemaining <= HACHI_FINAL_SPRINT_WINDOW
		) {
			this.finalSprintStarted = true;
			this.serverEvents.hintTextChanged.broadcast("hint_final_sprint");
		}
	}

	private broadcastRaceState() {
		if (!this.roundStarted) return;

		const names = new Map<number, string>();
		for (const [userId, player] of this.playerObjects) {
			names.set(userId, player.Name);
		}

		for (const [userId, player] of this.playerObjects) {
			const snapshot = buildHachiRaceSnapshot(
				this.playerStates,
				names,
				userId,
				HACHI_EVOLUTION_THRESHOLDS,
			);
			this.serverEvents.hachiRaceState.fire(player, snapshot);
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
			const vDef = this.hachiVehicleDefs.get(userId);
			this.hachiAnimStates.set(
				userId,
				animateVehicle(
					body,
					dt,
					state,
					vDef?.animProfile ?? AnimProfile.Quadruped,
					vDef?.speedScale ?? 1.0,
					vDef?.idleAmp ?? 0.15,
				),
			);
		}
	}

	private handleDoubleJumpEvent(player: Player) {
		const state = this.playerStates.get(player.UserId);
		if (!state) return;
		// Require evolution >= 1 (air jump unlock)
		if (state.evolutionLevel < 1) return;
		const maxJumps =
			HACHI_MAX_AIR_JUMPS[
				math.min(state.evolutionLevel, HACHI_MAX_AIR_JUMPS.size() - 1)
			];
		const used = this.airJumpsUsed.get(player.UserId) ?? 0;
		if (used >= maxJumps) return;
		this.airJumpsUsed.set(player.UserId, used + 1);
	}

	private stopWallRun(userId: number, player: Player) {
		const wallState = this.wallRunStates.get(userId);
		if (!wallState?.running) return;
		wallState.running = false;
		this.serverEvents.hachiWallRunStop.fire(player);

		// Restore Humanoid movement
		const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
		if (humanoid) {
			humanoid.PlatformStand = false;
			humanoid.AutoRotate = true;
			humanoid.WalkSpeed = wallState.origWalkSpeed;
		}
	}

	private detectWallRun(dt: number) {
		for (const [userId, state] of this.playerStates) {
			const player = this.playerObjects.get(userId);
			if (!player?.Character) continue;

			// Wall-run requires mounted Hachi costume
			if (!isPlayerMounted(player)) {
				this.stopWallRun(userId, player);
				continue;
			}
			const humanoid = player.Character.FindFirstChildOfClass("Humanoid");
			const hrp = player.Character.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (!humanoid || !hrp) continue;

			// Grounded detection via FloorMaterial (not Y-velocity, which triggers at apex)
			const isGrounded = humanoid.FloorMaterial !== Enum.Material.Air;

			if (isGrounded) {
				this.airJumpsUsed.set(userId, 0);
				this.stopWallRun(userId, player);
				continue;
			}

			// Wall-run requires evolution >= 2
			if (state.evolutionLevel < 2) continue;

			const hachiModel = this.hachiModels.get(userId);
			const rayParams = new RaycastParams();
			rayParams.FilterDescendantsInstances = [
				...(player.Character ? [player.Character] : []),
				...(hachiModel ? [hachiModel] : []),
			];
			rayParams.FilterType = Enum.RaycastFilterType.Exclude;

			// Cast left and right from HRP
			const left = hrp.CFrame.RightVector.mul(-HACHI_WALL_RUN_RAYCAST);
			const right = hrp.CFrame.RightVector.mul(HACHI_WALL_RUN_RAYCAST);
			const leftResult = Workspace.Raycast(hrp.Position, left, rayParams);
			const rightResult = Workspace.Raycast(hrp.Position, right, rayParams);

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

				if (!wallState || !wallState.running) {
					// Compute wall-run direction from player's horizontal velocity
					const eps = 1e-4;
					const vel = hrp.AssemblyLinearVelocity;
					const xzRaw = new Vector3(vel.X, 0, vel.Z);
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

					// Flip direction if it opposes player's travel
					if (xzRaw.Magnitude > 1 && wallDir.Dot(xzRaw.Unit) < 0) {
						wallDir = wallDir.mul(-1);
					}

					// Lock Humanoid movement during wall run with PlatformStand
					const origWalkSpeed = humanoid.WalkSpeed;
					humanoid.WalkSpeed = 0;
					humanoid.AutoRotate = false;
					humanoid.PlatformStand = true;

					wallState = {
						running: true,
						duration: 0,
						normal: wallResult.Normal,
						wallDir,
						origWalkSpeed,
					};
					this.wallRunStates.set(userId, wallState);
					this.serverEvents.hachiWallRunStart.fire(player, wallResult.Normal);
					// Track cumulative wall runs for badges
					const pData = this.playerDataService.getPlayerData(player);
					if (pData) pData.totalWallRuns = (pData.totalWallRuns ?? 0) + 1;
				}

				wallState.duration += dt;
				if (wallState.duration >= HACHI_WALL_RUN_MAX_DUR) {
					this.stopWallRun(userId, player);
				} else {
					// Apply wall-run velocity to HRP each tick
					hrp.AssemblyLinearVelocity = new Vector3(
						wallState.wallDir.X * HACHI_WALL_RUN_SPEED,
						hrp.AssemblyLinearVelocity.Y,
						wallState.wallDir.Z * HACHI_WALL_RUN_SPEED,
					);
				}
			} else {
				this.stopWallRun(userId, player);
			}
		}
	}
}
