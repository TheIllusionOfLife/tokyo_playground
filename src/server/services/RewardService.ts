import { Service } from "@flamework/core";
import {
	BASE_PARTICIPATION_POINTS,
	CAN_KICK_BONUS,
	HACHI_ITEM_POINT_VALUE,
	HACHI_WIN_ITEM_BONUS,
	HIDER_RESCUE_BONUS,
	LOSS_MULTIPLIER,
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

		const baseReward = won
			? BASE_PARTICIPATION_POINTS
			: math.floor(BASE_PARTICIPATION_POINTS * LOSS_MULTIPLIER);

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
		won: boolean,
	): RewardBreakdown {
		const baseReward = BASE_PARTICIPATION_POINTS;
		const winBonus = won ? HACHI_WIN_ITEM_BONUS : 0;
		const roleBonus = playerState.itemCount * HACHI_ITEM_POINT_VALUE;
		const rescueBonus = 0;
		const totalPoints = baseReward + winBonus + roleBonus + rescueBonus;
		return { baseReward, winBonus, roleBonus, rescueBonus, totalPoints };
	}

	calculateShibuyaScrambleRewards(
		playerState: ShibuyaScramblePlayerState,
		role: PlayerRole,
		won: boolean,
	): RewardBreakdown {
		const isOni = role === PlayerRole.Oni;

		const baseReward = won
			? BASE_PARTICIPATION_POINTS
			: math.floor(BASE_PARTICIPATION_POINTS * LOSS_MULTIPLIER);
		const winBonus = won ? WIN_BONUS_POINTS : 0;
		const roleBonus = isOni
			? SCRAMBLE_TAG_BONUS_PER_TAG * playerState.catchCount
			: 0;
		const rescueBonus = 0;
		const totalPoints = baseReward + winBonus + roleBonus + rescueBonus;

		return { baseReward, winBonus, roleBonus, rescueBonus, totalPoints };
	}
}
