/**
 * Custom loading screen for Shibuya Open World.
 *
 * CRITICAL: This file runs in ReplicatedFirst, BEFORE Flamework ignites.
 * It must use only raw Roblox services. No Flamework imports allowed.
 *
 * Signals loading completion via a BoolValue in ReplicatedStorage so
 * Flamework controllers (e.g. BGMController) can safely wait for it
 * without race conditions.
 */

const Players = game.GetService("Players");
const ReplicatedFirst = game.GetService("ReplicatedFirst");
const ReplicatedStorage = game.GetService("ReplicatedStorage");
const ContentProvider = game.GetService("ContentProvider");
const TweenService = game.GetService("TweenService");
const RunService = game.GetService("RunService");

const player = Players.LocalPlayer;
const playerGui = player.WaitForChild("PlayerGui") as PlayerGui;

print("[LoadingScreen] Script started");

// Asset IDs
const HACHI_SPRITESHEET_ID = "rbxassetid://111475345325479";
const GAME_LOGO_ID = "rbxassetid://73591348450824";

// Spritesheet config: 8 frames in a 4x2 grid, each 128x128
const SPRITE_COLS = 4;
const SPRITE_FRAME_SIZE = 128;
const SPRITE_TOTAL_FRAMES = 8;
const SPRITE_FRAME_INTERVAL = 0.1; // seconds per frame

const MIN_DISPLAY_SECONDS = 3;
const MAX_DISPLAY_SECONDS = 15;

// ── Create loading completion signal ───────────────────────────────
const loadingDone = new Instance("BoolValue");
loadingDone.Name = "LoadingDone";
loadingDone.Value = false;
loadingDone.Parent = ReplicatedStorage;

// ── Build Loading Screen UI ─────────────────────────────────────────
const screenGui = new Instance("ScreenGui");
screenGui.Name = "LoadingScreen";
screenGui.ResetOnSpawn = false;
screenGui.DisplayOrder = 100;
screenGui.IgnoreGuiInset = true;
screenGui.Parent = playerGui;

// Remove default AFTER custom GUI is parented (prevents visible flash)
ReplicatedFirst.RemoveDefaultLoadingScreen();

// Detect locale early (needed for subtitle + tips)
const locale = player.LocaleId;
const isJa = locale.sub(1, 2) === "ja";

// Dark background (explicitly opaque to cover 3D world during load)
const bg = new Instance("Frame");
bg.Name = "Background";
bg.Size = new UDim2(1, 0, 1, 0);
bg.BackgroundColor3 = Color3.fromRGB(10, 12, 24);
bg.BackgroundTransparency = 0;
bg.BorderSizePixel = 0;
bg.ZIndex = 10;
bg.Parent = screenGui;

// Game logo (replaces plain text title if asset is uploaded)
const logoImage = new Instance("ImageLabel");
logoImage.Name = "Logo";
logoImage.Size = new UDim2(0.4, 0, 0.08, 0);
logoImage.Position = new UDim2(0.3, 0, 0.18, 0);
logoImage.BackgroundTransparency = 1;
logoImage.Image = GAME_LOGO_ID;
logoImage.ScaleType = Enum.ScaleType.Fit;
logoImage.Parent = bg;

// Fallback text title (visible when logo asset is not yet uploaded)
const title = new Instance("TextLabel");
title.Name = "Title";
title.Size = new UDim2(0.6, 0, 0.1, 0);
title.Position = new UDim2(0.2, 0, 0.18, 0);
title.BackgroundTransparency = 1;
title.TextColor3 = Color3.fromRGB(255, 220, 100);
title.TextScaled = true;
title.Font = Enum.Font.FredokaOne;
title.Text = "Shibuya Open World";
title.TextTransparency = 1; // Hidden: logo image is used instead
title.Parent = bg;

// Subtitle tagline
const subtitle = new Instance("TextLabel");
subtitle.Name = "Subtitle";
subtitle.Size = new UDim2(0.4, 0, 0.04, 0);
subtitle.Position = new UDim2(0.3, 0, 0.29, 0);
subtitle.BackgroundTransparency = 1;
subtitle.TextColor3 = Color3.fromRGB(200, 200, 220);
subtitle.TextScaled = true;
subtitle.Font = Enum.Font.Gotham;
subtitle.Text = isJa
	? "オープンワールドパーティーゲーム"
	: "Open World Party Games";
