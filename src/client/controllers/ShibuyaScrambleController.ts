import { Controller, OnStart } from "@flamework/core";
import { Players, TweenService } from "@rbxts/services";
import { clientEvents } from "client/network";

@Controller()
export class ShibuyaScrambleController implements OnStart {
	onStart() {
		print("[ShibuyaScrambleController] Started");

		clientEvents.crowdWaveStarted.connect((_pathCount) => {
			this.showCrowdWarning();
		});
	}

	private showCrowdWarning() {
		const playerGui = Players.LocalPlayer.FindFirstChildOfClass("PlayerGui");
		if (!playerGui) return;

		const screen = new Instance("ScreenGui");
		screen.IgnoreGuiInset = true;
		screen.ResetOnSpawn = false;
		screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling;

		const frame = new Instance("Frame");
		frame.Size = new UDim2(1, 0, 1, 0);
		frame.BackgroundColor3 = Color3.fromRGB(255, 140, 0);
		frame.BackgroundTransparency = 1;
		frame.BorderSizePixel = 0;
		frame.Parent = screen;

		const label = new Instance("TextLabel");
		label.Size = new UDim2(1, 0, 0.2, 0);
		label.Position = new UDim2(0, 0, 0.4, 0);
		label.BackgroundTransparency = 1;
		label.TextColor3 = Color3.fromRGB(255, 255, 255);
		label.Font = Enum.Font.GothamBold;
		label.TextScaled = true;
		label.Text = "CROWD CROSSING!";
		label.TextTransparency = 1;
		label.Parent = frame;

		screen.Parent = playerGui;

		const tweenIn = TweenService.Create(
			frame,
			new TweenInfo(0.2, Enum.EasingStyle.Linear),
			{ BackgroundTransparency: 0.6 },
		);
		const labelIn = TweenService.Create(
			label,
			new TweenInfo(0.2, Enum.EasingStyle.Linear),
			{ TextTransparency: 0 },
		);
		const tweenOut = TweenService.Create(
			frame,
			new TweenInfo(1.3, Enum.EasingStyle.Linear),
			{ BackgroundTransparency: 1 },
		);
		const labelOut = TweenService.Create(
			label,
			new TweenInfo(1.3, Enum.EasingStyle.Linear),
			{ TextTransparency: 1 },
		);

		tweenIn.Play();
		labelIn.Play();
		tweenIn.Completed.Connect(() => {
			tweenOut.Play();
			labelOut.Play();
			tweenOut.Completed.Connect(() => screen.Destroy());
		});
	}
}
