import { type HachiRidePlayerState } from "shared/types";

export interface HachiRaceSnapshot {
	playerRank: number;
	leaderName: string;
	leaderScore: number;
	nextThreshold: number;
}

export function buildHachiRaceSnapshot(
	states: Map<number, HachiRidePlayerState>,
	playerNames: Map<number, string>,
	localUserId: number,
	thresholds: number[],
): HachiRaceSnapshot {
	const localState = states.get(localUserId);
	const sizeMember = (
		states as unknown as {
			size: number | (() => number);
		}
	).size;
	const stateCount =
		typeOf(sizeMember) === "function"
			? (sizeMember as () => number)()
			: sizeMember;

	if (!localState || stateCount === 0) {
		return {
			playerRank: 0,
			leaderName: "",
			leaderScore: 0,
			nextThreshold: 0,
		};
	}

	let playerRank = 1;
	let leaderName = "";
	let leaderScore = -1;
	for (const [userId, state] of states) {
		if (state.itemCount > localState.itemCount) {
			playerRank += 1;
		}
		if (state.itemCount > leaderScore) {
			leaderScore = state.itemCount;
			leaderName = playerNames.get(userId) ?? "Leader";
		}
	}

	let nextThreshold = 0;
	for (const threshold of thresholds) {
		if (threshold > localState.itemCount) {
			nextThreshold = threshold;
			break;
		}
	}

	return {
		playerRank,
		leaderName,
		leaderScore,
		nextThreshold,
	};
}
