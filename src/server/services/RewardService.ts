import { Service } from "@flamework/core";
import {
	CanKickPlayerState,
	HachiRidePlayerState,
	PlayerRole,
	RewardBreakdown,
	ShibuyaScramblePlayerState,
} from "shared/types";
import {
	calculateCanKickRewards,
	calculateHachiRideRewards,
	calculateShibuyaScrambleRewards,
} from "shared/utils/rewardCalc";

@Service()
export class RewardService {
	calculateCanKickRewards(
		playerState: CanKickPlayerState,
		role: PlayerRole,
		won: boolean,
	): RewardBreakdown {
		return calculateCanKickRewards(playerState, role, won);
	}

	calculateHachiRideRewards(
		playerState: HachiRidePlayerState,
	): RewardBreakdown {
		return calculateHachiRideRewards(playerState);
	}

	calculateShibuyaScrambleRewards(
		playerState: ShibuyaScramblePlayerState,
		role: PlayerRole,
		won: boolean,
	): RewardBreakdown {
		return calculateShibuyaScrambleRewards(playerState, role, won);
	}
}
