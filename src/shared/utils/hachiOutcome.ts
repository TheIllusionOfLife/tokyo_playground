import { type HachiRidePlayerState } from "shared/types";

export interface HachiRoundOutcome {
	topItemCount: number;
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

	if (topItemCount <= 0) {
		return {
			topItemCount: 0,
			winnerName: "",
			winningPlayerIds: [],
		};
	}

	return {
		topItemCount,
		winnerName,
		winningPlayerIds,
	};
}