subtitle.Parent = bg;

// Hachi spritesheet animation
const hachiImage = new Instance("ImageLabel");
hachiImage.Name = "HachiAnimation";
hachiImage.Size = new UDim2(0, 80, 0, 80);
hachiImage.Position = new UDim2(0.5, 0, 0.48, 0);
hachiImage.AnchorPoint = new Vector2(0.5, 0.5);
hachiImage.BackgroundTransparency = 1;
hachiImage.Image = HACHI_SPRITESHEET_ID;
hachiImage.ImageRectSize = new Vector2(SPRITE_FRAME_SIZE, SPRITE_FRAME_SIZE);
hachiImage.ImageRectOffset = new Vector2(0, 0);
hachiImage.ScaleType = Enum.ScaleType.Fit;
hachiImage.Parent = bg;

// Progress bar background
const barBg = new Instance("Frame");
barBg.Name = "BarBg";
barBg.Size = new UDim2(0.4, 0, 0.015, 0);
barBg.Position = new UDim2(0.3, 0, 0.6, 0);
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

// Pulsing dots (3 dots below progress bar)
const dots: Frame[] = [];
for (let i = 0; i < 3; i++) {
	const dot = new Instance("Frame");
	dot.Name = `Dot${i}`;
	dot.Size = new UDim2(0, 8, 0, 8);
	dot.Position = new UDim2(0.5, (i - 1) * 20, 1, 8);
	dot.AnchorPoint = new Vector2(0.5, 0);
	dot.BackgroundColor3 = Color3.fromRGB(255, 200, 50);
	dot.BorderSizePixel = 0;
	dot.Parent = barBg;
	const dotCorner = new Instance("UICorner");
	dotCorner.CornerRadius = new UDim(1, 0);
	dotCorner.Parent = dot;
	dots.push(dot);
}

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
const tips = isJa ? TIPS_JA : TIPS_EN;

const tipLabel = new Instance("TextLabel");
tipLabel.Name = "Tip";
tipLabel.Size = new UDim2(0.6, 0, 0.04, 0);
tipLabel.Position = new UDim2(0.2, 0, 0.66, 0);
tipLabel.BackgroundTransparency = 1;
tipLabel.TextColor3 = Color3.fromRGB(160, 160, 180);
tipLabel.TextScaled = true;
tipLabel.Font = Enum.Font.GothamMedium;
tipLabel.Text = tips[math.random(0, tips.size() - 1)];
tipLabel.Parent = bg;

// ── Animations (run during loading) ────────────────────────────────

// Spritesheet frame animation
let spriteFrame = 0;
let spriteTimer = 0;
const spriteConn = RunService.Heartbeat.Connect((dt) => {
	spriteTimer += dt;
	if (spriteTimer >= SPRITE_FRAME_INTERVAL) {
		spriteTimer -= SPRITE_FRAME_INTERVAL;
		spriteFrame = (spriteFrame + 1) % SPRITE_TOTAL_FRAMES;
		const col = spriteFrame % SPRITE_COLS;
		const row = math.floor(spriteFrame / SPRITE_COLS);
		hachiImage.ImageRectOffset = new Vector2(
			col * SPRITE_FRAME_SIZE,
			row * SPRITE_FRAME_SIZE,
		);
	}
});

// Pulsing dots animation
let dotTimer = 0;
const dotConn = RunService.Heartbeat.Connect((dt) => {
	dotTimer += dt;
	for (let i = 0; i < dots.size(); i++) {
		const phase = dotTimer * 3 + i * 1.2;
		const scale = 0.6 + 0.4 * math.abs(math.sin(phase));
		dots[i].Size = new UDim2(0, 8 * scale, 0, 8 * scale);
		dots[i].BackgroundTransparency = 1 - scale;
	}
});

// Tip rotation (every 3 seconds with fade)
let tipIndex = math.random(0, tips.size() - 1);
const tipRotateConn = task.spawn(() => {
	while (screenGui.Parent) {
		task.wait(3);
		// Fade out
		TweenService.Create(tipLabel, new TweenInfo(0.3), {
			TextTransparency: 1,
		}).Play();
		task.wait(0.3);
		// Change tip
		tipIndex = (tipIndex + 1) % tips.size();
		tipLabel.Text = tips[tipIndex];
		// Fade in
		TweenService.Create(tipLabel, new TweenInfo(0.3), {
			TextTransparency: 0,
		}).Play();
	}
});

