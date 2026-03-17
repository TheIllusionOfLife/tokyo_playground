import { Controller, OnStart } from "@flamework/core";
import {
	ContextActionService,
	Players,
	RunService,
	SoundService,
} from "@rbxts/services";
import { clientEvents } from "client/network";
import { DEFAULT_WALK_SPEED, SE_JUMP } from "shared/constants";
import { MinigameId, PlayerRole, RoundResult } from "shared/types";

const ACTION_HACHI_JUMP = "HachiJump";
const ACTION_HACHI_EJECT = "HachiEject";

// Body bob tuning — matches animateHachi freq so rider bounces in sync with legs
const BOB_MAX_AMPLITUDE = 0.35; // studs at full speed
const BOB_SPEED_THRESHOLD = 5; // studs/s below which bob is zero

@Controller()
export class HachiRideController implements OnStart {
	private active = false;
	private wasSeated = false;

	private heartbeatConn?: RBXScriptConnection;
	private jumpConn?: RBXScriptConnection;
	private bobConn?: RBXScriptConnection;
	private bobRootC0?: CFrame; // original Motor6D.C0 to restore on dismount

	onStart() {
		clientEvents.roleAssigned.connect((role, minigameId) => {
			if (minigameId === MinigameId.HachiRide && role === PlayerRole.None) {
				this.activate();
			} else {
				this.deactivate();
			}
		});

		clientEvents.roundResultAnnounced.connect((_result: RoundResult) => {
			this.deactivate();
		});
	}

	private activate() {
		if (this.active) return;
		this.active = true;
		this.wasSeated = false;

		// Heartbeat: seated state transitions
		this.heartbeatConn = RunService.Heartbeat.Connect(() => {
			if (!this.active) return;
			const character = Players.LocalPlayer.Character;
			if (!character) return;
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			if (!humanoid) return;

			const seated = humanoid.Sit;
			if (seated !== this.wasSeated) {
				this.wasSeated = seated;
				if (seated) {
					this.onSeated();
				} else {
					this.onStoodUp();
				}
			}
		});
	}

	private deactivate() {
		if (!this.active) return;
		this.onStoodUp();
		this.active = false;
		this.wasSeated = false;

		this.heartbeatConn?.Disconnect();
		this.heartbeatConn = undefined;

		// Restore WalkSpeed
		const character = Players.LocalPlayer.Character;
		if (character) {
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			if (humanoid) humanoid.WalkSpeed = DEFAULT_WALK_SPEED;
		}
	}

	// Called when player sits in Hachi's VehicleSeat
	private onSeated() {
		// Space: fire hachiJump every press. Server decides regular vs double jump.
		ContextActionService.BindAction(
			ACTION_HACHI_JUMP,
			(_name, inputState, _input) => {
				if (inputState === Enum.UserInputState.Begin) {
					clientEvents.hachiJump.fire();
					this.playJumpSE();
				}
				return Enum.ContextActionResult.Sink;
			},
			false,
			Enum.KeyCode.Space,
			Enum.KeyCode.ButtonA,
		);

		// E key to dismount
		ContextActionService.BindAction(
			ACTION_HACHI_EJECT,
			(_name, inputState, _input) => {
				if (inputState === Enum.UserInputState.Begin) {
					clientEvents.hachiEject.fire();
				}
				return Enum.ContextActionResult.Sink;
			},
			false,
			Enum.KeyCode.E,
		);

		// Mobile: the touch jump button bypasses ContextActionService and
		// directly sets Humanoid.Jump = true, which unseats the player.
		// Intercept that property change, cancel the unseat, and fire Hachi jump.
		const character = Players.LocalPlayer.Character;
		const humanoid = character?.FindFirstChildOfClass("Humanoid");
		if (humanoid) {
			this.jumpConn = humanoid.GetPropertyChangedSignal("Jump").Connect(() => {
				if (humanoid.Jump) {
					humanoid.Jump = false;
					clientEvents.hachiJump.fire();
					this.playJumpSE();
				}
			});
		}

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
				if (!body) return;
				const spd = body.AssemblyLinearVelocity.Magnitude;
				const freq = math.max(1, spd / 15) * 3;
				bobTime += dt * freq;
				// Ramp amplitude from 0 to max based on speed
				const t = math.clamp((spd - BOB_SPEED_THRESHOLD) / 30, 0, 1);
				const offset = math.sin(bobTime * 2) * BOB_MAX_AMPLITUDE * t;
				rootMotor.C0 = this.bobRootC0!.mul(new CFrame(0, offset, 0));
			});
		}
	}

	// Called when player stands up (or deactivate is called)
	private onStoodUp() {
		ContextActionService.UnbindAction(ACTION_HACHI_JUMP);
		ContextActionService.UnbindAction(ACTION_HACHI_EJECT);
		this.jumpConn?.Disconnect();
		this.jumpConn = undefined;

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
