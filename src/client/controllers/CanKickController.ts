import { Controller, OnStart } from "@flamework/core";
import { Players, RunService, TweenService, Workspace } from "@rbxts/services";
import { clientEvents } from "client/network";
import {
	CAN_KICK_RADIUS,
	CAN_KICK_RISE,
	CAN_KICK_SPIN,
	CAN_KICK_TWEEN_DURATION,
} from "shared/constants";
import { MinigameId, PlayerRole } from "shared/types";

@Controller()
export class CanKickController implements OnStart {
	private billboard?: BillboardGui;
	private heartbeatConn?: RBXScriptConnection;
	private oniRevealHighlight?: Highlight;
	// Incremented on every role assignment — lets spawned async work self-cancel
	// if a second roleAssigned fires before WaitForChild resolves.
	private assignVersion = 0;

	onStart() {
		print("[CanKickController] Started");

		clientEvents.roleAssigned.connect((role, minigameId) => {
			const version = ++this.assignVersion;
			if (minigameId !== MinigameId.CanKick) {
				this.cleanupProximity();
				return;
			}
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

		clientEvents.canKickVisual.connect((canPosition) => {
			this.playKickAnimation(canPosition);
		});

		clientEvents.catchHighlight.connect((caughtUserId) => {
			this.showCatchHighlight(caughtUserId);
		});

		clientEvents.roundResultAnnounced.connect(() => {
			this.cleanupProximity();
		});

		clientEvents.oniReveal.connect((oniUserId, durationSeconds) => {
			this.showOniReveal(oniUserId, durationSeconds);
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
		if (this.oniRevealHighlight) {
			this.oniRevealHighlight.Destroy();
			this.oniRevealHighlight = undefined;
		}
	}

	private showOniReveal(oniUserId: number, durationSeconds: number) {
		const oni = Players.GetPlayerByUserId(oniUserId);
		const character = oni?.Character;
		if (!character) return;

		if (this.oniRevealHighlight) {
			this.oniRevealHighlight.Destroy();
		}

		const highlight = new Instance("Highlight");
		highlight.FillColor = Color3.fromRGB(255, 80, 80);
		highlight.OutlineColor = Color3.fromRGB(255, 240, 240);
		highlight.DepthMode = Enum.HighlightDepthMode.AlwaysOnTop;
		highlight.Adornee = character;
		highlight.Parent = character;
		this.oniRevealHighlight = highlight;

		task.delay(durationSeconds, () => {
			if (this.oniRevealHighlight === highlight) {
				highlight.Destroy();
				this.oniRevealHighlight = undefined;
			}
		});
	}

	private playKickAnimation(canPosition: Vector3) {
		// Create a cosmetic copy at the can's position to animate
		const visual = new Instance("Part");
		visual.Shape = Enum.PartType.Cylinder;
		visual.Size = new Vector3(4, 6, 6);
		visual.Color = Color3.fromRGB(200, 200, 200);
		visual.Material = Enum.Material.Metal;
		visual.Anchored = true;
		visual.CanCollide = false;
		visual.CanTouch = false;
		visual.CanQuery = false;
		visual.CFrame = new CFrame(canPosition);
		visual.Parent = Workspace;

		// Particle burst
		const emitter = new Instance("ParticleEmitter");
		emitter.Rate = 0;
		emitter.Speed = new NumberRange(10, 20);
		emitter.Lifetime = new NumberRange(0.5, 1);
		emitter.SpreadAngle = new Vector2(180, 180);
		emitter.Color = new ColorSequence(Color3.fromRGB(255, 220, 80));
		emitter.Size = new NumberSequence(1, 0);
		emitter.Parent = visual;
		emitter.Emit(20);

		// Rise + spin via Heartbeat (CFrame tween can't do multiple rotations)
		const startTime = os.clock();
		const totalSpinRad = math.rad(CAN_KICK_SPIN);
		const riseConn = RunService.Heartbeat.Connect(() => {
			const elapsed = os.clock() - startTime;
			if (elapsed >= CAN_KICK_TWEEN_DURATION) {
				riseConn.Disconnect();
				// Fall back with bounce
				const tweenDown = TweenService.Create(
					visual,
					new TweenInfo(0.5, Enum.EasingStyle.Bounce, Enum.EasingDirection.Out),
					{ CFrame: new CFrame(canPosition) },
				);
				tweenDown.Play();
				tweenDown.Completed.Connect(() => visual.Destroy());
				return;
			}
			const t = elapsed / CAN_KICK_TWEEN_DURATION;
			// Quad ease-out for rise
			const eased = 1 - (1 - t) * (1 - t);
			const yOffset = CAN_KICK_RISE * eased;
			const angle = totalSpinRad * t;
			visual.CFrame = new CFrame(
				canPosition.add(new Vector3(0, yOffset, 0)),
			).mul(CFrame.Angles(0, angle, 0));
		});
	}

	private showCatchHighlight(caughtUserId: number) {
		const caughtPlayer = Players.GetPlayerByUserId(caughtUserId);
		const character = caughtPlayer?.Character;
		if (!character) return;

		const highlight = new Instance("Highlight");
		highlight.FillColor = Color3.fromRGB(255, 80, 80);
		highlight.FillTransparency = 0.5;
		highlight.OutlineColor = Color3.fromRGB(255, 50, 50);
		highlight.DepthMode = Enum.HighlightDepthMode.AlwaysOnTop;
		highlight.Adornee = character;
		highlight.Parent = character;

		task.delay(1.5, () => highlight.Destroy());
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
