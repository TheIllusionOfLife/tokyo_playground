/**
 * Custom loading screen for Tokyo Playground.
 *
 * CRITICAL: This file runs in ReplicatedFirst, BEFORE Flamework ignites.
 * It must use only raw Roblox services. No Flamework imports allowed.
 */

const Players = game.GetService("Players");
const ReplicatedFirst = game.GetService("ReplicatedFirst");
const ContentProvider = game.GetService("ContentProvider");
const TweenService = game.GetService("TweenService");

const player = Players.LocalPlayer;
const playerGui = player.WaitForChild("PlayerGui") as PlayerGui;

// ── Build Loading Screen UI ─────────────────────────────────────────
const screenGui = new Instance("ScreenGui");
screenGui.Name = "LoadingScreen";
screenGui.ResetOnSpawn = false;
screenGui.DisplayOrder = 100;
screenGui.IgnoreGuiInset = true;
screenGui.Parent = playerGui;

// Remove default AFTER custom GUI is parented (prevents visible flash)
ReplicatedFirst.RemoveDefaultLoadingScreen();

// Dark background
const bg = new Instance("Frame");
bg.Name = "Background";
bg.Size = new UDim2(1, 0, 1, 0);
bg.BackgroundColor3 = Color3.fromRGB(10, 12, 24);
bg.BorderSizePixel = 0;
bg.Parent = screenGui;

// Title
const title = new Instance("TextLabel");
title.Name = "Title";
title.Size = new UDim2(0.6, 0, 0.1, 0);
title.Position = new UDim2(0.2, 0, 0.3, 0);
title.BackgroundTransparency = 1;
title.TextColor3 = Color3.fromRGB(255, 220, 100);
title.TextScaled = true;
title.Font = Enum.Font.FredokaOne;
title.Text = "Tokyo Playground";
title.Parent = bg;

// Subtitle
const subtitle = new Instance("TextLabel");
subtitle.Name = "Subtitle";
subtitle.Size = new UDim2(0.4, 0, 0.05, 0);
subtitle.Position = new UDim2(0.3, 0, 0.41, 0);
subtitle.BackgroundTransparency = 1;
subtitle.TextColor3 = Color3.fromRGB(200, 200, 220);
subtitle.TextScaled = true;
subtitle.Font = Enum.Font.Gotham;
subtitle.Text = "Shibuya";
subtitle.Parent = bg;

// Progress bar background
const barBg = new Instance("Frame");
barBg.Name = "BarBg";
barBg.Size = new UDim2(0.4, 0, 0.02, 0);
barBg.Position = new UDim2(0.3, 0, 0.55, 0);
barBg.BackgroundColor3 = Color3.fromRGB(40, 40, 60);
barBg.BorderSizePixel = 0;
barBg.Parent = bg;
const barBgCorner = new Instance("UICorner");
barBgCorner.CornerRadius = new UDim(0, 4);
barBgCorner.Parent = barBg;

// Progress bar fill
const barFill = new Instance("Frame");
barFill.Name = "Fill";
barFill.Size = new UDim2(0, 0, 1, 0);
barFill.BackgroundColor3 = Color3.fromRGB(255, 200, 50);
barFill.BorderSizePixel = 0;
barFill.Parent = barBg;
const barFillCorner = new Instance("UICorner");
barFillCorner.CornerRadius = new UDim(0, 4);
barFillCorner.Parent = barFill;

// Tip text
const TIPS_EN = [
	"Explore real Shibuya streets!",
	"Ride Hachi and collect items to evolve!",
	"Kick the can to free your friends!",
	"Hide anywhere in the city!",
	"Complete daily missions for bonus points!",
	"Discover Points of Interest across Shibuya!",
];
const TIPS_JA = [
	"本物の渋谷の街を探検しよう!",
	"ハチに乗ってアイテムを集めて進化!",
	"缶を蹴って仲間を助けよう!",
	"街中どこでも隠れられる!",
	"デイリーミッションでボーナスポイント!",
	"渋谷の名所を発見しよう!",
];
const locale = player.LocaleId;
const tips = locale.sub(1, 2) === "ja" ? TIPS_JA : TIPS_EN;

const tipLabel = new Instance("TextLabel");
tipLabel.Name = "Tip";
tipLabel.Size = new UDim2(0.6, 0, 0.04, 0);
tipLabel.Position = new UDim2(0.2, 0, 0.6, 0);
tipLabel.BackgroundTransparency = 1;
tipLabel.TextColor3 = Color3.fromRGB(160, 160, 180);
tipLabel.TextScaled = true;
tipLabel.Font = Enum.Font.GothamMedium;
tipLabel.Text = tips[math.random(0, tips.size() - 1)];
tipLabel.Parent = bg;

// ── Loading Flow ────────────────────────────────────────────────────

function setProgress(ratio: number) {
	barFill.Size = new UDim2(math.clamp(ratio, 0, 1), 0, 1, 0);
}

// P0: Wait for DataModel to finish replicating
setProgress(0.1);
if (!game.IsLoaded()) {
	game.Loaded.Wait();
}
setProgress(0.3);

// P1: Preload spawn area assets (character model, nearby textures)
// Gather MeshParts near spawn within ~256 studs for preloading
const spawnLocation = game
	.GetService("Workspace")
	.FindFirstChildOfClass("SpawnLocation");
const spawnPos = spawnLocation ? spawnLocation.Position : new Vector3(0, 0, 0);

const assetsToPreload: Instance[] = [];
const cityModel = game.GetService("Workspace").FindFirstChild("city_and_roads");
if (cityModel) {
	for (const desc of cityModel.GetDescendants()) {
		if (desc.IsA("MeshPart")) {
			const dist = desc.Position.sub(spawnPos).Magnitude;
			if (dist <= 256) {
				assetsToPreload.push(desc);
			}
		}
	}
}

// Preload with progress tracking
let preloaded = 0;
const totalAssets = math.max(assetsToPreload.size(), 1);

if (assetsToPreload.size() > 0) {
	ContentProvider.PreloadAsync(assetsToPreload, () => {
		preloaded++;
		setProgress(0.3 + 0.6 * (preloaded / totalAssets));
	});
}

setProgress(1.0);

// Rotate tip while waiting a minimum display time
task.wait(0.5);

// ── Fade Out ────────────────────────────────────────────────────────
const fadeOut = TweenService.Create(
	bg,
	new TweenInfo(0.6, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
	{ BackgroundTransparency: 1 },
);

// Fade all text elements too
for (const child of bg.GetChildren()) {
	if (child.IsA("TextLabel")) {
		TweenService.Create(
			child,
			new TweenInfo(0.6, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
			{ TextTransparency: 1 },
		).Play();
	}
	if (child.IsA("Frame")) {
		TweenService.Create(
			child,
			new TweenInfo(0.6, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
			{ BackgroundTransparency: 1 },
		).Play();
		for (const grandchild of child.GetChildren()) {
			if (grandchild.IsA("Frame")) {
				TweenService.Create(
					grandchild,
					new TweenInfo(0.6, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
					{ BackgroundTransparency: 1 },
				).Play();
			}
		}
	}
}

fadeOut.Play();
fadeOut.Completed.Wait();
screenGui.Destroy();