// ── Loading Flow ────────────────────────────────────────────────────
print(
	`[LoadingScreen] UI built. ScreenGui parent: ${screenGui.Parent?.Name}, DisplayOrder: ${screenGui.DisplayOrder}, bg transparency: ${bg.BackgroundTransparency}`,
);

const startTime = os.clock();

function setProgress(ratio: number) {
	barFill.Size = new UDim2(math.clamp(ratio, 0, 1), 0, 1, 0);
}

// P0: Wait for DataModel to finish replicating
setProgress(0.1);
if (!game.IsLoaded()) {
	game.Loaded.Wait();
}
setProgress(0.2);

// P1: Request streaming around spawn location
const spawnLocation = game
	.GetService("Workspace")
	.FindFirstChildOfClass("SpawnLocation");
const spawnPos = spawnLocation ? spawnLocation.Position : new Vector3(0, 0, 0);

// RequestStreamAroundAsync hints the engine to prioritize spawn-area geometry
let streamingDone = false;
task.spawn(() => {
	const [ok, err] = pcall(() => player.RequestStreamAroundAsync(spawnPos));
	if (!ok) {
		warn(`[LoadingScreen] RequestStreamAroundAsync failed: ${err}`);
	}
	streamingDone = true;
});
setProgress(0.3);

// P2: Preload spawn area assets (MeshParts within 256 studs)
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

// Preload with progress tracking + timeout
let preloadDone = false;
let preloaded = 0;
const totalAssets = math.max(assetsToPreload.size(), 1);

task.spawn(() => {
	if (assetsToPreload.size() > 0) {
		const [ok, err] = pcall(() => {
			ContentProvider.PreloadAsync(assetsToPreload, () => {
				preloaded++;
				setProgress(0.3 + 0.6 * (preloaded / totalAssets));
			});
		});
		if (!ok) {
			warn(`[LoadingScreen] PreloadAsync failed: ${err}`);
		}
	}
	preloadDone = true;
});

// Wait for preload OR timeout (whichever comes first)
while (!preloadDone || !streamingDone) {
	if (os.clock() - startTime >= MAX_DISPLAY_SECONDS) {
		break; // Timeout: don't keep slow clients stuck forever
	}
	task.wait(0.1);
}

setProgress(1.0);
print(`[LoadingScreen] Preload done. Elapsed: ${os.clock() - startTime}s`);

// Ensure minimum display time (so loading screen is actually visible)
const elapsed = os.clock() - startTime;
if (elapsed < MIN_DISPLAY_SECONDS) {
	task.wait(MIN_DISPLAY_SECONDS - elapsed);
}

// ── Signal completion + Fade Out ────────────────────────────────────

// Stop animations
spriteConn.Disconnect();
dotConn.Disconnect();
task.cancel(tipRotateConn);

// Fade out all elements
const fadeDuration = 0.6;
const fadeInfo = new TweenInfo(
	fadeDuration,
	Enum.EasingStyle.Quad,
	Enum.EasingDirection.Out,
);

const bgFade = TweenService.Create(bg, fadeInfo, {
	BackgroundTransparency: 1,
});
bgFade.Play();

for (const child of bg.GetChildren()) {
	if (child.IsA("TextLabel")) {
		TweenService.Create(child, fadeInfo, { TextTransparency: 1 }).Play();
	}
	if (child.IsA("ImageLabel")) {
		TweenService.Create(child, fadeInfo, { ImageTransparency: 1 }).Play();
	}
	if (child.IsA("Frame")) {
		TweenService.Create(child, fadeInfo, {
			BackgroundTransparency: 1,
		}).Play();
		for (const grandchild of child.GetChildren()) {
			if (grandchild.IsA("Frame")) {
				TweenService.Create(grandchild, fadeInfo, {
					BackgroundTransparency: 1,
				}).Play();
			}
		}
	}
}

// Wait for the background fade tween to fully complete (avoids scheduling jitter)
bgFade.Completed.Wait();

// Signal loading complete AFTER fade-out finishes (so BGM doesn't play under visible screen)
loadingDone.Value = true;
print(`[LoadingScreen] Complete. Total: ${os.clock() - startTime}s`);

screenGui.Destroy();
