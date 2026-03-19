import { Controller, OnStart } from "@flamework/core";
import {
	ContextActionService,
	Players,
	RunService,
	SoundService,
} from "@rbxts/services";
import { clientEvents } from "client/network";
import { SE_JUMP } from "shared/constants";
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
	return body !== undefined && classIs(body, "BasePart");
}

@Controller()
export class HachiRideController implements OnStart {
	private seatedInHachi = false;

	private steppedConn?: RBXScriptConnection;
	private bobConn?: RBXScriptConnection;
	private bobRootC0?: CFrame; // original Motor6D.C0 to restore on dismount

	// Original humanoid jump values, restored on dismount
	private origJumpPower = 0;
	private origJumpHeight = 0;
	private jumpLocked = false;

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
		});
	}

	// Called when player sits in any Hachi's VehicleSeat
	private onSeated() {
		const character = Players.LocalPlayer.Character;
		const humanoid = character?.FindFirstChildOfClass("Humanoid");

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
					if (this.seatedInHachi) {
						clientEvents.hachiJump.fire();
						this.playJumpSE();
					}
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
				const spd = body.AssemblyLinearVelocity.Magnitude;
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
		ContextActionService.UnbindAction(ACTION_HACHI_JUMP);
		ContextActionService.UnbindAction(ACTION_HACHI_EJECT);

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
}
