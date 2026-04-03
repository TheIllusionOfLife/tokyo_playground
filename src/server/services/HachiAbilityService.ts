import { OnStart, Service } from "@flamework/core";
import {
	CollectionService,
	Players,
	RunService,
	Workspace,
} from "@rbxts/services";
import {
	AnimProfile,
	DEFAULT_WALK_SPEED,
	HACHI_DEFAULT_SCALE,
	HACHI_EJECT_COOLDOWN,
	HACHI_JUMP_COOLDOWN,
	HACHI_LOBBY_MIN_LEVEL,
	HACHI_RIDE_TAG,
	HACHI_SLIDE_RAMP_PROXIMITY,
	HACHI_WALL_RUN_MAX_DUR,
	HACHI_WALL_RUN_RAYCAST,
	HACHI_WALL_RUN_SPEED,
	SCRAMBLE_SLIDE_COOLDOWN,
	SCRAMBLE_SLIDE_SPEED,
	SLIDE_DIR_Y_OFFSET,
	SLIDE_RAMP_TAG,
	VEHICLE_CATALOG,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import { animateVehicle, HachiAnimState } from "../utils/animateVehicle";
import { CooldownTracker } from "../utils/cooldown";
import {
	equipHachiCostume,
	getPlayerHachi,
	HACHI_SLIDE_DURATION,
	isPlayerMounted,
	unequipHachiCostume,
	updateHachiWalkSpeed,
} from "../utils/hachiCostume";
import { safeHandler } from "../utils/safeConnect";
import { getVehicleTemplate } from "../utils/vehicleTemplate";
import { PlayerDataService } from "./PlayerDataService";

/**
 * Hachi vehicle ability handlers (jump, slide, wall-run, eject, toggle, animation).
 * Extracted from LobbyService to reduce its scope. Uses callback setters for
 * match state to avoid a DI cycle with LobbyService.
 */
@Service()
export class HachiAbilityService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});
	private readonly slideCooldowns = new CooldownTracker();
	private readonly hachiSlideActive = new Set<number>();
	private readonly hachiJumpCooldowns = new CooldownTracker();
	private readonly hachiEjectCooldowns = new CooldownTracker();
	private readonly hachiAnimStates = new Map<Model, HachiAnimState>();
	private readonly mountedVehicleDefs = new Map<
		Model,
		(typeof VEHICLE_CATALOG)[number]
	>();
	private readonly lobbyAirJumpsUsed = new Map<number, number>();
	private slideRamps: BasePart[] = [];
	private matchActive = false;
	private matchOniUserIds = new Set<number>();

	constructor(private readonly playerDataService: PlayerDataService) {}

	/** Called by LobbyService when match state changes. */
	setMatchActive(active: boolean) {
		this.matchActive = active;
		if (!active) this.matchOniUserIds.clear();
	}

	/** Called by LobbyService when an Oni is assigned (allows mount toggle during match). */
	setMatchOni(userId: number) {
		this.matchOniUserIds.add(userId);
	}

	onStart() {
		print("[HachiAbilityService] Started");

		// Cache slide ramps
		this.slideRamps = CollectionService.GetTagged(SLIDE_RAMP_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);
		CollectionService.GetInstanceAddedSignal(SLIDE_RAMP_TAG).Connect((inst) => {
			if (inst.IsA("BasePart")) this.slideRamps.push(inst);
		});
		CollectionService.GetInstanceRemovedSignal(SLIDE_RAMP_TAG).Connect(
			(inst) => {
				if (!inst.IsA("BasePart")) return;
				const idx = this.slideRamps.indexOf(inst);
				if (idx !== -1) this.slideRamps.remove(idx);
			},
		);

		// Clean up player state on leave
		Players.PlayerRemoving.Connect((player) => {
			this.slideCooldowns.reset(player.UserId);
			this.hachiSlideActive.delete(player.UserId);
			this.hachiJumpCooldowns.reset(player.UserId);
			this.hachiEjectCooldowns.reset(player.UserId);
			this.lobbyAirJumpsUsed.delete(player.UserId);
		});

		this.setupHachiRide();
		this.setupHachiToggle();
		this.setupHachiSlideHandler();
		this.setupHachiAnimation();
		this.setupLobbyHachiJump();
		this.setupLobbyHachiEject();
		this.setupLobbyDoubleJump();
		this.setupLobbyWallRun();
	}

	private setupHachiRide() {
		for (const hachi of CollectionService.GetTagged(HACHI_RIDE_TAG)) {
			const model = hachi as Model;
			if (model.IsA("Model")) model.ScaleTo(HACHI_DEFAULT_SCALE);
		}
	}

	private setupHachiToggle() {
		this.serverEvents.hachiToggleCostume.connect(
			safeHandler("HachiAbilityService.hachiToggleCostume", (player, equip) => {
				if (this.matchActive && !this.matchOniUserIds.has(player.UserId))
					return;

				if (equip) {
					if (isPlayerMounted(player)) return;
					const vehicleId = this.playerDataService.getEquippedVehicle(player);
					const template = getVehicleTemplate(vehicleId);
					if (!template) return;
					const clone = template.Clone();
					const evoLevel = this.matchActive ? 0 : HACHI_LOBBY_MIN_LEVEL;
					const vDef = VEHICLE_CATALOG.find((v) => v.id === vehicleId);
					if (
						!equipHachiCostume(
							player,
							clone,
							evoLevel,
							!this.matchActive,
							vDef?.weldYawOffset ?? 0,
							vDef?.scaleOverride,
							vDef?.seatHeightOffset ?? 0,
							vDef?.standingMount ?? false,
							vDef?.hipHeightOffset ?? 0,
						)
					) {
						clone.Destroy();
					} else {
						if (vDef) this.mountedVehicleDefs.set(clone, vDef);
					}
				} else {
					unequipHachiCostume(player);
				}
			}),
		);
	}

	private setupHachiSlideHandler() {
		this.serverEvents.requestHachiSlide.connect(
			safeHandler("HachiAbilityService.requestHachiSlide", (player) => {
				if (this.matchActive) return;
				if (!isPlayerMounted(player)) return;
				const character = player.Character;
				if (!character) return;
				const hrp = character.FindFirstChild("HumanoidRootPart") as
					| BasePart
					| undefined;
				if (!hrp) return;

				let nearestRamp: BasePart | undefined;
				let nearestDist = HACHI_SLIDE_RAMP_PROXIMITY;
				for (const ramp of this.slideRamps) {
					const localPos = ramp.CFrame.PointToObjectSpace(hrp.Position);
					const half = ramp.Size.mul(0.5);
					const clamped = new Vector3(
						math.clamp(localPos.X, -half.X, half.X),
						math.clamp(localPos.Y, -half.Y, half.Y),
						math.clamp(localPos.Z, -half.Z, half.Z),
					);
					const closestWorld = ramp.CFrame.PointToWorldSpace(clamped);
					const dist = hrp.Position.sub(closestWorld).Magnitude;
					if (dist < nearestDist) {
						nearestDist = dist;
						nearestRamp = ramp;
					}
				}
				if (!nearestRamp) return;

				// Cooldown after validation so failed attempts don't lock out the player
				if (!this.slideCooldowns.check(player.UserId, SCRAMBLE_SLIDE_COOLDOWN))
					return;

				const usePlayerDir = nearestRamp.GetAttribute("UsePlayerDirection");
				let serverDir: Vector3;
				if (typeIs(usePlayerDir, "boolean") && usePlayerDir) {
					const vel = hrp.AssemblyLinearVelocity;
					const horizontal = new Vector3(vel.X, 0, vel.Z);
					serverDir =
						horizontal.Magnitude > 1
							? horizontal.Unit
							: nearestRamp.CFrame.LookVector.Unit;
				} else {
					serverDir = nearestRamp.CFrame.LookVector.add(
						new Vector3(0, SLIDE_DIR_Y_OFFSET, 0),
					).Unit;
				}
				const rawSpeed = nearestRamp.GetAttribute("SlideSpeed");
				const speed =
					typeIs(rawSpeed, "number") && rawSpeed > 0
						? rawSpeed
						: SCRAMBLE_SLIDE_SPEED;

				const humanoid = character.FindFirstChildOfClass("Humanoid");
				if (!humanoid) return;
				if (this.hachiSlideActive.has(player.UserId)) return;
				this.hachiSlideActive.add(player.UserId);
				humanoid.WalkSpeed = 0;
				humanoid.PlatformStand = true;
				hrp.AssemblyLinearVelocity = serverDir.mul(speed);
				task.delay(HACHI_SLIDE_DURATION, () => {
					this.hachiSlideActive.delete(player.UserId);
					if (!humanoid.Parent || !player.Parent) return;
					humanoid.PlatformStand = false;
					if (isPlayerMounted(player)) {
						updateHachiWalkSpeed(player, HACHI_LOBBY_MIN_LEVEL);
					} else {
						humanoid.WalkSpeed = DEFAULT_WALK_SPEED;
					}
				});
			}),
		);
	}

	private setupHachiAnimation() {
		RunService.Heartbeat.Connect((dt) => {
			for (const player of Players.GetPlayers()) {
				const hachiModel = getPlayerHachi(player);
				if (!hachiModel || !hachiModel.Parent) continue;
				const body = hachiModel.FindFirstChild("Body") as BasePart | undefined;
				if (!body) continue;

				let state = this.hachiAnimStates.get(hachiModel);
				if (!state) {
					state = { animTime: 0, airborne: false };
				}
				const vDef = this.mountedVehicleDefs.get(hachiModel);
				this.hachiAnimStates.set(
					hachiModel,
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

			for (const [model] of this.hachiAnimStates) {
				if (!model.Parent) {
					this.hachiAnimStates.delete(model);
					this.mountedVehicleDefs.delete(model);
				}
			}
		});
	}

	private setupLobbyHachiJump() {
		this.serverEvents.hachiJump.connect(
			safeHandler("HachiAbilityService.hachiJump", (player) => {
				if (this.matchActive) return;
				if (!isPlayerMounted(player)) return;

				if (!this.hachiJumpCooldowns.check(player.UserId, HACHI_JUMP_COOLDOWN))
					return;
				this.lobbyAirJumpsUsed.set(player.UserId, 0);

				task.delay(0.3, () => {
					const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
					if (!humanoid) return;
					let checks = 0;
					const landConn = RunService.Heartbeat.Connect(() => {
						checks++;
						if (checks > 300 || !player.Parent) {
							landConn.Disconnect();
							this.lobbyAirJumpsUsed.delete(player.UserId);
							return;
						}
						if (humanoid.FloorMaterial !== Enum.Material.Air) {
							landConn.Disconnect();
							this.lobbyAirJumpsUsed.delete(player.UserId);
						}
					});
				});
			}),
		);
	}

	private setupLobbyDoubleJump() {
		this.serverEvents.hachiLobbyDoubleJump.connect(
			safeHandler("HachiAbilityService.hachiLobbyDoubleJump", (player) => {
				if (this.matchActive) return;

				if (HACHI_LOBBY_MIN_LEVEL < 1) return;

				const used = this.lobbyAirJumpsUsed.get(player.UserId) ?? 0;
				if (used >= 1) return;

				if (!isPlayerMounted(player)) return;
				const hrp = player.Character?.FindFirstChild("HumanoidRootPart") as
					| BasePart
					| undefined;
				if (!hrp) return;

				if (math.abs(hrp.AssemblyLinearVelocity.Y) < 5) return;

				this.lobbyAirJumpsUsed.set(player.UserId, used + 1);
				this.serverEvents.hachiDoubleJumpGranted.fire(player);
			}),
		);
	}

	private setupLobbyWallRun() {
		this.serverEvents.hachiLobbyWallRun.connect(
			safeHandler(
				"HachiAbilityService.hachiLobbyWallRun",
				(player, wallNormal) => {
					if (this.matchActive) return;

					if (HACHI_LOBBY_MIN_LEVEL < 2) return;

					if (!isPlayerMounted(player)) return;
					const character = player.Character;
					if (!character) return;
					const hrp = character.FindFirstChild("HumanoidRootPart") as
						| BasePart
						| undefined;
					const humanoid = character.FindFirstChildOfClass("Humanoid");
					if (!hrp || !humanoid) return;

					const mag = wallNormal.Magnitude;
					if (mag < 0.5 || mag > 1.5) return;
					const hintDir = wallNormal.Unit;

					const hachiModel = getPlayerHachi(player);
					const rayParams = new RaycastParams();
					rayParams.FilterType = Enum.RaycastFilterType.Exclude;
					const excludeList: Instance[] = [character];
					if (hachiModel) excludeList.push(hachiModel);
					rayParams.FilterDescendantsInstances = excludeList;
					const rayDir = hintDir.mul(-HACHI_WALL_RUN_RAYCAST);
					const rayResult = Workspace.Raycast(hrp.Position, rayDir, rayParams);
					if (!rayResult) return;

					const serverNormal = rayResult.Normal;
					const crossResult = serverNormal.Cross(new Vector3(0, 1, 0));
					if (crossResult.Magnitude < 0.1) return;
					let lateralDir = crossResult.Unit;

					const vel = hrp.AssemblyLinearVelocity;
					const horizontal = new Vector3(vel.X, 0, vel.Z);
					if (horizontal.Magnitude > 1 && lateralDir.Dot(horizontal.Unit) < 0) {
						lateralDir = lateralDir.mul(-1);
					}

					if (this.hachiSlideActive.has(player.UserId)) return;
					this.hachiSlideActive.add(player.UserId);

					humanoid.WalkSpeed = 0;
					humanoid.AutoRotate = false;
					humanoid.PlatformStand = true;
					hrp.AssemblyLinearVelocity = lateralDir.mul(HACHI_WALL_RUN_SPEED);
					this.serverEvents.hachiWallRunStart.fire(player, serverNormal);

					task.delay(HACHI_WALL_RUN_MAX_DUR, () => {
						this.hachiSlideActive.delete(player.UserId);
						if (!humanoid.Parent || !player.Parent) return;
						humanoid.PlatformStand = false;
						humanoid.AutoRotate = true;
						if (isPlayerMounted(player)) {
							updateHachiWalkSpeed(player, HACHI_LOBBY_MIN_LEVEL);
						} else {
							humanoid.WalkSpeed = DEFAULT_WALK_SPEED;
						}
						this.serverEvents.hachiWallRunStop.fire(player);
					});
				},
			),
		);
	}

	private setupLobbyHachiEject() {
		this.serverEvents.hachiEject.connect(
			safeHandler("HachiAbilityService.hachiEject", (player) => {
				if (this.matchActive) return;
				if (!isPlayerMounted(player)) return;

				if (
					!this.hachiEjectCooldowns.check(player.UserId, HACHI_EJECT_COOLDOWN)
				)
					return;

				unequipHachiCostume(player);
			}),
		);
	}
}
