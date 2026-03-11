import { Controller, OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";
import { GlobalEvents } from "shared/network";
import { GameState } from "shared/types";

@Controller()
export class HudController implements OnStart {
	private readonly events = GlobalEvents.createClient({});
	private stateLabel?: TextLabel;

	onStart() {
		print("[HudController] Client initialized");
		this.createHud();
		this.listenForEvents();
		this.events.playerReady.fire();
	}

	private createHud() {
		const player = Players.LocalPlayer;
		const playerGui = player.WaitForChild("PlayerGui") as PlayerGui;

		const existing = playerGui.FindFirstChild("GameHud");
		if (existing) {
			existing.Destroy();
		}

		const screenGui = new Instance("ScreenGui");
		screenGui.Name = "GameHud";
		screenGui.ResetOnSpawn = false;
		screenGui.Parent = playerGui;

		const label = new Instance("TextLabel");
		label.Name = "StateLabel";
		label.Size = new UDim2(0.3, 0, 0.06, 0);
		label.Position = new UDim2(0.35, 0, 0.02, 0);
		label.BackgroundColor3 = Color3.fromRGB(0, 0, 0);
		label.BackgroundTransparency = 0.5;
		label.TextColor3 = Color3.fromRGB(255, 255, 255);
		label.TextScaled = true;
		label.Font = Enum.Font.GothamBold;
		label.Text = "Lobby";
		label.Parent = screenGui;

		const corner = new Instance("UICorner");
		corner.CornerRadius = new UDim(0, 8);
		corner.Parent = label;

		this.stateLabel = label;
	}

	private listenForEvents() {
		this.events.gameStateChanged.connect((state: GameState) => {
			print(`[HudController] State changed → ${state}`);
			if (this.stateLabel) {
				this.stateLabel.Text = state;
			}
		});

		this.events.scoreUpdated.connect((coins: number) => {
			print(`[HudController] Score updated: ${coins} coins`);
		});
	}
}
