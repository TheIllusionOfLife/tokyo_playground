/**
 * HachiRide evolution: threshold checks, visual effects, ability hints.
 */
import { TweenService } from "@rbxts/services";
import { HACHI_BIG_SCALE, HACHI_EVOLUTION_THRESHOLDS } from "shared/constants";
import { GlobalEvents } from "shared/network";
import { HachiRidePlayerState } from "shared/types";
import { updateHachiWalkSpeed } from "../../../utils/hachiCostume";

type ServerEvents = ReturnType<typeof GlobalEvents.createServer>;

/** Check if a player should evolve based on current item count. */
export function tryEvolve(
	state: HachiRidePlayerState,
	player: Player,
	hachiModel: Model | undefined,
	serverEvents: ServerEvents,
) {
	let newLevel = state.evolutionLevel;
	for (let level = HACHI_EVOLUTION_THRESHOLDS.size() - 1; level >= 0; level--) {
		if (state.itemCount >= HACHI_EVOLUTION_THRESHOLDS[level]) {
			newLevel = level;
			break;
		}
	}

	if (newLevel <= state.evolutionLevel) return;
	state.evolutionLevel = newLevel;

	updateHachiWalkSpeed(player, newLevel);
	serverEvents.hachiEvolved.fire(player, newLevel);

	// Level 1: grant double jump
	if (newLevel === 1) {
		serverEvents.hachiDoubleJumpGranted.fire(player);
	}

	// Level 3: grow Hachi bigger
	if (newLevel === 3 && hachiModel) {
		for (const part of hachiModel.GetDescendants()) {
			if (part.IsA("BasePart") && !part.IsA("UnionOperation")) {
				TweenService.Create(part, new TweenInfo(0.5, Enum.EasingStyle.Quad), {
					Size: part.Size.mul(HACHI_BIG_SCALE),
				}).Play();
			}
		}
	}

	// Level 4: fluffy pink-white color + particle effect
	if (newLevel === 4 && hachiModel) {
		const fluffyColor = Color3.fromRGB(255, 182, 193);
		for (const part of hachiModel.GetDescendants()) {
			if (part.IsA("BasePart")) {
				TweenService.Create(part, new TweenInfo(1, Enum.EasingStyle.Quad), {
					Color: fluffyColor,
				}).Play();
			}
		}
		const primary =
			hachiModel.PrimaryPart ?? hachiModel.FindFirstChildWhichIsA("BasePart");
		if (primary && !primary.FindFirstChild("FluffyEffect")) {
			addFluffyEffect(primary);
		}
	}

	// Show ability description
	const abilityHint = getAbilityHint(newLevel);
	serverEvents.hintTextChanged.fire(player, abilityHint.key, abilityHint.args);

	print(
		`[HachiRide] ${player.Name} evolved to level ${newLevel} (${state.itemCount} items)`,
	);
}

/** Add sparkle + aura particles for level 4 fluffy evolution. */
export function addFluffyEffect(part: BasePart) {
	// Sparkle particles
	const sparkle = new Instance("ParticleEmitter");
	sparkle.Name = "FluffyEffect";
	sparkle.Rate = 15;
	sparkle.Lifetime = new NumberRange(0.6, 1.2);
	sparkle.Speed = new NumberRange(1, 3);
	sparkle.SpreadAngle = new Vector2(180, 180);
	sparkle.LightEmission = 0.8;
	sparkle.LightInfluence = 0.2;
	sparkle.Brightness = 1.5;
	sparkle.Size = new NumberSequence([
		new NumberSequenceKeypoint(0, 0),
		new NumberSequenceKeypoint(0.3, 1.2),
		new NumberSequenceKeypoint(1, 0),
	]);
	sparkle.Transparency = new NumberSequence([
		new NumberSequenceKeypoint(0, 0.3),
		new NumberSequenceKeypoint(0.5, 0.5),
		new NumberSequenceKeypoint(1, 1),
	]);
	sparkle.Color = new ColorSequence([
		new ColorSequenceKeypoint(0, Color3.fromRGB(255, 220, 240)),
		new ColorSequenceKeypoint(0.5, Color3.fromRGB(255, 182, 230)),
		new ColorSequenceKeypoint(1, Color3.fromRGB(255, 255, 255)),
	]);
	sparkle.RotSpeed = new NumberRange(-90, 90);
	sparkle.Rotation = new NumberRange(0, 360);
	sparkle.Parent = part;

	// Rising aura
	const aura = new Instance("ParticleEmitter");
	aura.Name = "FluffyAura";
	aura.Rate = 20;
	aura.Lifetime = new NumberRange(1.0, 2.0);
	aura.Speed = new NumberRange(0.5, 1.5);
	aura.SpreadAngle = new Vector2(30, 30);
	aura.EmissionDirection = Enum.NormalId.Top;
	aura.LightEmission = 1;
	aura.LightInfluence = 0;
	aura.Brightness = 2;
	aura.Size = new NumberSequence([
		new NumberSequenceKeypoint(0, 0.5),
		new NumberSequenceKeypoint(0.4, 2.5),
		new NumberSequenceKeypoint(1, 0),
	]);
	aura.Transparency = new NumberSequence([
		new NumberSequenceKeypoint(0, 0.6),
		new NumberSequenceKeypoint(0.3, 0.4),
		new NumberSequenceKeypoint(1, 1),
	]);
	aura.Color = new ColorSequence([
		new ColorSequenceKeypoint(0, Color3.fromRGB(255, 180, 220)),
		new ColorSequenceKeypoint(1, Color3.fromRGB(255, 240, 255)),
	]);
	aura.RotSpeed = new NumberRange(-30, 30);
	aura.Rotation = new NumberRange(0, 360);
	aura.Drag = 2;
	aura.Parent = part;

	// Soft pink glow light
	const glow = new Instance("PointLight");
	glow.Name = "FluffyGlow";
	glow.Color = Color3.fromRGB(255, 200, 230);
	glow.Brightness = 1.5;
	glow.Range = 12;
	glow.Parent = part;
}

/** Get the localization key for an ability hint at a given level. */
export function getAbilityHint(level: number): {
	key: string;
	args?: string[];
} {
	switch (level) {
		case 1:
			return { key: "hint_ability_1" };
		case 2:
			return { key: "hint_ability_2" };
		case 3:
			return { key: "hint_ability_3" };
		case 4:
			return { key: "hint_ability_4" };
		default:
			return { key: "hint_hachi_evolved", args: [`${level}`] };
	}
}
