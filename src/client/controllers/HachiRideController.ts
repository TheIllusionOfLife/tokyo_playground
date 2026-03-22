import { Controller, OnStart } from "@flamework/core";
import {
	ContextActionService,
	Players,
	RunService,
	SoundService,
	Workspace,
} from "@rbxts/services";
import { clientEvents } from "client/network";
import {
	HACHI_DECEL_RATE,
	HACHI_DOUBLE_JUMP_IMPULSE,
	HACHI_JUMP_COOLDOWN,
	HACHI_JUMP_VELOCITY,
	HACHI_WALK_SPEEDS,
	SE_JUMP,
} from "shared/constants";
import { gameStore } from "shared/store/game-store";
import { MinigameId } from "shared/types";

const ACTION_HACHI_EJECT = "HachiEject";
const ACTION_HACHI_JUMP = "HachiJumpSink";

// Body bob tuning — slower than Hachi's leg freq for a gentle gallop sway
const BOB_MAX_AMPLITUDE = 0.3; // studs at full speed
const BOB_SPEED_THRESHOLD = 5; // studs/s below which bob is zero
const BOB_FREQ_SCALE = 1.5; // multiplier on base frequency (spd / 25)

/** Returns true when the seat belongs to a Hachi model (has a sibling "Body" BasePart). */
function isHachiSeat(seat: BasePart): boolean {
	const body = seat.Parent?.FindFirstChild("Body");
	return body !== undefined && body.IsA("BasePart");
}

@Controller()
export class HachiRideController implements OnStart {
	private seatedInHachi = false;

	private steppedConn?: RBXScriptConnection;
	private moveConn?: RBXScriptConnection;
	private bobConn?: RBXScriptConnection;
	private bobRootC0?: CFrame; // original Motor6D.C0 to restore on dismount
	private hiddenBillboard?: BillboardGui; // "Hachi" label hidden while riding
	private cachedBody?: BasePart; // Hachi body ref for dismount cleanup

	// Original humanoid jump values, restored on dismount
	private origJumpPower = 0;
	private origJumpHeight = 0;
	private jumpLocked = false;

	// Client-side jump phase tracking (mirrors server logic)
	// 0 = grounded/ready, 1 = jumped once (double available), 2 = fully used
	private jumpPhase = 0;
	private lastJumpTime = 0;
	// Wall-run state from server events. Used to guard checkLanded()
	// so jump phase isn't reset while wall-running (Y velocity can settle < 5).
	private wallRunning = false;
	private wallRunStartConn?: RBXScriptConnection;
	private wallRunStopConn?: RBXScriptConnection;
	// Cached original BodyVelocity.MaxForce to avoid stale capture on double jump.
	// Without caching, the second applyImpulse captures MaxForce while it's still
	// Vector3.zero from the first call, permanently zeroing it after both restores.
	private cachedBodyVelocityForce?: Vector3;

	onStart() {
		// Always-on: detect seating in any Hachi (lobby or minigame).
		RunService.Heartbeat.Connect(() => {
			const character = Players.LocalPlayer.Character;
			const humanoid = character?.FindFirstChildOfClass("Humanoid");

			// If character/humanoid is gone while we think we're seated,
			// clean up stale bindings (e.g. character died while mounted).
			if (!character || !humanoid) {
				if (this.seatedInHachi) {
					this.seatedInHachi = false;
					this.onStoodUp();
				}
				return;
			}

			const seatPart = humanoid.SeatPart;
			const inHachi =
				humanoid.Sit && seatPart !== undefined && isHachiSeat(seatPart);

			if (inHachi !== this.seatedInHachi) {
				this.seatedInHachi = inHachi;
				if (inHachi) {
					this.onSeated();
				} else {
					this.onStoodUp();
				}
			}

			// Reset jump phase when Hachi has landed
			if (this.seatedInHachi) {
				this.checkLanded();
			}
		});
	}

