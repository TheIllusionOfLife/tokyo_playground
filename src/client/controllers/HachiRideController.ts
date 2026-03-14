import { Controller, OnStart } from "@flamework/core";
import { Players, RunService, UserInputService } from "@rbxts/services";
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
			this.canDoubleJump = true;
		});

		clientEvents.hachiWallRunStart.connect((wallNormal) => {
			this.startWallRun(wallNormal);
		});

		clientEvents.hachiWallRunStop.connect(() => {
			this.stopWallRun();
		});
	}

	private activate() {
		this.active = true;
		this.canDoubleJump = false;
		this.hasDoubleJumped = false;
		this.isWallRunning = false;

		// Double jump — listen for jump input while airborne
		this.inputConn = UserInputService.InputBegan.Connect((input, processed) => {
			if (processed) return;
			if (!this.active || !this.canDoubleJump) return;
			if (input.KeyCode !== Enum.KeyCode.Space) return;

			const character = Players.LocalPlayer.Character;
			if (!character) return;
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			if (!humanoid) return;
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

		// Reset double jump when grounded; apply wall-run velocity each frame
		this.heartbeatConn = RunService.Heartbeat.Connect((_dt) => {
			if (!this.active) return;
			const character = Players.LocalPlayer.Character;
			if (!character) return;
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			if (!humanoid) return;

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
		});
	}

	private deactivate() {
		this.stopWallRun();
		this.active = false;
		this.canDoubleJump = false;
		this.hasDoubleJumped = false;

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

	private startWallRun(wallNormal: Vector3) {
		this.isWallRunning = true;
		// Wall-run direction is perpendicular to the wall normal in the horizontal plane
		const character = Players.LocalPlayer.Character;
		if (character) {
			const hrp = character.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (hrp) {
				const forward = new Vector3(
					hrp.CFrame.LookVector.X,
					0,
					hrp.CFrame.LookVector.Z,
				).Unit;
				// Project forward onto the wall plane
				const projected = forward.sub(wallNormal.mul(forward.Dot(wallNormal)));
				this.wallRunDir =
					projected.Magnitude > 0.001
						? projected.Unit
						: new Vector3(wallNormal.Z, 0, -wallNormal.X).Unit;
			}
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			if (humanoid) humanoid.PlatformStand = true;
		}
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
