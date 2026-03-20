import { TweenService } from "@rbxts/services";

const ANIM_DURATION = 0.6;
const RISE_STUDS = 8;
const SPIN_DEGREES = 720;
const BONUS_RISE_STUDS = 12;
const BONUS_SPIN_DEGREES = 1080;

const tweenInfo = new TweenInfo(
	ANIM_DURATION,
	Enum.EasingStyle.Quad,
	Enum.EasingDirection.Out,
);

/**
 * Plays a Mario-coin-style spin-up animation on a collected item.
 * The item rises, spins, shrinks, and fades out over 0.6s.
 *
 * Caller must set CanQuery=false BEFORE calling this to prevent double-pickup.
 * Original CFrame and Size are restored after animation completes so the
 * item can be reused next round.
 */
export function animateItemCollect(item: BasePart, isBonus: boolean): void {
	const originalCFrame = item.CFrame;
	const originalSize = item.Size;

	const riseStuds = isBonus ? BONUS_RISE_STUDS : RISE_STUDS;
	const spinDeg = isBonus ? BONUS_SPIN_DEGREES : SPIN_DEGREES;

	const targetCFrame = originalCFrame
		.mul(new CFrame(0, riseStuds, 0))
		.mul(CFrame.Angles(0, math.rad(spinDeg), 0));
	const targetSize = originalSize.mul(0.1);

	const tween = TweenService.Create(item, tweenInfo, {
		CFrame: targetCFrame,
		Size: targetSize,
		Transparency: 1,
	});

	tween.Play();

	tween.Completed.Once(() => {
		item.CFrame = originalCFrame;
		item.Size = originalSize;
		// Transparency stays 1 — janitor or startRound resets it
	});
}
