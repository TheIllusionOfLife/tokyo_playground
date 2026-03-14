import { Controller, OnStart } from "@flamework/core";
import {
	ContextActionService,
	Players,
	RunService,
	UserInputService,
} from "@rbxts/services";
import { clientEvents } from "client/network";
import {
	HACHI_DOUBLE_JUMP_IMPULSE,
	HACHI_WALK_SPEEDS,
	HACHI_WALL_RUN_SPEED,
} from "shared/constants";
import { MinigameId, PlayerRole, RoundResult } from "shared/types";

@Controller()
export class HachiRideController implements OnStart {
	private active = false;
	private canDoubleJump = false;
	private hasDoubleJumped = false;
	private isWallRunning = false;
	private wallRunDir = new Vector3(0, 0, 1);
	private wasSeated = false;

	private heartbeatConn?: RBXScriptConnection;
	private inputConn?: RBXScriptConnection;

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

		clientEvents.hachiDoubleJumpGranted.connect(() => {
			if (!this.active) return;
			this.canDoubleJump = true;
		});

		clientEvents.hachiWallRunStart.connect((wallNormal) => {
			if (!this.active) return;
			this.startWallRun(wallNormal);
		});

		clientEvents.hachiWallRunStop.connect(() => {
			if (!this.active) return;
			this.stopWallRun();
		});
	}

	private activate() {
		if (this.active) return;
		this.active = true;
		this.canDoubleJump = false;
		this.hasDoubleJumped = false;
		this.isWallRunning = false;
		this.wasSeated = false;

		// Double jump — only fires while airborne and NOT seated
		this.inputConn = UserInputService.InputBegan.Connect((input, processed) => {
			if (processed) return;
			if (!this.active || !this.canDoubleJump) return;
			if (input.KeyCode !== Enum.KeyCode.Space) return;

			const character = Players.LocalPlayer.Character;
			if (!character) return;
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			if (!humanoid) return;
			// While seated the jump is handled by ContextActionService binding;
			// this handler only fires when ContextActionService hasn't sunk the event.
			if (humanoid.Sit) return;
			if (humanoid.FloorMaterial !== Enum.Material.Air) return;
			if (this.hasDoubleJumped) return;

			this.hasDoubleJumped = true;
			const hrp = character.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (hrp) {
				hrp.AssemblyLinearVelocity = new Vector3(
					hrp.AssemblyLinearVelocity.X,
					HACHI_DOUBLE_JUMP_IMPULSE,
					hrp.AssemblyLinearVelocity.Z,
				);
			}
		});

		// Heartbeat: seated transitions, double-jump reset, wall-run velocity
		this.heartbeatConn = RunService.Heartbeat.Connect((_dt) => {
			if (!this.active) return;
			const character = Players.LocalPlayer.Character;
			if (!character) return;
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			if (!humanoid) return;

			// Seated state transitions
			const seated = humanoid.Sit;
			if (seated !== this.wasSeated) {
				this.wasSeated = seated;
				if (seated) {
					this.onSeated();
				} else {
					this.onStoodUp();
				}
			}

			if (!seated) {
				// Reset double jump on landing
				if (humanoid.FloorMaterial !== Enum.Material.Air) {
					this.hasDoubleJumped = false;
				}

				// Apply wall-run horizontal velocity each frame
				if (this.isWallRunning) {
					const hrp = character.FindFirstChild("HumanoidRootPart") as
						| BasePart
						| undefined;
					if (hrp) {
						hrp.AssemblyLinearVelocity = new Vector3(
							this.wallRunDir.X * HACHI_WALL_RUN_SPEED,
							hrp.AssemblyLinearVelocity.Y,
							this.wallRunDir.Z * HACHI_WALL_RUN_SPEED,
						);
					}
				}
			}
		});
	}

	private deactivate() {
		if (!this.active) return;
		this.stopWallRun();
		this.onStoodUp(); // unbind any seated ContextAction bindings
		this.active = false;
		this.canDoubleJump = false;
		this.hasDoubleJumped = false;
		this.wasSeated = false;

		this.inputConn?.Disconnect();
		this.heartbeatConn?.Disconnect();
		this.inputConn = undefined;
		this.heartbeatConn = undefined;

		// Restore WalkSpeed
		const character = Players.LocalPlayer.Character;
		if (character) {
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			if (humanoid) humanoid.WalkSpeed = HACHI_WALK_SPEEDS[0];
		}
	}

	// Called when player sits in Hachi's VehicleSeat
	private onSeated() {
		// Sink Space to prevent the VehicleSeat's default jump-eject; fire hachiJump instead
		ContextActionService.BindAction(
			"HachiJump",
			(_name, inputState, _input) => {
				if (inputState === Enum.UserInputState.Begin) {
					clientEvents.hachiJump.fire();
				}
				return Enum.ContextActionResult.Sink;
			},
			false,
			Enum.KeyCode.Space,
			Enum.KeyCode.ButtonA,
		);

		// E key to dismount
		ContextActionService.BindAction(
			"HachiEject",
			(_name, inputState, _input) => {
				if (inputState === Enum.UserInputState.Begin) {
					clientEvents.hachiEject.fire();
				}
				return Enum.ContextActionResult.Sink;
			},
			false,
			Enum.KeyCode.E,
		);
	}

	// Called when player stands up (or deactivate is called)
	private onStoodUp() {
		ContextActionService.UnbindAction("HachiJump");
		ContextActionService.UnbindAction("HachiEject");
	}

	private startWallRun(wallNormal: Vector3) {
		// Validate character before mutating state
		const character = Players.LocalPlayer.Character;
		if (!character) return;
		const hrp = character.FindFirstChild("HumanoidRootPart") as
			| BasePart
			| undefined;
		if (!hrp) return;
		const humanoid = character.FindFirstChildOfClass("Humanoid");
		if (!humanoid) return;

		// Wall-run direction is perpendicular to the wall normal in the horizontal plane
		const eps = 1e-4;
		const xzRaw = new Vector3(
			hrp.CFrame.LookVector.X,
			0,
			hrp.CFrame.LookVector.Z,
		);
		const forward = xzRaw.Magnitude > eps ? xzRaw.Unit : new Vector3(0, 0, 1);
		// Project forward onto the wall plane
		const projected = forward.sub(wallNormal.mul(forward.Dot(wallNormal)));
		let wallDir: Vector3;
		if (projected.Magnitude > eps) {
			wallDir = projected.Unit;
		} else {
			// forward is parallel to wallNormal — use perpendicular in XZ
			const perp = new Vector3(wallNormal.Z, 0, -wallNormal.X);
			wallDir =
				perp.Magnitude > eps ? perp.Unit : Vector3.yAxis.Cross(wallNormal).Unit;
		}

		this.wallRunDir = wallDir;
		this.isWallRunning = true;
		humanoid.PlatformStand = true;
	}

	private stopWallRun() {
		if (!this.isWallRunning) return;
		this.isWallRunning = false;
		const character = Players.LocalPlayer.Character;
		if (character) {
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			if (humanoid) humanoid.PlatformStand = false;
		}
	}
}
