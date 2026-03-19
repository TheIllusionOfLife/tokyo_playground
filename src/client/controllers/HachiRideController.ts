import { Controller, OnStart } from "@flamework/core";
import {
	ContextActionService,
	Players,
	RunService,
	SoundService,
	UserInputService,
} from "@rbxts/services";
import { clientEvents } from "client/network";
import { SE_JUMP } from "shared/constants";
import { gameStore } from "shared/store/game-store";
import { MatchPhase, MinigameId } from "shared/types";

const ACTION_HACHI_EJECT = "HachiEject";

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
	private jumpRequestConn?: RBXScriptConnection;
	private bobConn?: RBXScriptConnection;
	private bobRootC0?: CFrame; // original Motor6D.C0 to restore on dismount

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

		// Stepped runs BEFORE physics each frame. Force Jump=false so the
		// engine's seat-exit logic never sees a true value. This is the only
		// reliable way to prevent the mobile touch jump button from unseating.
		// JumpRequest fires on all platforms (keyboard Space, gamepad A,
		// mobile touch button) even when Jump is forced false above.
		if (humanoid) {
			this.steppedConn = RunService.Stepped.Connect(() => {
				// Guard: humanoid may be destroyed before Heartbeat cleans up
				if (humanoid.Parent && humanoid.Jump) {
					const { matchPhase, activeMinigameId } = gameStore.getState();
					// Suppress Jump for all Hachi phases (Preparing, Countdown,
					// InProgress) but allow it at round end so the server's
					// seat eject (Jump=true) can work.
					if (
						activeMinigameId === MinigameId.HachiRide &&
						matchPhase !== MatchPhase.RoundOver &&
						matchPhase !== MatchPhase.Rewarding &&
						matchPhase !== MatchPhase.WaitingForPlayers
					) {
						humanoid.Jump = false;
					}
				}
			});

			this.jumpRequestConn = UserInputService.JumpRequest.Connect(() => {
				if (!this.seatedInHachi) return;
				clientEvents.hachiJump.fire();
				this.playJumpSE();
			});
		}

		// E key to dismount (blocked during active Hachi minigame round)
		ContextActionService.BindAction(
			ACTION_HACHI_EJECT,
			(_name, inputState, _input) => {
				if (inputState === Enum.UserInputState.Begin) {
					const { matchPhase, activeMinigameId } = gameStore.getState();
					if (
						activeMinigameId === MinigameId.HachiRide &&
						matchPhase !== MatchPhase.RoundOver &&
						matchPhase !== MatchPhase.Rewarding &&
						matchPhase !== MatchPhase.WaitingForPlayers
					) {
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
		this.jumpRequestConn?.Disconnect();
		this.jumpRequestConn = undefined;
		ContextActionService.UnbindAction(ACTION_HACHI_EJECT);

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
