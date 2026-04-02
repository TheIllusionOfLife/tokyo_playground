import { Service } from "@flamework/core";
import {
	BASE_PARTICIPATION_POINTS,
	CAN_KICK_BONUS,
	HACHI_STARTING_SCORE_OFFSET,
	HIDER_RESCUE_BONUS,
	ONI_CATCH_BONUS,
	SCRAMBLE_TAG_BONUS_PER_TAG,
	WIN_BONUS_POINTS,
} from "shared/constants";
import {
	CanKickPlayerState,
	HachiRidePlayerState,
	PlayerRole,
	RewardBreakdown,
	ShibuyaScramblePlayerState,
} from "shared/types";

@Service()
export class RewardService {
	calculateCanKickRewards(
		playerState: CanKickPlayerState,
		role: PlayerRole,
		won: boolean,
	): RewardBreakdown {
		const isOni = role === PlayerRole.Oni;
		const baseReward = BASE_PARTICIPATION_POINTS;

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

	calculateHachiRideRewards(
		playerState: HachiRidePlayerState,
	): RewardBreakdown {
		// Hachi Ride: reward = display score only. No base, win, or streak bonuses.
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

	calculateShibuyaScrambleRewards(
		playerState: ShibuyaScramblePlayerState,
		role: PlayerRole,
		won: boolean,
	): RewardBreakdown {
		const isOni = role === PlayerRole.Oni;

		const baseReward = BASE_PARTICIPATION_POINTS;
		const winBonus = won ? WIN_BONUS_POINTS : 0;
		const roleBonus = isOni
			? SCRAMBLE_TAG_BONUS_PER_TAG * playerState.catchCount
			: 0;
		const rescueBonus = 0;
		const totalPoints = baseReward + winBonus + roleBonus + rescueBonus;

		return { baseReward, winBonus, roleBonus, rescueBonus, totalPoints };
	}
}
