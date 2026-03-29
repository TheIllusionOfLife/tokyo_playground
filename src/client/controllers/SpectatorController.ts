import { Controller, OnStart } from "@flamework/core";
import {
	Players,
	RunService,
	UserInputService,
	Workspace,
} from "@rbxts/services";
import { clientEvents } from "client/network";
import { gameStore } from "shared/store/game-store";
import { MatchPhase, PlayerRole } from "shared/types";

const CAMERA_OFFSET = new Vector3(0, 8, 16);
const CAMERA_LERP_SPEED = 5;
const CYCLE_COOLDOWN = 0.5;

@Controller()
export class SpectatorController implements OnStart {
	private active = false;
	private targetPlayer?: Player;
	private targetIndex = 0;
	private renderConn?: RBXScriptConnection;
	private inputConn?: RBXScriptConnection;
	private lastCycleTime = 0;

	onStart() {
		clientEvents.roleAssigned.connect((role) => {
			if (role === PlayerRole.Spectator) {
				this.enterSpectatorMode();
			}
		});

		clientEvents.matchPhaseChanged.connect((phase) => {
			if (
				phase === MatchPhase.WaitingForPlayers ||
				phase === MatchPhase.Rewarding
			) {
				this.exitSpectatorMode();
			}
		});
	}

	private getSpectateTargets(): Player[] {
		return Players.GetPlayers().filter((p) => {
			if (p === Players.LocalPlayer) return false;
			return p.Character?.FindFirstChild("HumanoidRootPart") !== undefined;
		});
	}

	private enterSpectatorMode() {
		if (this.active) return;

		const camera = Workspace.CurrentCamera;
		if (!camera) return;

		this.active = true;
		gameStore.setSpectating(true);

		const targets = this.getSpectateTargets();
		if (targets.size() > 0) {
			this.targetIndex = 0;
			this.targetPlayer = targets[0];
			gameStore.setSpectateTargetName(this.targetPlayer.Name);
			this.streamAroundTarget();
		}

		camera.CameraType = Enum.CameraType.Scriptable;

		this.renderConn = RunService.RenderStepped.Connect((dt) => {
			this.updateCamera(dt);
		});

		// Tap/click to cycle targets
		this.inputConn = UserInputService.InputBegan.Connect((input, processed) => {
			if (processed) return;
			if (
				input.UserInputType === Enum.UserInputType.Touch ||
				input.UserInputType === Enum.UserInputType.MouseButton1
			) {
				this.cycleTarget();
			}
		});
	}

	private exitSpectatorMode() {
		if (!this.active) return;
		this.active = false;

		gameStore.setSpectating(false);
		gameStore.setSpectateTargetName("");

		this.renderConn?.Disconnect();
		this.renderConn = undefined;
		this.inputConn?.Disconnect();
		this.inputConn = undefined;
		this.targetPlayer = undefined;

		const camera = Workspace.CurrentCamera;
		if (camera) {
			camera.CameraType = Enum.CameraType.Custom;
			const humanoid =
				Players.LocalPlayer.Character?.FindFirstChildOfClass("Humanoid");
			if (humanoid) {
				camera.CameraSubject = humanoid;
			}
		}
	}

	private cycleTarget() {
		const now = os.clock();
		if (now - this.lastCycleTime < CYCLE_COOLDOWN) return;
		this.lastCycleTime = now;

		const targets = this.getSpectateTargets();
		if (targets.size() === 0) {
			this.targetPlayer = undefined;
			gameStore.setSpectateTargetName("");
			return;
		}
		this.targetIndex = (this.targetIndex + 1) % targets.size();
		this.targetPlayer = targets[this.targetIndex];
		this.streamAroundTarget();

		gameStore.setSpectateTargetName(this.targetPlayer.Name);
	}

	private streamAroundTarget() {
		if (!this.targetPlayer) return;
		const hrp = this.targetPlayer.Character?.FindFirstChild(
			"HumanoidRootPart",
		) as BasePart | undefined;
		if (!hrp) return;

		task.spawn(() => {
			pcall(() => {
				Players.LocalPlayer.RequestStreamAroundAsync(hrp.Position);
			});
		});
	}

	private updateCamera(dt: number) {
		const camera = Workspace.CurrentCamera;
		if (!camera) return;

		// If target left or character missing, rate-limited auto-cycle
		if (
			!this.targetPlayer ||
			!this.targetPlayer.Parent ||
			!this.targetPlayer.Character
		) {
			this.cycleTarget();
			if (!this.targetPlayer) return;
		}

		const hrp = this.targetPlayer.Character?.FindFirstChild(
			"HumanoidRootPart",
		) as BasePart | undefined;
		if (!hrp) return;

		const targetPos = hrp.Position;
		const goalCF = new CFrame(targetPos.add(CAMERA_OFFSET), targetPos);
		const alpha = math.clamp(dt * CAMERA_LERP_SPEED, 0, 1);
		camera.CFrame = camera.CFrame.Lerp(goalCF, alpha);
		camera.Focus = new CFrame(targetPos);
	}
}