	// Called when player sits in any Hachi's VehicleSeat
	private onSeated() {
		const character = Players.LocalPlayer.Character;
		const humanoid = character?.FindFirstChildOfClass("Humanoid");

		// Hide "Hachi" BillboardGui label while riding
		const hachiModel = humanoid?.SeatPart?.Parent;
		const billboard = hachiModel
			?.FindFirstChild("Head")
			?.FindFirstChildOfClass("BillboardGui");
		if (billboard) {
			billboard.Enabled = false;
			this.hiddenBillboard = billboard;
		}

		// Cache body ref for dismount cleanup (SeatPart is nil when onStoodUp fires)
		this.cachedBody = hachiModel?.FindFirstChild("Body") as
			| BasePart
			| undefined;

		// Reset jump state for fresh mount
		this.jumpPhase = 0;
		this.lastJumpTime = 0;
		this.cachedBodyVelocityForce = undefined;
		this.wallRunning = false;

		// Listen for wall-run events to guard checkLanded()
		this.wallRunStartConn = clientEvents.hachiWallRunStart.connect(() => {
			this.wallRunning = true;
		});
		this.wallRunStopConn = clientEvents.hachiWallRunStop.connect(() => {
			this.wallRunning = false;
		});

		if (humanoid) {
			// Layer 1: Disable the Jumping HumanoidStateType entirely.
			// Not fully reliable for seat eject, but reduces frequency.
			humanoid.SetStateEnabled(Enum.HumanoidStateType.Jumping, false);

			// Layer 2: Set JumpPower/JumpHeight to 0. This hides the
			// mobile jump button automatically, preventing touch-based eject.
			this.origJumpPower = humanoid.JumpPower;
			this.origJumpHeight = humanoid.JumpHeight;
			humanoid.JumpPower = 0;
			humanoid.JumpHeight = 0;
			this.jumpLocked = true;

			// Layer 3: Stepped loop as additional safety net. Even though
			// it can't always win the write-write race with the engine's
			// ControlModule, it catches some frames.
			this.steppedConn = RunService.Stepped.Connect(() => {
				if (humanoid.Parent && humanoid.Jump) {
					humanoid.Jump = false;
				}
			});
		}

		// Layer 4: ContextActionService sink for Space/ButtonA.
		// CAS intercepts input BEFORE it reaches the seat eject codepath
		// on desktop and gamepad. createTouchButton=true provides a
		// replacement jump button on mobile (since JumpPower=0 hides
		// the default one).
		ContextActionService.BindAction(
			ACTION_HACHI_JUMP,
			(_name, inputState, _input) => {
				if (inputState === Enum.UserInputState.Begin) {
					if (!this.seatedInHachi) return Enum.ContextActionResult.Sink;
					const inMinigame =
						gameStore.getState().activeMinigameId === MinigameId.HachiRide;
					if (inMinigame) {
						// Client-side prediction: apply impulse locally for
						// instant feel. Server still receives event for bookkeeping.
						if (!this.tryLocalJump()) return Enum.ContextActionResult.Sink;
					}
					clientEvents.hachiJump.fire();
					this.playJumpSE();
				}
				return Enum.ContextActionResult.Sink;
			},
			true, // createTouchButton for mobile
			Enum.KeyCode.Space,
			Enum.KeyCode.ButtonA,
		);

		// E key to dismount (blocked during active Hachi minigame)
		ContextActionService.BindAction(
			ACTION_HACHI_EJECT,
			(_name, inputState, _input) => {
				if (inputState === Enum.UserInputState.Begin) {
					const { activeMinigameId } = gameStore.getState();
					if (activeMinigameId === MinigameId.HachiRide) {
						return Enum.ContextActionResult.Sink;
					}
					clientEvents.hachiEject.fire();
				}
				return Enum.ContextActionResult.Sink;
			},
			false,
			Enum.KeyCode.E,
		);

		// Resolve PlayerModule for GetMoveVector() — the canonical cross-platform
		// input API. Works with keyboard, mobile joystick, and gamepad uniformly.
		// VehicleSeat has MaxSpeed=0 + TurnSpeed=0 to fully disable its physics.
		const playerModule = Players.LocalPlayer.WaitForChild(
			"PlayerScripts",
		).WaitForChild("PlayerModule") as ModuleScript;
		const pm = require(playerModule) as {
			GetControls(): { GetMoveVector(): Vector3 };
		};

		this.moveConn = RunService.Heartbeat.Connect((dt) => {
			if (!this.seatedInHachi) return;
			// Don't override velocity during wall-run (server controls it)
			if (this.wallRunning) return;
			const h =
				Players.LocalPlayer.Character?.FindFirstChildOfClass("Humanoid");
			if (!h) return;
			const body = h.SeatPart?.Parent?.FindFirstChild("Body") as
				| BasePart
				| undefined;
			if (!body || !body.IsDescendantOf(game)) return;

			// Zero BodyVelocity.MaxForce so it doesn't fight our velocity writes.
			// (BodyVelocity re-asserts velocity every Heartbeat frame otherwise.)
			const bv = body.FindFirstChildOfClass("BodyVelocity");
			if (bv && bv.MaxForce.Magnitude > 0) {
				if (this.cachedBodyVelocityForce === undefined) {
					this.cachedBodyVelocityForce = bv.MaxForce;
				}
				bv.MaxForce = Vector3.zero;
			}

			// GetMoveVector returns raw input as (X=right, Y=up, Z=back).
			// Z is negative when W/Up is pressed (Roblox convention: -Z = forward).
			const moveVec = pm.GetControls().GetMoveVector();
			const hasInput = moveVec.Magnitude > 0.1;

			// Project onto world axes using camera orientation
			const cam = Workspace.CurrentCamera;
			let moveDir = Vector3.zero;
			if (hasInput && cam) {
				const camLook = cam.CFrame.LookVector;
				const camRight = cam.CFrame.RightVector;
				const fwdRaw = new Vector3(camLook.X, 0, camLook.Z);
				const rtRaw = new Vector3(camRight.X, 0, camRight.Z);
				// Guard against vertical camera (looking straight up/down)
				if (fwdRaw.Magnitude < 0.01 || rtRaw.Magnitude < 0.01) return;
				const forward = fwdRaw.Unit;
				const right = rtRaw.Unit;
				// Negate Z: GetMoveVector Z is negative for forward (W/Up)
				const raw = forward.mul(-moveVec.Z).add(right.mul(moveVec.X));
				moveDir = raw.Magnitude > 0.01 ? raw.Unit : Vector3.zero;
			}

			// Use evolution speed during minigame, base speed otherwise
			const state = gameStore.getState();
			const evoLevel =
				state.activeMinigameId === MinigameId.HachiRide
					? state.hachiEvolutionLevel
					: 0;
			const speed =
				HACHI_WALK_SPEEDS[math.min(evoLevel, HACHI_WALK_SPEEDS.size() - 1)];

			if (moveDir.Magnitude > 0.01) {
				// Instant full speed in input direction, preserve Y velocity
				body.AssemblyLinearVelocity = new Vector3(
					moveDir.X * speed,
					body.AssemblyLinearVelocity.Y,
					moveDir.Z * speed,
				);

				// Rotate Hachi to face movement direction using BodyGyro.
				// BodyGyro applies torque that works WITH physics (no weld fighting).
				const seat = h.SeatPart;
				const gyro = seat?.FindFirstChildOfClass("BodyGyro");
				if (gyro) {
					gyro.CFrame = CFrame.lookAt(
						Vector3.zero,
						new Vector3(moveDir.X, 0, moveDir.Z),
					);
				}
			} else {
				// No input: frame-rate independent deceleration (normalized to 60fps)
				const decay = math.pow(HACHI_DECEL_RATE, dt * 60);
				const vel = body.AssemblyLinearVelocity;
				body.AssemblyLinearVelocity = new Vector3(
					vel.X * decay,
					vel.Y,
					vel.Z * decay,
				);
			}
		});

		// Body bob: sinusoidal vertical offset on the character's root Motor6D,
		// synced with Hachi's leg animation frequency so the rider bounces in rhythm.
		// R15: Motor6D "Root" lives in LowerTorso (Part1), not HumanoidRootPart (Part0).
		const lowerTorso = character?.FindFirstChild("LowerTorso") as
			| BasePart
			| undefined;
		const rootMotor = lowerTorso?.FindFirstChild("Root") as Motor6D | undefined;
		if (rootMotor && humanoid) {
			this.bobRootC0 = rootMotor.C0;
			let bobTime = 0;
			this.bobConn = RunService.RenderStepped.Connect((dt) => {
				// Resolve Hachi body lazily: SeatPart may not be assigned
				// in the same frame that Sit becomes true.
				const body = humanoid.SeatPart?.Parent?.FindFirstChild("Body") as
					| BasePart
					| undefined;
				// Guard: body may be destroyed mid-ride (server cleanup).
				if (!body || !body.IsDescendantOf(game)) return;
				// Use horizontal speed only (exclude Y) so falling doesn't affect bob/speed
				const vel = body.AssemblyLinearVelocity;
				const spd = new Vector3(vel.X, 0, vel.Z).Magnitude;
				const freq = math.max(1, spd / 25) * BOB_FREQ_SCALE;
				bobTime += dt * freq;
				// Ramp amplitude from 0 to max based on speed
				const t = math.clamp((spd - BOB_SPEED_THRESHOLD) / 30, 0, 1);
				const offset = math.sin(bobTime) * BOB_MAX_AMPLITUDE * t;
				rootMotor.C0 = this.bobRootC0!.mul(new CFrame(0, offset, 0));
			});
		}
	}

