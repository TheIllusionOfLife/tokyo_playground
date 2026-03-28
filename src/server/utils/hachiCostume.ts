import { Players } from "@rbxts/services";
import {
	DEFAULT_JUMP_HEIGHT,
	DEFAULT_WALK_SPEED,
	HACHI_DEFAULT_SCALE,
	HACHI_JUMP_VELOCITY,
	HACHI_WALK_SPEEDS,
} from "shared/constants";
import { GlobalEvents } from "shared/network";

const serverEvents = GlobalEvents.createServer({});

/** Name of the Hachi costume model when parented to character. */
export const HACHI_COSTUME_NAME = "HachiCostume";

/** R15 sitting animation — overrides locomotion while riding. */
const SIT_ANIMATION_ID = "rbxassetid://2506281703";

/** Server-authoritative map of mounted players → their Hachi model. */
const mountedPlayers = new Map<number, Model>();
/** Active sit animation tracks for cleanup on unequip. */
const sitTracks = new Map<number, AnimationTrack>();

/** Check if a player is currently mounted on Hachi. */
export function isPlayerMounted(player: Player): boolean {
	return mountedPlayers.has(player.UserId);
}

/** Get the Hachi model for a mounted player, or undefined. */
export function getPlayerHachi(player: Player): Model | undefined {
	return mountedPlayers.get(player.UserId);
}

/**
 * Equip the Hachi costume on a player's character.
 *
 * 1. Strips physics objects (VehicleSeat, BodyVelocity, BodyGyro)
 * 2. Sets all parts Massless + non-collidable
 * 3. Creates a Weld from HRP to Hachi Body with sitting offset
 * 4. Sets Humanoid WalkSpeed/JumpHeight for Hachi movement
 */
export function equipHachiCostume(
	player: Player,
	hachiModel: Model,
	evolutionLevel: number,
): boolean {
	const character = player.Character;
	if (!character) return false;

	const humanoid = character.FindFirstChildOfClass("Humanoid");
	const hrp = character.FindFirstChild("HumanoidRootPart") as
		| BasePart
		| undefined;
	if (!humanoid || !hrp) return false;

	// Already mounted: skip
	if (mountedPlayers.has(player.UserId)) return false;

	// Strip objects that are no longer needed
	hachiModel.FindFirstChildWhichIsA("VehicleSeat")?.Destroy();
	hachiModel.FindFirstChildOfClass("BodyVelocity")?.Destroy();
	hachiModel.FindFirstChildOfClass("BodyGyro")?.Destroy();
	for (const desc of hachiModel.GetDescendants()) {
		if (desc.IsA("ProximityPrompt")) desc.Destroy();
	}

	// Make all Hachi parts cosmetic-only (no physics impact on Humanoid)
	for (const desc of hachiModel.GetDescendants()) {
		if (desc.IsA("BasePart")) {
			desc.Massless = true;
			desc.CanCollide = false;
			desc.CanTouch = false;
			desc.CanQuery = false;
		}
	}

	// Scale the model
	hachiModel.ScaleTo(HACHI_DEFAULT_SCALE);

	// Find the Body part (PrimaryPart of the Hachi model)
	const body =
		hachiModel.PrimaryPart ??
		(hachiModel.FindFirstChild("Body") as BasePart | undefined);
	if (!body) {
		warn("[hachiCostume] Hachi model has no Body part");
		return false;
	}

	// Parent to character first (required before welding)
	hachiModel.Name = HACHI_COSTUME_NAME;
	hachiModel.Parent = character;

	// Create a classic Weld (not WeldConstraint) for C0/C1 offset tuning.
	// Offset: Hachi body sits below the character (rider on top).
	const bodyHalfHeight = body.Size.Y / 2;
	const weld = new Instance("Weld");
	weld.Name = "HachiMountWeld";
	weld.Part0 = hrp;
	weld.Part1 = body;
	// C0 offset: move Hachi below HRP so character sits on top.
	// Rotate 180° around Y so Hachi's forward matches the character's forward.
	weld.C0 = new CFrame(0, -(bodyHalfHeight + hrp.Size.Y / 2), 0).mul(
		CFrame.Angles(0, math.pi, 0),
	);
	weld.Parent = body;

	// Play sitting animation at Action4 priority to override locomotion
	const animator =
		humanoid.FindFirstChildOfClass("Animator") ??
		(() => {
			const a = new Instance("Animator");
			a.Parent = humanoid;
			return a;
		})();
	const sitAnim = new Instance("Animation");
	sitAnim.AnimationId = SIT_ANIMATION_ID;
	const track = animator.LoadAnimation(sitAnim);
	track.Priority = Enum.AnimationPriority.Action4;
	track.Looped = true;
	track.Play();
	sitTracks.set(player.UserId, track);
	sitAnim.Destroy(); // Animation instance no longer needed after loading

	// Set Humanoid movement properties
	const walkSpeed = HACHI_WALK_SPEEDS[evolutionLevel] ?? HACHI_WALK_SPEEDS[0];
	humanoid.WalkSpeed = walkSpeed;
	humanoid.JumpHeight = HACHI_JUMP_VELOCITY * 0.15; // Approximate: convert impulse to JumpHeight

	// Track mounted state
	mountedPlayers.set(player.UserId, hachiModel);

	// Notify client
	serverEvents.hachiCostumeEquipped.fire(player, true);

	print(
		`[hachiCostume] Equipped Hachi on ${player.Name} (evo ${evolutionLevel})`,
	);
	return true;
}

/**
 * Unequip the Hachi costume from a player's character.
 * Restores default movement properties.
 */
export function unequipHachiCostume(player: Player): boolean {
	const hachiModel = mountedPlayers.get(player.UserId);
	if (!hachiModel) return false;

	// Stop sitting animation
	const track = sitTracks.get(player.UserId);
	if (track) {
		track.Stop();
		sitTracks.delete(player.UserId);
	}

	// Destroy the model (weld is a child, destroyed with it)
	hachiModel.Destroy();

	// Restore Humanoid defaults
	const character = player.Character;
	if (character) {
		const humanoid = character.FindFirstChildOfClass("Humanoid");
		if (humanoid) {
			humanoid.WalkSpeed = DEFAULT_WALK_SPEED;
			humanoid.JumpHeight = DEFAULT_JUMP_HEIGHT;
			humanoid.AutoRotate = true;
		}
	}

	// Clear mounted state
	mountedPlayers.delete(player.UserId);

	// Notify client
	serverEvents.hachiCostumeEquipped.fire(player, false);

	print(`[hachiCostume] Unequipped Hachi from ${player.Name}`);
	return true;
}

/**
 * Update the Hachi walk speed for evolution level changes.
 */
export function updateHachiWalkSpeed(
	player: Player,
	evolutionLevel: number,
): void {
	const character = player.Character;
	if (!character) return;
	const humanoid = character.FindFirstChildOfClass("Humanoid");
	if (!humanoid) return;
	const walkSpeed = HACHI_WALK_SPEEDS[evolutionLevel] ?? HACHI_WALK_SPEEDS[0];
	humanoid.WalkSpeed = walkSpeed;
}

/** Clean up mounted state when a player leaves. */
Players.PlayerRemoving.Connect((player) => {
	sitTracks.delete(player.UserId);
	mountedPlayers.delete(player.UserId);
});
