/**
 * Pure reward calculation functions. No framework dependencies.
 * Used by RewardService and directly importable for testing.
 */
import {
	BASE_PARTICIPATION_POINTS,
	CAN_KICK_BONUS,
	HACHI_STARTING_SCORE_OFFSET,
	HIDER_RESCUE_BONUS,
	ONI_BASE_POINTS,
	ONI_CATCH_BONUS,
	SCRAMBLE_TAG_BONUS_PER_TAG,
	WIN_BONUS_POINTS,
} from "shared/constants";
import {
	type CanKickPlayerState,
	type HachiRidePlayerState,
	PlayerRole,
	type RewardBreakdown,
	type ShibuyaScramblePlayerState,
} from "shared/types";

export function calculateCanKickRewards(
	playerState: CanKickPlayerState,
	role: PlayerRole,
	won: boolean,
): RewardBreakdown {
	const isOni = role === PlayerRole.Oni;
	const baseReward = isOni ? ONI_BASE_POINTS : BASE_PARTICIPATION_POINTS;

	const winBonus = won ? WIN_BONUS_POINTS : 0;

	let roleBonus = 0;
	if (isOni) {
		roleBonus = ONI_CATCH_BONUS * playerState.catchCount;
	} else {
		roleBonus = HIDER_RESCUE_BONUS * playerState.rescueCount;
		if (playerState.rescueCount > 0) {
			roleBonus += CAN_KICK_BONUS;
		}
	}

	const rescueBonus = 0;
	const totalPoints = baseReward + winBonus + roleBonus + rescueBonus;

	return { baseReward, winBonus, roleBonus, rescueBonus, totalPoints };
}

export function calculateHachiRideRewards(
	playerState: HachiRidePlayerState,
): RewardBreakdown {
	const displayScore = math.max(
		0,
		playerState.itemCount - HACHI_STARTING_SCORE_OFFSET,
	);
	return {
		baseReward: 0,
		winBonus: 0,
		roleBonus: 0,
		rescueBonus: 0,
		totalPoints: displayScore,
	};
}

export function calculateShibuyaScrambleRewards(
	playerState: ShibuyaScramblePlayerState,
	role: PlayerRole,
	won: boolean,
): RewardBreakdown {
	const isOni = role === PlayerRole.Oni;

	const baseReward = isOni ? ONI_BASE_POINTS : BASE_PARTICIPATION_POINTS;
	const winBonus = won ? WIN_BONUS_POINTS : 0;
	const roleBonus = isOni
		? SCRAMBLE_TAG_BONUS_PER_TAG * playerState.catchCount
		: 0;
	const rescueBonus = 0;
	const totalPoints = baseReward + winBonus + roleBonus + rescueBonus;

	return { baseReward, winBonus, roleBonus, rescueBonus, totalPoints };
}
