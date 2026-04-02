import { HACHI_STARTING_SCORE_OFFSET } from "shared/constants";
import { type HachiRidePlayerState } from "shared/types";

export interface HachiRoundOutcome {
	/** Display score (offset subtracted) of the top player. */
	topScore: number;
	winnerName: string;
	winningPlayerIds: number[];
}

export function getHachiRoundOutcome(
	states: Map<number, HachiRidePlayerState>,
	playerNames: Map<number, string>,
): HachiRoundOutcome {
	let topItemCount = 0;
	let winnerName = "";
	let winningPlayerIds: number[] = [];

	for (const [userId, state] of states) {
		if (state.itemCount < topItemCount) continue;

		if (state.itemCount > topItemCount) {
			topItemCount = state.itemCount;
			winnerName = playerNames.get(userId) ?? "";
			winningPlayerIds = [];
		}

		winningPlayerIds.push(userId);
		if (winnerName === "") {
			winnerName = playerNames.get(userId) ?? "";
		}
	}

	const topScore = math.max(0, topItemCount - HACHI_STARTING_SCORE_OFFSET);

	if (topScore <= 0) {
		return {
			topScore: 0,
			winnerName: "",
			winningPlayerIds: [],
		};
	}

	return {
		topScore,
		winnerName,
		winningPlayerIds,
	};
}
