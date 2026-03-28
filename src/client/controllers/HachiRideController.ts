import { Controller, OnStart } from "@flamework/core";
import {
	ContentProvider,
	ContextActionService,
	Players,
	RunService,
	SoundService,
	UserInputService,
} from "@rbxts/services";
import { clientEvents } from "client/network";
import {
	HACHI_COSTUME_NAME,
	HACHI_DOUBLE_JUMP_IMPULSE,
	HACHI_JUMP_COOLDOWN,
	HACHI_LOBBY_MIN_LEVEL,
	SE_JUMP,
} from "shared/constants";
import { gameStore } from "shared/store/game-store";
import { MinigameId } from "shared/types";

const ACTION_HACHI_EJECT = "HachiEject";
const ACTION_HACHI_JUMP = "HachiJumpSink";

// Body bob tuning
const BOB_MAX_AMPLITUDE = 0.3;
const BOB_SPEED_THRESHOLD = 5;
const BOB_FREQ_SCALE = 1.5;

@Controller()
export class HachiRideController implements OnStart {
	private costumed = false;

	private bobConn?: RBXScriptConnection;
	private bobRootC0?: CFrame;
	private stateChangedConn?: RBXScriptConnection;
	private landedCheckConn?: RBXScriptConnection;
	private wallRunStartConn?: RBXScriptConnection;
	private wallRunStopConn?: RBXScriptConnection;
	private jumpRequestConn?: RBXScriptConnection;

	// Client-side jump phase: 0=grounded, 1=double available, 2=used
	private jumpPhase = 0;
	private lastJumpTime = 0;
	private wallRunning = false;
	private doubleJumpConsumed = false;

	private isInMinigame(): boolean {
		return gameStore.getState().activeMinigameId === MinigameId.HachiRide;
	}

	private getActiveEvoLevel(): number {
		return this.isInMinigame()
			? gameStore.getState().hachiEvolutionLevel
			: HACHI_LOBBY_MIN_LEVEL;
	}

	onStart() {
		clientEvents.hachiCostumeEquipped.connect((equipped) => {
			if (equipped && !this.costumed) {
				this.onCostumeEquipped();
			} else if (!equipped && this.costumed) {
				this.onCostumeRemoved();
			}
		});

		Players.LocalPlayer.CharacterRemoving?.Connect(() => {
			if (this.costumed) {
				this.onCostumeRemoved();
			}
		});
	}

	private onCostumeEquipped() {
		const character = Players.LocalPlayer.Character;
		const humanoid = character?.FindFirstChildOfClass("Humanoid");
		if (!character || !humanoid) return;

		// Set costumed AFTER guard so early return doesn't leave stale state
		this.costumed = true;

		// Reset jump state
		this.jumpPhase = 0;
		this.lastJumpTime = 0;
		this.wallRunning = false;

		// Listen for wall-run events
		this.wallRunStartConn = clientEvents.hachiWallRunStart.connect(() => {
			this.wallRunning = true;
		});
		this.wallRunStopConn = clientEvents.hachiWallRunStop.connect(() => {
			this.wallRunning = false;
		});

		// Hide "Hachi" BillboardGui on the costume model
		const hachiModel = character.FindFirstChild(HACHI_COSTUME_NAME) as
			| Model
			| undefined;
		const billboard = hachiModel
			?.FindFirstChild("Head")
			?.FindFirstChildOfClass("BillboardGui");
		if (billboard) billboard.Enabled = false;

		this.setDefaultJumpSoundEnabled(false);
		this.ensureJumpSE();

		// Double jump detection via Humanoid.StateChanged.
		// Arm double jump after first real jump (not slope/small drop).
		this.stateChangedConn = humanoid.StateChanged.Connect(
			(_oldState, newState) => {
				if (
					newState === Enum.HumanoidStateType.Jumping &&
					this.jumpPhase === 0
				) {
					// First jump detected (native). Arm double if evolution allows.
					this.lastJumpTime = os.clock();
					this.jumpPhase = this.getActiveEvoLevel() >= 1 ? 1 : 2;
					this.doubleJumpConsumed = false;
					this.playJumpSE();
					// Notify server so it can arm phase tracking
					clientEvents.hachiJump.fire();
				} else if (newState === Enum.HumanoidStateType.Landed) {
					this.jumpPhase = 0;
				}
			},
		);

		// Backup landed check: FloorMaterial + grounded timer
		this.landedCheckConn = RunService.Heartbeat.Connect(() => {
			if (this.jumpPhase === 0) return;
			if (this.wallRunning) return;
			if (os.clock() - this.lastJumpTime < 0.5) return;
			if (humanoid.FloorMaterial !== Enum.Material.Air) {
				this.jumpPhase = 0;
			}
		});

		// CAS sink: intercept Space/ButtonA for double jump only.
		// No createTouchButton (false) to avoid duplicate mobile jump button.
		// The native Humanoid jump button handles the first jump on mobile.
		ContextActionService.BindAction(
			ACTION_HACHI_JUMP,
			(_name, inputState, _input) => {
				if (inputState !== Enum.UserInputState.Begin) {
					return Enum.ContextActionResult.Pass;
				}
				if (!this.costumed) return Enum.ContextActionResult.Pass;

				if (this.jumpPhase === 1) {
					if (this.performDoubleJump()) {
						return Enum.ContextActionResult.Sink;
					}
				}

				// Phase 0 or 2: let native jump handle it
				return Enum.ContextActionResult.Pass;
			},
			false, // no createTouchButton: avoids duplicate mobile jump button
			Enum.KeyCode.Space,
			Enum.KeyCode.ButtonA,
		);

		// Mobile double jump: UserInputService.JumpRequest fires when the
		// native touch jump button is tapped. CAS doesn't create a touch
		// button, so this is the only path for mobile double jump.
		this.jumpRequestConn?.Disconnect();
		this.jumpRequestConn = UserInputService.JumpRequest.Connect(() => {
			if (!this.costumed) return;
			if (this.jumpPhase !== 1) return;
			if (this.doubleJumpConsumed) return;
			const h =
				Players.LocalPlayer.Character?.FindFirstChildOfClass("Humanoid");
			if (!h) return;
			const state = h.GetState();
			if (
				state !== Enum.HumanoidStateType.Jumping &&
				state !== Enum.HumanoidStateType.Freefall
			) {
				return;
			}
			this.performDoubleJump();
		});

		// E key to dismount (blocked during active Hachi minigame)
		ContextActionService.BindAction(
			ACTION_HACHI_EJECT,
			(_name, inputState, _input) => {
				if (inputState === Enum.UserInputState.Begin) {
					if (this.isInMinigame()) {
						return Enum.ContextActionResult.Sink;
					}
					clientEvents.hachiToggleCostume.fire(false);
				}
				return Enum.ContextActionResult.Sink;
			},
			false,
			Enum.KeyCode.E,
		);

		// Body bob: sinusoidal vertical offset on character root Motor6D
		const lowerTorso = character.FindFirstChild("LowerTorso") as
			| BasePart
			| undefined;
		const rootMotor = lowerTorso?.FindFirstChild("Root") as Motor6D | undefined;
		if (rootMotor) {
			this.bobRootC0 = rootMotor.C0;
			let bobTime = 0;
			this.bobConn = RunService.RenderStepped.Connect((dt) => {
				const hrp = Players.LocalPlayer.Character?.FindFirstChild(
					"HumanoidRootPart",
				) as BasePart | undefined;
				if (!hrp) return;
				const vel = hrp.AssemblyLinearVelocity;
				const spd = new Vector3(vel.X, 0, vel.Z).Magnitude;
				const freq = math.max(1, spd / 25) * BOB_FREQ_SCALE;
				bobTime += dt * freq;
				const t = math.clamp((spd - BOB_SPEED_THRESHOLD) / 30, 0, 1);
				const offset = math.sin(bobTime) * BOB_MAX_AMPLITUDE * t;
				rootMotor.C0 = this.bobRootC0!.mul(new CFrame(0, offset, 0));
			});
		}
	}

