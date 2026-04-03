/**
 * Ice Ring visual effects for the SkySlide corridor.
 * Applies color cycling and glow pulse tweens to Ice Ring model parts.
 */
import { TweenService, Workspace } from "@rbxts/services";

const ICE_COLORS = [
	Color3.fromRGB(180, 220, 255), // Ice blue
	Color3.fromRGB(255, 255, 255), // White
	Color3.fromRGB(100, 180, 255), // Deep ice
	Color3.fromRGB(200, 240, 255), // Frost
	Color3.fromRGB(150, 200, 255), // Pale blue
];

const COLOR_TWEEN_INFO = new TweenInfo(
	3,
	Enum.EasingStyle.Sine,
	Enum.EasingDirection.InOut,
);
const GLOW_TWEEN_INFO = new TweenInfo(
	1.5,
	Enum.EasingStyle.Sine,
	Enum.EasingDirection.InOut,
);

function colorCycle(part: BasePart) {
	let idx = math.random(0, ICE_COLORS.size() - 1);
	for (;;) {
		idx = (idx + 1) % ICE_COLORS.size();
		const tween = TweenService.Create(part, COLOR_TWEEN_INFO, {
			Color: ICE_COLORS[idx],
		});
		tween.Play();
		tween.Completed.Wait();
	}
}

function glowPulse(part: BasePart) {
	const base = part.Transparency;
	const bright = math.max(base - 0.2, 0.05);
	for (;;) {
		const glowIn = TweenService.Create(part, GLOW_TWEEN_INFO, {
			Transparency: bright,
		});
		glowIn.Play();
		glowIn.Completed.Wait();
		const glowOut = TweenService.Create(part, GLOW_TWEEN_INFO, {
			Transparency: base,
		});
		glowOut.Play();
		glowOut.Completed.Wait();
	}
}

// Locate the Ice Rings folder
const skySlideHub = Workspace.FindFirstChild("SkySlideHub", true);
const corridor = skySlideHub?.FindFirstChild("Corridor_main");
const ringsFolder = corridor?.FindFirstChild("Ice Rings");

if (!ringsFolder) {
	warn("[IceRingEffects] Ice Rings folder not found");
} else {
	let ringCount = 0;
	for (const ringModel of ringsFolder.GetChildren()) {
		if (!ringModel.IsA("Model")) continue;
		ringCount++;

		for (const part of ringModel.GetDescendants()) {
			if (!part.IsA("BasePart")) continue;

			// Color cycle on all parts (staggered start)
			task.spawn(() => {
				task.wait(math.random() * 3);
				colorCycle(part);
			});

			// Glow pulse on ~1/3 of parts for subtlety
			if (math.random(1, 3) === 1) {
				task.spawn(() => {
					task.wait(math.random() * 2);
					glowPulse(part);
				});
			}
		}
	}
	print(`[IceRingEffects] Activated on ${ringCount} rings`);
}
