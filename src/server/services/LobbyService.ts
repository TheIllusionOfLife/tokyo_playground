import { OnStart, Service } from "@flamework/core";
import {
	CollectionService,
	Players,
	RunService,
	Workspace,
} from "@rbxts/services";
import {
	CAN_KICK_PORTAL_TAG,
	DEFAULT_WALK_SPEED,
	HACHI_DOUBLE_JUMP_IMPULSE,
	HACHI_EJECT_COOLDOWN,
	HACHI_EJECT_SEAT_DISABLE_DURATION,
	HACHI_JUMP_COOLDOWN,
	HACHI_JUMP_VELOCITY,
	HACHI_RIDE_PORTAL_TAG,
	HACHI_RIDE_TAG,
	HACHI_SLIDE_FORCE_RESTORE_DELAY,
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
import { applyHachiJumpImpulse } from "../utils/hachiPhysics";
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

	/** Registered by MatchService to avoid circular DI. */
	setOnStartRequested(cb: (minigameId: MinigameId) => void) {
		this.onStartRequested = cb;
	}

	/** Called by MatchService when a match starts/ends to disable lobby-level handlers. */
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
				// Small delay to let character load
				task.wait(0.5);
				// Set walk speed to project default (Roblox default is 16)
				const humanoid = character.FindFirstChildOfClass("Humanoid");
				if (humanoid) humanoid.WalkSpeed = DEFAULT_WALK_SPEED;
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

		// Cache slide ramps with live add/remove tracking
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

	private setupHachiRide() {
		for (const hachi of CollectionService.GetTagged(HACHI_RIDE_TAG)) {
			const seat = (hachi as Model).FindFirstChild("VehicleSeat") as
				| VehicleSeat
				| undefined;
			if (!seat) continue;

			seat.GetPropertyChangedSignal("Occupant").Connect(() => {
				const occupant = seat.Occupant;
				if (!occupant) return;
				const character = occupant.FindFirstAncestorOfClass("Model");
				if (!character) return;
				const player = Players.GetPlayerFromCharacter(character);
				if (player) {
					this.serverEvents.hintTextChanged.fire(
						player,
						"WASD / arrow keys to drive Hachi!",
					);
				}
			});
		}
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
			// Rate-limit first — prevents rapid-fire requests and MaxForce race.
			const now = os.clock();
			if (
				now - (this.slideCooldowns.get(player.UserId) ?? 0) <
				SCRAMBLE_SLIDE_COOLDOWN
			)
				return;

			// Verify player is seated in their own Hachi clone.
			const character = player.Character;
			if (!character) return;
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			const seatPart = humanoid?.SeatPart;
			if (!seatPart) return;
			const hachiModel = seatPart.Parent;
			if (!hachiModel) return;
			const isMinigameHachi = hachiModel.Name === `Hachi_${player.UserId}`;
			const isLobbyHachi = CollectionService.HasTag(hachiModel, HACHI_RIDE_TAG);
			if (!isMinigameHachi && !isLobbyHachi) return;
			const body = hachiModel.FindFirstChild("Body") as BasePart | undefined;
			if (!body) return;

			// Verify the Hachi body is within range of a slide ramp using OBB
			// closest-point (same math as client SlideController) so both sides agree.
			let nearestRamp: BasePart | undefined;
			let nearestDist = HACHI_SLIDE_RAMP_PROXIMITY;
			for (const ramp of this.slideRamps) {
				const localPos = ramp.CFrame.PointToObjectSpace(body.Position);
				const half = ramp.Size.mul(0.5);
				const clamped = new Vector3(
					math.clamp(localPos.X, -half.X, half.X),
					math.clamp(localPos.Y, -half.Y, half.Y),
					math.clamp(localPos.Z, -half.Z, half.Z),
				);
				const closestWorld = ramp.CFrame.PointToWorldSpace(clamped);
				const dist = body.Position.sub(closestWorld).Magnitude;
				if (dist < nearestDist) {
					nearestDist = dist;
					nearestRamp = ramp;
				}
			}
			if (!nearestRamp) return; // not near any ramp — reject spoofed request

			this.slideCooldowns.set(player.UserId, now);
			const usePlayerDir = nearestRamp.GetAttribute("UsePlayerDirection");
			let serverDir: Vector3;
			if (typeIs(usePlayerDir, "boolean") && usePlayerDir) {
				// Use player/Hachi's current horizontal velocity as boost direction
				const vel = body.AssemblyLinearVelocity;
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

			const bv = body.FindFirstChildOfClass("BodyVelocity");
			if (bv) {
				// Guard against in-flight restore overwriting origForce.
				if (this.hachiSlideActive.has(player.UserId)) return;
				this.hachiSlideActive.add(player.UserId);
				const origForce = bv.MaxForce;
				bv.MaxForce = Vector3.zero;
				body.AssemblyLinearVelocity = serverDir.mul(speed);
				task.delay(HACHI_SLIDE_FORCE_RESTORE_DELAY, () => {
					if (bv.Parent) bv.MaxForce = origForce;
					this.hachiSlideActive.delete(player.UserId);
				});
			} else {
				body.AssemblyLinearVelocity = serverDir.mul(speed);
			}
		});
	}

	private setupHachiAnimation() {
		const lobbyHachis = CollectionService.GetTagged(HACHI_RIDE_TAG).filter(
			(i): i is Model => i.IsA("Model"),
		);
		for (const hachi of lobbyHachis) {
			this.hachiAnimStates.set(hachi, { animTime: 0, airborne: false });
		}
		RunService.Heartbeat.Connect((dt) => {
			for (const [hachi, state] of this.hachiAnimStates) {
				if (!hachi.Parent) {
					this.hachiAnimStates.delete(hachi);
					continue;
				}
				const body = hachi.FindFirstChild("Body") as BasePart | undefined;
				if (!body) continue;
				this.hachiAnimStates.set(hachi, animateHachi(body, dt, state));
			}
		});
	}

	private setupLobbyHachiJump() {
		this.serverEvents.hachiJump.connect((player) => {
			if (this.matchActive) return;

			const character = player.Character;
			if (!character) return;
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			const seatPart = humanoid?.SeatPart;
			if (!seatPart) return;
			const hachiModel = seatPart.Parent;
			if (!hachiModel || !CollectionService.HasTag(hachiModel, HACHI_RIDE_TAG))
				return;

			// Verify player actually occupies this seat
			const seat = hachiModel.FindFirstChildOfClass("VehicleSeat") as
				| VehicleSeat
				| undefined;
			if (!seat || seat.Occupant !== humanoid) return;

			const now = os.clock();
			if (
				now - (this.hachiJumpCooldowns.get(player.UserId) ?? 0) <
				HACHI_JUMP_COOLDOWN
			)
				return;

			const body = hachiModel.FindFirstChild("Body") as BasePart | undefined;
			if (!body) return;
			// Only allow jump from near-ground
			if (math.abs(body.AssemblyLinearVelocity.Y) > 15) return;

			this.hachiJumpCooldowns.set(player.UserId, now);
			applyHachiJumpImpulse(body, HACHI_JUMP_VELOCITY);

			// Track jump phase for double-jump gating
			const data = this.playerDataService.getPlayerData(player);
			const maxLevel = data?.maxHachiLevel ?? 0;
			this.lobbyJumpPhase.set(
				player.UserId,
				maxLevel >= 2 ? 1 : 2, // 1 = double available, 2 = used
			);
		});
	}

	/** Lobby double-jump: requires maxHachiLevel >= 2, in-air (fix M1). */
	private setupLobbyDoubleJump() {
		this.serverEvents.hachiLobbyDoubleJump.connect((player) => {
			if (this.matchActive) return;

			const phase = this.lobbyJumpPhase.get(player.UserId) ?? 0;
			if (phase !== 1) return; // Must be in "double available" phase

			const data = this.playerDataService.getPlayerData(player);
			if (!data || data.maxHachiLevel < 2) return;

			const character = player.Character;
			if (!character) return;
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			const seatPart = humanoid?.SeatPart;
			if (!seatPart) return;
			const hachiModel = seatPart.Parent;
			if (!hachiModel || !CollectionService.HasTag(hachiModel, HACHI_RIDE_TAG))
				return;

			const body = hachiModel.FindFirstChild("Body") as BasePart | undefined;
			if (!body) return;

			this.lobbyJumpPhase.set(player.UserId, 2); // Used
			applyHachiJumpImpulse(body, HACHI_DOUBLE_JUMP_IMPULSE);
			this.serverEvents.hachiDoubleJumpGranted.fire(player);
		});
	}

	/** Lobby wall-run: requires maxHachiLevel >= 3, near wall (raycast). */
	private setupLobbyWallRun() {
		this.serverEvents.hachiLobbyWallRun.connect((player, wallNormal) => {
			if (this.matchActive) return;

			const data = this.playerDataService.getPlayerData(player);
			if (!data || data.maxHachiLevel < 3) return;

			const character = player.Character;
			if (!character) return;
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			const seatPart = humanoid?.SeatPart;
			if (!seatPart) return;
			const hachiModel = seatPart.Parent;
			if (!hachiModel || !CollectionService.HasTag(hachiModel, HACHI_RIDE_TAG))
				return;

			const body = hachiModel.FindFirstChild("Body") as BasePart | undefined;
			if (!body) return;

			// Fix #5: normalize + sanity check client-supplied normal
			const mag = wallNormal.Magnitude;
			if (mag < 0.5 || mag > 1.5) return; // reject bogus vectors
			const safeNormal = wallNormal.Unit;

			// Verify wall proximity via server raycast (overrides client claim)
			const rayDir = safeNormal.mul(-HACHI_WALL_RUN_RAYCAST);
			const rayResult = Workspace.Raycast(body.Position, rayDir);
			if (!rayResult) return;

			// Apply wall-run: zero gravity + lateral velocity
			// Guard against vertical normals that produce zero cross product
			const crossResult = safeNormal.Cross(new Vector3(0, 1, 0));
			if (crossResult.Magnitude < 0.1) return; // near-vertical normal, reject
			const lateralDir = crossResult.Unit;
			const bv = body.FindFirstChildOfClass("BodyVelocity");
			if (bv) {
				// Fix #5: guard against concurrent wall-runs with active flag
				if (this.hachiSlideActive.has(player.UserId)) return;
				this.hachiSlideActive.add(player.UserId);
				const origForce = bv.MaxForce;
				bv.MaxForce = Vector3.zero;
				body.AssemblyLinearVelocity = lateralDir.mul(HACHI_WALL_RUN_SPEED);
				this.serverEvents.hachiWallRunStart.fire(player, safeNormal);

				task.delay(HACHI_WALL_RUN_MAX_DUR, () => {
					if (bv.Parent) bv.MaxForce = origForce;
					this.hachiSlideActive.delete(player.UserId);
					this.serverEvents.hachiWallRunStop.fire(player);
				});
			}
		});
	}

	private setupLobbyHachiEject() {
		this.serverEvents.hachiEject.connect((player) => {
			if (this.matchActive) return;

			const character = player.Character;
			if (!character) return;
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			const seatPart = humanoid?.SeatPart;
			if (!seatPart) return;
			const hachiModel = seatPart.Parent;
			if (!hachiModel || !CollectionService.HasTag(hachiModel, HACHI_RIDE_TAG))
				return;

			// Verify player actually occupies this seat
			const seat = hachiModel.FindFirstChildOfClass("VehicleSeat") as
				| VehicleSeat
				| undefined;
			if (!seat || seat.Occupant !== humanoid) return;

			const now = os.clock();
			if (
				now - (this.hachiEjectCooldowns.get(player.UserId) ?? 0) <
				HACHI_EJECT_COOLDOWN
			)
				return;
			this.hachiEjectCooldowns.set(player.UserId, now);

			seat.Disabled = true;
			task.delay(HACHI_EJECT_SEAT_DISABLE_DURATION, () => {
				if (seat.Parent) seat.Disabled = false;
			});
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
			// Fallback: use first SpawnLocation in Workspace
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