	private performDoubleJump(): boolean {
		const now = os.clock();
		if (now - this.lastJumpTime < HACHI_JUMP_COOLDOWN) return false;
		if (this.doubleJumpConsumed) return false;

		// Validate character and airborne state BEFORE consuming state
		const h = Players.LocalPlayer.Character?.FindFirstChildOfClass("Humanoid");
		const hrp = Players.LocalPlayer.Character?.FindFirstChild(
			"HumanoidRootPart",
		) as BasePart | undefined;
		if (!hrp || !h) return false;
		const state = h.GetState();
		if (
			state !== Enum.HumanoidStateType.Jumping &&
			state !== Enum.HumanoidStateType.Freefall
		) {
			return false;
		}

		this.lastJumpTime = now;
		this.jumpPhase = 2;
		this.doubleJumpConsumed = true;

		if (hrp && h) {
			h.PlatformStand = true;
			hrp.AssemblyLinearVelocity = new Vector3(
				hrp.AssemblyLinearVelocity.X,
				HACHI_DOUBLE_JUMP_IMPULSE,
				hrp.AssemblyLinearVelocity.Z,
			);
			task.defer(() => {
				if (h.Parent) {
					h.PlatformStand = false;
					h.ChangeState(Enum.HumanoidStateType.Jumping);
				}
			});
		}

		if (this.isInMinigame()) {
			clientEvents.hachiDoubleJump.fire();
		} else {
			clientEvents.hachiLobbyDoubleJump.fire();
		}
		this.playJumpSE();
		return true;
	}

	private onCostumeRemoved() {
		this.costumed = false;

		this.setDefaultJumpSoundEnabled(true);

		this.stateChangedConn?.Disconnect();
		this.stateChangedConn = undefined;
		this.landedCheckConn?.Disconnect();
		this.landedCheckConn = undefined;
		this.wallRunStartConn?.Disconnect();
		this.wallRunStartConn = undefined;
		this.wallRunStopConn?.Disconnect();
		this.wallRunStopConn = undefined;
		this.jumpRequestConn?.Disconnect();
		this.jumpRequestConn = undefined;
		this.wallRunning = false;

		ContextActionService.UnbindAction(ACTION_HACHI_JUMP);
		ContextActionService.UnbindAction(ACTION_HACHI_EJECT);

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

	private setDefaultJumpSoundEnabled(enabled: boolean) {
		const character = Players.LocalPlayer.Character;
		const hrp = character?.FindFirstChild("HumanoidRootPart") as
			| BasePart
			| undefined;
		const jumpSound = hrp?.FindFirstChild("Jumping") as Sound | undefined;
		if (jumpSound) jumpSound.Volume = enabled ? 0.65 : 0;
	}

	private jumpSE?: Sound;
	private lastJumpSETime = 0;

	private ensureJumpSE() {
		if (this.jumpSE) return;
		this.jumpSE = new Instance("Sound");
		this.jumpSE.SoundId = SE_JUMP;
		this.jumpSE.Volume = 0.4;
		this.jumpSE.Parent = SoundService;
		task.spawn(() => ContentProvider.PreloadAsync([this.jumpSE!]));
	}

	private playJumpSE() {
		const now = os.clock();
		if (now - this.lastJumpSETime < 0.05) return;
		this.lastJumpSETime = now;
		this.ensureJumpSE();
		this.jumpSE!.Play();
	}
}