	// Called when player stands up (or deactivate is called)
	private onStoodUp() {
		this.steppedConn?.Disconnect();
		this.steppedConn = undefined;
		this.moveConn?.Disconnect();
		this.moveConn = undefined;
		this.wallRunStartConn?.Disconnect();
		this.wallRunStartConn = undefined;
		this.wallRunStopConn?.Disconnect();
		this.wallRunStopConn = undefined;
		this.wallRunning = false;
		ContextActionService.UnbindAction(ACTION_HACHI_JUMP);
		ContextActionService.UnbindAction(ACTION_HACHI_EJECT);

		// Restore BodyVelocity.MaxForce (zeroed during movement).
		// Uses cachedBody because SeatPart is nil by the time onStoodUp fires.
		if (this.cachedBodyVelocityForce !== undefined && this.cachedBody) {
			const bv = this.cachedBody.FindFirstChildOfClass("BodyVelocity");
			if (bv) bv.MaxForce = this.cachedBodyVelocityForce;
			this.cachedBodyVelocityForce = undefined;
		}
		this.cachedBody = undefined;

		// Restore "Hachi" BillboardGui label
		if (this.hiddenBillboard && this.hiddenBillboard.Parent) {
			this.hiddenBillboard.Enabled = true;
		}
		this.hiddenBillboard = undefined;

		// Restore humanoid jump properties
		if (this.jumpLocked) {
			const character = Players.LocalPlayer.Character;
			const humanoid = character?.FindFirstChildOfClass("Humanoid");
			if (humanoid) {
				humanoid.SetStateEnabled(Enum.HumanoidStateType.Jumping, true);
				humanoid.JumpPower = this.origJumpPower;
				humanoid.JumpHeight = this.origJumpHeight;
			}
			this.jumpLocked = false;
		}

		// Restore original root Motor6D and stop bob
		this.bobConn?.Disconnect();
		this.bobConn = undefined;
		if (this.bobRootC0) {
			const character = Players.LocalPlayer.Character;
			const lowerTorso = character?.FindFirstChild("LowerTorso") as
				| BasePart
				| undefined;
			const rootMotor = lowerTorso?.FindFirstChild("Root") as
				| Motor6D
				| undefined;
			if (rootMotor) rootMotor.C0 = this.bobRootC0;
			this.bobRootC0 = undefined;
		}
	}

