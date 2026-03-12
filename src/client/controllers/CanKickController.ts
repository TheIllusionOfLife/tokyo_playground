import { Controller, OnStart } from "@flamework/core";
import { Players, RunService, TweenService, Workspace } from "@rbxts/services";
import { clientEvents } from "client/network";
import { CAN_KICK_RADIUS } from "shared/constants";
import { PlayerRole } from "shared/types";

@Controller()
export class CanKickController implements OnStart {
	private billboard?: BillboardGui;
	private heartbeatConn?: RBXScriptConnection;
	// Incremented on every role assignment — lets spawned async work self-cancel
	// if a second roleAssigned fires before WaitForChild resolves.
	private assignVersion = 0;

	onStart() {
		print("[CanKickController] Started");

		clientEvents.roleAssigned.connect((role) => {
			const version = ++this.assignVersion;
			if (role === PlayerRole.Hider) {
				// WaitForChild inside task.spawn — model may not be replicated yet
				task.spawn(() => {
					const can = Workspace.WaitForChild("GiantCan", 10) as
						| Model
						| undefined;
					// Guard: another roleAssigned may have fired while we waited
					if (can && version === this.assignVersion)
						this.startProximityLoop(can);
				});
			} else {
				this.cleanupProximity();
			}
		});

		clientEvents.playerCaught.connect((caughtPlayerId) => {
			if (Players.LocalPlayer.UserId === caughtPlayerId) {
				this.showScreenFlash(Color3.fromRGB(200, 50, 50));
			}
		});

		clientEvents.canKicked.connect((kickerPlayerId) => {
			if (Players.LocalPlayer.UserId === kickerPlayerId) {
				this.showScreenFlash(Color3.fromRGB(50, 200, 80));
			}
		});

		clientEvents.roundResultAnnounced.connect(() => {
			this.cleanupProximity();
		});
	}

	private startProximityLoop(can: Model) {
		const primaryPart = can.PrimaryPart;
		if (!primaryPart) return;

		// Create the proximity indicator BillboardGui on the can
		const billboard = new Instance("BillboardGui");
		billboard.Size = new UDim2(0, 200, 0, 50);
		billboard.StudsOffset = new Vector3(0, 4, 0);
		billboard.AlwaysOnTop = false;
		billboard.Enabled = false;
		billboard.Parent = primaryPart;
		this.billboard = billboard;

		const label = new Instance("TextLabel");
		label.Size = new UDim2(1, 0, 1, 0);
		label.BackgroundTransparency = 1;
		label.TextColor3 = Color3.fromRGB(255, 220, 100);
		label.Font = Enum.Font.GothamBold;
		label.TextScaled = true;
		label.Text = "";
		label.Parent = billboard;

		const localPlayer = Players.LocalPlayer;

		this.heartbeatConn = RunService.Heartbeat.Connect(() => {
			const char = localPlayer.Character;
			if (!char) return;

			const hrp = char.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			const canPrimary = can.PrimaryPart;
			if (!hrp || !canPrimary) return;

			const dist = hrp.Position.sub(canPrimary.Position).Magnitude;

			if (dist <= CAN_KICK_RADIUS + 5) {
				billboard.Enabled = true;
				const distDisplay = math.floor(dist * 10) / 10;
				if (dist <= CAN_KICK_RADIUS) {
					label.Text = `KICK! (${distDisplay}m)`;
					label.TextColor3 = Color3.fromRGB(100, 255, 100);
				} else {
					label.Text = `Too far (${distDisplay}m)`;
					label.TextColor3 = Color3.fromRGB(255, 200, 100);
				}
			} else {
				billboard.Enabled = false;
			}
		});
	}

	private cleanupProximity() {
		if (this.heartbeatConn) {
			this.heartbeatConn.Disconnect();
			this.heartbeatConn = undefined;
		}
		if (this.billboard) {
			this.billboard.Destroy();
			this.billboard = undefined;
		}
	}

	private showScreenFlash(color: Color3) {
		const playerGui = Players.LocalPlayer.FindFirstChildOfClass("PlayerGui");
		if (!playerGui) return;

		const screen = new Instance("ScreenGui");
		screen.IgnoreGuiInset = true;
		screen.ResetOnSpawn = false;
		screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling;

		const frame = new Instance("Frame");
		frame.Size = new UDim2(1, 0, 1, 0);
		frame.BackgroundColor3 = color;
		frame.BackgroundTransparency = 1;
		frame.BorderSizePixel = 0;
		frame.Parent = screen;

		screen.Parent = playerGui;

		const tweenIn = TweenService.Create(
			frame,
			new TweenInfo(0.15, Enum.EasingStyle.Linear),
			{ BackgroundTransparency: 0.6 },
		);
		const tweenOut = TweenService.Create(
			frame,
			new TweenInfo(0.15, Enum.EasingStyle.Linear),
			{ BackgroundTransparency: 1 },
		);

		tweenIn.Play();
		tweenIn.Completed.Connect(() => {
			tweenOut.Play();
			tweenOut.Completed.Connect(() => screen.Destroy());
		});
	}
}
