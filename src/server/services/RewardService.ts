import { Service } from "@flamework/core";
import {
	BASE_PARTICIPATION_POINTS,
	CAN_KICK_BONUS,
	HIDER_RESCUE_BONUS,
	LOSS_MULTIPLIER,
	ONI_CATCH_BONUS,
	SCRAMBLE_TAG_BONUS_PER_TAG,
	WIN_BONUS_POINTS,
} from "shared/constants";
import {
	CanKickPlayerState,
	PlayerRole,
	RewardBreakdown,
	RoundResult,
	ShibuyaScramblePlayerState,
} from "shared/types";

@Service()
export class RewardService {
	calculateCanKickRewards(
		playerState: CanKickPlayerState,
		roundResult: RoundResult,
		role: PlayerRole,
	): RewardBreakdown {
		const isOni = role === PlayerRole.Oni;
		const won =
			(isOni && roundResult === RoundResult.OniWins) ||
			(!isOni && roundResult === RoundResult.HidersWin) ||
			(!isOni && roundResult === RoundResult.TimerExpired);

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

	calculateShibuyaScrambleRewards(
		playerState: ShibuyaScramblePlayerState,
		roundResult: RoundResult,
		role: PlayerRole,
	): RewardBreakdown {
		const isOni = role === PlayerRole.Oni;
		const won =
			(isOni && roundResult === RoundResult.OniWins) ||
			(!isOni && roundResult !== RoundResult.OniWins);

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