	private jumpSE?: Sound;

	private lastJumpSETime = 0;

	private playJumpSE() {
		const now = os.clock();
		if (now - this.lastJumpSETime < 0.3) return;
		this.lastJumpSETime = now;
		if (!this.jumpSE) {
			this.jumpSE = new Instance("Sound");
			this.jumpSE.SoundId = SE_JUMP;
			this.jumpSE.Volume = 0.4;
			this.jumpSE.Parent = SoundService;
		}
		this.jumpSE.Play();
	}

	/** Client-side jump with phase tracking. Returns true if jump was applied.
	 *  Mirrors the server's phase logic so we don't apply impulses the
	 *  server would reject. Phase 0=grounded, 1=double available, 2=used. */
	private tryLocalJump(): boolean {
		const humanoid =
			Players.LocalPlayer.Character?.FindFirstChildOfClass("Humanoid");
		const body = humanoid?.SeatPart?.Parent?.FindFirstChild("Body") as
			| BasePart
			| undefined;
		if (!body) return false;

		const now = os.clock();
		if (now - this.lastJumpTime < HACHI_JUMP_COOLDOWN) return false;

		if (this.jumpPhase === 0) {
			// First jump: only from near-ground
			if (math.abs(body.AssemblyLinearVelocity.Y) > 15) return false;
			this.lastJumpTime = now;
			this.applyImpulse(body, HACHI_JUMP_VELOCITY);
			const evoLevel = gameStore.getState().hachiEvolutionLevel;
			this.jumpPhase = evoLevel >= 1 ? 1 : 2;
			return true;
		} else if (this.jumpPhase === 1) {
			// Double jump (midair, evolution >= 1)
			this.lastJumpTime = now;
			this.applyImpulse(body, HACHI_DOUBLE_JUMP_IMPULSE);
			this.jumpPhase = 2;
			return true;
		}
		// Phase 2: reject
		return false;
	}

	/** Reset jump phase when Hachi has landed (called from Heartbeat). */
	private checkLanded() {
		if (this.jumpPhase === 0) return;
		if (this.wallRunning) return; // Don't reset during wall-run (mirrors server)
		if (os.clock() - this.lastJumpTime < 1.0) return; // Too soon after jump
		const humanoid =
			Players.LocalPlayer.Character?.FindFirstChildOfClass("Humanoid");
		const body = humanoid?.SeatPart?.Parent?.FindFirstChild("Body") as
			| BasePart
			| undefined;
		if (!body) return;
		if (math.abs(body.AssemblyLinearVelocity.Y) < 5) {
			this.jumpPhase = 0;
		}
	}

	private applyImpulse(body: BasePart, velocity: number) {
		const bv = body.FindFirstChildOfClass("BodyVelocity");
		if (bv) {
			// moveConn already keeps MaxForce at zero during movement.
			// Just ensure it's zero for the impulse frame.
			bv.MaxForce = Vector3.zero;
		}
		body.AssemblyLinearVelocity = new Vector3(
			body.AssemblyLinearVelocity.X,
			velocity,
			body.AssemblyLinearVelocity.Z,
		);
	}
}
