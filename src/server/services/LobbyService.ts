import { OnStart, Service } from "@flamework/core";
import {
	CollectionService,
	Players,
	RunService,
	ServerStorage,
	Workspace,
} from "@rbxts/services";
import {
	CAN_KICK_PORTAL_TAG,
	CHARACTER_SCALE,
	DEFAULT_JUMP_HEIGHT,
	DEFAULT_WALK_SPEED,
	HACHI_DEFAULT_SCALE,
	HACHI_DOUBLE_JUMP_IMPULSE,
	HACHI_EJECT_COOLDOWN,
	HACHI_JUMP_COOLDOWN,
	HACHI_LOBBY_MIN_LEVEL,
	HACHI_RIDE_PORTAL_TAG,
	HACHI_RIDE_TAG,
	HACHI_SLIDE_RAMP_PROXIMITY,
	HACHI_WALL_RUN_MAX_DUR,
	HACHI_WALL_RUN_RAYCAST,
	HACHI_WALL_RUN_SPEED,
	SCRAMBLE_PORTAL_TAG,
	SCRAMBLE_ROOFTOP_TP_COOLDOWN,
	SCRAMBLE_ROOFTOP_TP_DEST,
	SCRAMBLE_ROOFTOP_TP_TAG,
	SCRAMBLE_SLIDE_COOLDOWN,
	SCRAMBLE_SLIDE_SPEED,
	SLIDE_DIR_Y_OFFSET,
	SLIDE_RAMP_TAG,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import { MinigameId } from "shared/types";
import { animateHachi, HachiAnimState } from "../utils/animateHachi";
import {
	equipHachiCostume,
	forceUnmount,
	getPlayerHachi,
	HACHI_SLIDE_DURATION,
	isPlayerMounted,
	unequipHachiCostume,
	updateHachiWalkSpeed,
} from "../utils/hachiCostume";

import { PlayerDataService } from "./PlayerDataService";

const LOBBY_SPAWN_TAG = "LobbySpawn";

@Service()
export class LobbyService implements OnStart {
	private lobbySpawns: BasePart[] = [];
	private readonly serverEvents = GlobalEvents.createServer({});
	private readonly slideCooldowns = new Map<number, number>();
	private readonly tpCooldowns = new Map<number, number>();
	private readonly hachiSlideActive = new Set<number>();
	private readonly hachiJumpCooldowns = new Map<number, number>();
	private readonly hachiEjectCooldowns = new Map<number, number>();
	private readonly hachiAnimStates = new Map<Model, HachiAnimState>();
	/** Lobby double-jump phase: 0=grounded, 1=can double, 2=used */
	private readonly lobbyJumpPhase = new Map<number, number>();
	private slideRamps: BasePart[] = [];
	private matchActive = false;
	private onStartRequested?: (minigameId: MinigameId) => void;

	constructor(private readonly playerDataService: PlayerDataService) {}

	setOnStartRequested(cb: (minigameId: MinigameId) => void) {
		this.onStartRequested = cb;
	}

	setMatchActive(active: boolean) {
		this.matchActive = active;
	}

	onStart() {
		print("[LobbyService] Started");

		this.lobbySpawns = CollectionService.GetTagged(LOBBY_SPAWN_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);
		print(`[LobbyService] Found ${this.lobbySpawns.size()} lobby spawns`);

		Players.PlayerAdded.Connect((player) => {
			player.CharacterAdded.Connect((character) => {
				task.wait(0.5);
				const humanoid = character.WaitForChild("Humanoid") as Humanoid;
				humanoid.WalkSpeed = DEFAULT_WALK_SPEED;
				humanoid.UseJumpPower = false;
				humanoid.JumpHeight = DEFAULT_JUMP_HEIGHT;
				const scaleNames = [
					"BodyHeightScale",
					"BodyWidthScale",
					"BodyDepthScale",
					"HeadScale",
				];
				for (const name of scaleNames) {
					const nv = humanoid.WaitForChild(name, 2) as NumberValue | undefined;
					if (nv) nv.Value = CHARACTER_SCALE;
				}
				if (this.matchActive) return;
				if (player.Character) {
					this.teleportToLobby(player);
				}
			});
		});

		Players.PlayerRemoving.Connect((player) => {
			this.slideCooldowns.delete(player.UserId);
			this.tpCooldowns.delete(player.UserId);
			this.hachiSlideActive.delete(player.UserId);
			this.hachiJumpCooldowns.delete(player.UserId);
			this.hachiEjectCooldowns.delete(player.UserId);
			this.lobbyJumpPhase.delete(player.UserId);
		});

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

		this.setupPortals();
		this.setupHachiRide();
		this.setupHachiRidePortal();
		this.setupRooftopTPs();
		this.setupHachiSlideHandler();
		this.setupHachiAnimation();
		this.setupLobbyHachiJump();
		this.setupLobbyHachiEject();
		this.setupLobbyDoubleJump();
		this.setupLobbyWallRun();
		this.setupHachiToggle();
	}

	private setupRooftopTPs() {
		const pads = CollectionService.GetTagged(SCRAMBLE_ROOFTOP_TP_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);
		for (const pad of pads) {
			pad.Touched.Connect((touching) => {
				if (this.matchActive) return;
				const character = touching.FindFirstAncestorOfClass("Model");
				if (!character) return;
				const player = Players.GetPlayerFromCharacter(character);
				if (!player) return;

				const now = os.clock();
				if (
					now - (this.tpCooldowns.get(player.UserId) ?? 0) <
					SCRAMBLE_ROOFTOP_TP_COOLDOWN
				)
					return;
				this.tpCooldowns.set(player.UserId, now);

				player.Character?.PivotTo(new CFrame(SCRAMBLE_ROOFTOP_TP_DEST));
				this.serverEvents.hintTextChanged.fire(
					player,
					`${player.Name} flew to the rooftop!`,
				);
			});
		}
		print(
			`[LobbyService] Connected ${pads.size()} rooftop TP pads (always-on)`,
		);
	}

	private setupHachiRidePortal() {
		const portals = CollectionService.GetTagged(HACHI_RIDE_PORTAL_TAG);
		for (const portal of portals) {
			if (!portal.IsA("BasePart")) continue;
			portal
				.FindFirstChildOfClass("ProximityPrompt")
				?.Triggered.Connect((_player: Player) => {
					if (!this.onStartRequested) {
						warn(
							"[LobbyService] HachiRide portal triggered before onStartRequested registered",
						);
						return;
					}
					this.onStartRequested(MinigameId.HachiRide);
				});
		}
		print(`[LobbyService] Set up ${portals.size()} Hachi Ride portals`);
	}

	/** Scale lobby Hachi models as visual props (no VehicleSeat setup needed). */
	private setupHachiRide() {
		for (const hachi of CollectionService.GetTagged(HACHI_RIDE_TAG)) {
			const model = hachi as Model;
			if (model.IsA("Model")) model.ScaleTo(HACHI_DEFAULT_SCALE);
		}
	}

	/** HUD toggle: client requests costume equip/unequip. */
	private setupHachiToggle() {
		this.serverEvents.hachiToggleCostume.connect((player, equip) => {
			if (this.matchActive) return;

			if (equip) {
				if (isPlayerMounted(player)) return; // already mounted
				const template = ServerStorage.FindFirstChild("HachiTemplate") as
					| Model
					| undefined;
				if (!template) return;
				const clone = template.Clone();
				const data = this.playerDataService.getPlayerData(player);
				const evoLevel = math.max(
					data?.maxHachiLevel ?? 0,
					HACHI_LOBBY_MIN_LEVEL,
				);
				equipHachiCostume(player, clone, evoLevel);
			} else {
				unequipHachiCostume(player);
			}
		});
	}

	private setupPortals() {
		const portals = CollectionService.GetTagged(CAN_KICK_PORTAL_TAG);
		for (const portal of portals) {
			if (!portal.IsA("BasePart")) continue;
			const prompt = portal.FindFirstChildOfClass("ProximityPrompt");
			if (!prompt) continue;
			prompt.Triggered.Connect((player: Player) => {
				if (!this.onStartRequested) {
					warn(
						"[LobbyService] CanKick portal triggered before onStartRequested registered",
					);
					return;
				}
				this.serverEvents.hintTextChanged.fire(player, "Starting Can Kick...");
				this.onStartRequested(MinigameId.CanKick);
			});
		}
		print(`[LobbyService] Set up ${portals.size()} Can Kick portals`);

		const scramblePortals = CollectionService.GetTagged(SCRAMBLE_PORTAL_TAG);
		for (const portal of scramblePortals) {
			if (!portal.IsA("BasePart")) continue;
			portal
				.FindFirstChildOfClass("ProximityPrompt")
				?.Triggered.Connect((player: Player) => {
					if (!this.onStartRequested) {
						warn(
							"[LobbyService] Scramble portal triggered before onStartRequested registered",
						);
						return;
					}
					this.serverEvents.hintTextChanged.fire(
						player,
						"Starting Shibuya Scramble...",
					);
					this.onStartRequested(MinigameId.ShibuyaScramble);
				});
		}
		print(`[LobbyService] Set up ${scramblePortals.size()} Scramble portals`);
	}

	private setupHachiSlideHandler() {
		this.serverEvents.requestHachiSlide.connect((player) => {
			const now = os.clock();
			if (
				now - (this.slideCooldowns.get(player.UserId) ?? 0) <
				SCRAMBLE_SLIDE_COOLDOWN
			)
				return;

			// Verify player is mounted on Hachi
			if (!isPlayerMounted(player)) return;
			const character = player.Character;
			if (!character) return;
			const hrp = character.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (!hrp) return;

			// Verify within range of a slide ramp (OBB closest-point)
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

			this.slideCooldowns.set(player.UserId, now);
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

			// Disable walk during slide impulse, apply velocity with PlatformStand guard
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			if (!humanoid) return;
			if (this.hachiSlideActive.has(player.UserId)) return;
			this.hachiSlideActive.add(player.UserId);
			humanoid.WalkSpeed = 0;
			humanoid.PlatformStand = true;
			hrp.AssemblyLinearVelocity = serverDir.mul(speed);
			task.delay(HACHI_SLIDE_DURATION, () => {
				this.hachiSlideActive.delete(player.UserId);
				if (!humanoid.Parent) return;
				humanoid.PlatformStand = false;
				if (isPlayerMounted(player)) {
					const data = this.playerDataService.getPlayerData(player);
					const evoLevel = math.max(
						data?.maxHachiLevel ?? 0,
						HACHI_LOBBY_MIN_LEVEL,
					);
					updateHachiWalkSpeed(player, evoLevel);
				} else {
					humanoid.WalkSpeed = DEFAULT_WALK_SPEED;
				}
			});
		});
	}

	/** Animate Hachi costume models on mounted players. */
	private setupHachiAnimation() {
		RunService.Heartbeat.Connect((dt) => {
			// Animate all currently mounted players' Hachi costumes
			for (const player of Players.GetPlayers()) {
				const hachiModel = getPlayerHachi(player);
				if (!hachiModel || !hachiModel.Parent) continue;
				const body = hachiModel.FindFirstChild("Body") as BasePart | undefined;
				if (!body) continue;

				let state = this.hachiAnimStates.get(hachiModel);
				if (!state) {
					state = { animTime: 0, airborne: false };
				}
				this.hachiAnimStates.set(hachiModel, animateHachi(body, dt, state));
			}

			// Clean up stale entries
			for (const [model] of this.hachiAnimStates) {
				if (!model.Parent) {
					this.hachiAnimStates.delete(model);
				}
			}
		});
	}

	private setupLobbyHachiJump() {
		this.serverEvents.hachiJump.connect((player) => {
			if (this.matchActive) return;
			if (!isPlayerMounted(player)) return;

			const now = os.clock();
			if (
				now - (this.hachiJumpCooldowns.get(player.UserId) ?? 0) <
				HACHI_JUMP_COOLDOWN
			)
				return;

			this.hachiJumpCooldowns.set(player.UserId, now);
			// Jump impulse is applied client-side (native Humanoid jump).
			// Server tracks phase for double-jump gating.
			const data = this.playerDataService.getPlayerData(player);
			const maxLevel = math.max(
				data?.maxHachiLevel ?? 0,
				HACHI_LOBBY_MIN_LEVEL,
			);
			this.lobbyJumpPhase.set(player.UserId, maxLevel >= 2 ? 1 : 2);

			// Reset phase when landed (HRP Y velocity settles)
			task.delay(0.3, () => {
				const hrp = player.Character?.FindFirstChild("HumanoidRootPart") as
					| BasePart
					| undefined;
				if (!hrp) return;
				let checks = 0;
				const landConn = RunService.Heartbeat.Connect(() => {
					checks++;
					if (checks > 300) {
						landConn.Disconnect();
						this.lobbyJumpPhase.set(player.UserId, 0);
						return;
					}
					if (math.abs(hrp.AssemblyLinearVelocity.Y) < 5) {
						landConn.Disconnect();
						this.lobbyJumpPhase.set(player.UserId, 0);
					}
				});
			});
		});
	}

	private setupLobbyDoubleJump() {
		this.serverEvents.hachiLobbyDoubleJump.connect((player) => {
			if (this.matchActive) return;

			const phase = this.lobbyJumpPhase.get(player.UserId) ?? 0;
			if (phase !== 1) return;

			const data = this.playerDataService.getPlayerData(player);
			if (!data || math.max(data.maxHachiLevel, HACHI_LOBBY_MIN_LEVEL) < 2)
				return;

			if (!isPlayerMounted(player)) return;
			const hrp = player.Character?.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (!hrp) return;

			// Must be airborne
			if (math.abs(hrp.AssemblyLinearVelocity.Y) < 5) return;

			this.lobbyJumpPhase.set(player.UserId, 2);
			// Impulse applied client-side for instant feel.
			this.serverEvents.hachiDoubleJumpGranted.fire(player);
		});
	}

	private setupLobbyWallRun() {
		this.serverEvents.hachiLobbyWallRun.connect((player, wallNormal) => {
			if (this.matchActive) return;

			const data = this.playerDataService.getPlayerData(player);
			if (!data || math.max(data.maxHachiLevel, HACHI_LOBBY_MIN_LEVEL) < 3)
				return;

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

			// Server raycast
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

			// Flip direction if it opposes the player's horizontal velocity
			const vel = hrp.AssemblyLinearVelocity;
			const horizontal = new Vector3(vel.X, 0, vel.Z);
			if (horizontal.Magnitude > 1 && lateralDir.Dot(horizontal.Unit) < 0) {
				lateralDir = lateralDir.mul(-1);
			}

			// Guard against concurrent wall-runs
			if (this.hachiSlideActive.has(player.UserId)) return;
			this.hachiSlideActive.add(player.UserId);

			// Lock movement during wall run with PlatformStand guard
			humanoid.WalkSpeed = 0;
			humanoid.AutoRotate = false;
			humanoid.PlatformStand = true;
			hrp.AssemblyLinearVelocity = lateralDir.mul(HACHI_WALL_RUN_SPEED);
			this.serverEvents.hachiWallRunStart.fire(player, serverNormal);

			task.delay(HACHI_WALL_RUN_MAX_DUR, () => {
				this.hachiSlideActive.delete(player.UserId);
				if (!humanoid.Parent) return;
				humanoid.PlatformStand = false;
				humanoid.AutoRotate = true;
				if (isPlayerMounted(player)) {
					const data = this.playerDataService.getPlayerData(player);
					const evoLevel = math.max(
						data?.maxHachiLevel ?? 0,
						HACHI_LOBBY_MIN_LEVEL,
					);
					updateHachiWalkSpeed(player, evoLevel);
				} else {
					humanoid.WalkSpeed = DEFAULT_WALK_SPEED;
				}
				this.serverEvents.hachiWallRunStop.fire(player);
			});
		});
	}

	private setupLobbyHachiEject() {
		this.serverEvents.hachiEject.connect((player) => {
			if (this.matchActive) return;
			if (!isPlayerMounted(player)) return;

			const now = os.clock();
			if (
				now - (this.hachiEjectCooldowns.get(player.UserId) ?? 0) <
				HACHI_EJECT_COOLDOWN
			)
				return;
			this.hachiEjectCooldowns.set(player.UserId, now);

			unequipHachiCostume(player);
		});
	}

	teleportToLobby(player: Player) {
		const character = player.Character;
		if (!character) return;

		if (this.lobbySpawns.size() > 0) {
			const spawn =
				this.lobbySpawns[math.random(0, this.lobbySpawns.size() - 1)];
			character.PivotTo(spawn.CFrame.add(new Vector3(0, 3, 0)));
			print(`[LobbyService] ${player.Name} teleported to lobby`);
		} else {
			const spawn = Workspace.FindFirstChildWhichIsA("SpawnLocation");
			if (spawn) {
				character.PivotTo(spawn.CFrame.add(new Vector3(0, 3, 0)));
				print(
					`[LobbyService] ${player.Name} teleported to lobby (fallback spawn)`,
				);
			} else {
				warn(`[LobbyService] No spawn found for ${player.Name}`);
			}
		}
	}

	teleportToMatchArea(player: Player, position: Vector3) {
		const character = player.Character;
		if (!character) return;
		character.PivotTo(new CFrame(position));
	}
}
