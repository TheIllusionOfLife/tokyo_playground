import { describe, expect, test } from "bun:test";
import {
	computeRoundSummary,
	didPlayerWin,
	isHiderEliminated,
	resolveWinnerName,
	sortScoreboard,
} from "../src/server/utils/roundResolution";
import { MinigameId, PlayerRole, RoundResult } from "../src/shared/types";

// --- didPlayerWin ---

describe("didPlayerWin", () => {
	test("oni wins when result is OniWins", () => {
		expect(
			didPlayerWin(
				{ minigameId: MinigameId.CanKick, role: PlayerRole.Oni },
				RoundResult.OniWins,
				false,
				false,
			),
		).toBe(true);
	});

	test("oni loses when result is HidersWin", () => {
		expect(
			didPlayerWin(
				{ minigameId: MinigameId.CanKick, role: PlayerRole.Oni },
				RoundResult.HidersWin,
				false,
				false,
			),
		).toBe(false);
	});

	test("surviving hider wins on HidersWin", () => {
		expect(
			didPlayerWin(
				{ minigameId: MinigameId.CanKick, role: PlayerRole.Hider },
				RoundResult.HidersWin,
				false,
				false,
			),
		).toBe(true);
	});

	test("surviving hider wins on TimerExpired", () => {
		expect(
			didPlayerWin(
				{ minigameId: MinigameId.ShibuyaScramble, role: PlayerRole.Hider },
				RoundResult.TimerExpired,
				false,
				false,
			),
		).toBe(true);
	});

	test("eliminated hider loses even on HidersWin", () => {
		expect(
			didPlayerWin(
				{ minigameId: MinigameId.CanKick, role: PlayerRole.Hider },
				RoundResult.HidersWin,
				true,
				false,
			),
		).toBe(false);
	});

	test("hachi ride player wins when isHachiWinner is true", () => {
		expect(
			didPlayerWin(
				{ minigameId: MinigameId.HachiRide, role: PlayerRole.None },
				RoundResult.TimerExpired,
				false,
				true,
			),
		).toBe(true);
	});

	test("hachi ride player loses when isHachiWinner is false", () => {
		expect(
			didPlayerWin(
				{ minigameId: MinigameId.HachiRide, role: PlayerRole.None },
				RoundResult.TimerExpired,
				false,
				false,
			),
		).toBe(false);
	});
});

// --- isHiderEliminated ---

describe("isHiderEliminated", () => {
	test("tagged scramble hider is eliminated", () => {
		expect(
			isHiderEliminated({
				minigameId: MinigameId.ShibuyaScramble,
				role: PlayerRole.Hider,
				isTagged: true,
			} as never),
		).toBe(true);
	});

	test("caught cankick hider is eliminated", () => {
		expect(
			isHiderEliminated({
				minigameId: MinigameId.CanKick,
				role: PlayerRole.Hider,
				isCaught: true,
			} as never),
		).toBe(true);
	});

	test("oni is never eliminated", () => {
		expect(
			isHiderEliminated({
				minigameId: MinigameId.CanKick,
				role: PlayerRole.Oni,
			}),
		).toBe(false);
	});

	test("surviving hider is not eliminated", () => {
		expect(
			isHiderEliminated({
				minigameId: MinigameId.CanKick,
				role: PlayerRole.Hider,
				isCaught: false,
			} as never),
		).toBe(false);
	});
});

// --- resolveWinnerName ---

describe("resolveWinnerName", () => {
	// Entries must be pre-sorted by sortScoreboard (descending points).
	// We sort explicitly here to document the contract.
	const entries = [
		{
			playerName: "Alice",
			role: PlayerRole.Oni,
			catches: 3,
			rescues: 0,
			points: 100,
		},
		{
			playerName: "Bob",
			role: PlayerRole.Hider,
			catches: 0,
			rescues: 1,
			points: 80,
		},
		{
			playerName: "Charlie",
			role: PlayerRole.Hider,
			catches: 0,
			rescues: 0,
			points: 60,
		},
	];
	sortScoreboard(entries);

	test("returns oni name on OniWins", () => {
		expect(
			resolveWinnerName(
				MinigameId.CanKick,
				RoundResult.OniWins,
				entries,
				new Set(),
			),
		).toBe("Alice");
	});

	test("returns top surviving hider on HidersWin", () => {
		const eliminated = new Set(["Bob"]);
		expect(
			resolveWinnerName(
				MinigameId.CanKick,
				RoundResult.HidersWin,
				entries,
				eliminated,
			),
		).toBe("Charlie");
	});

	test("returns hachi outcome winner for HachiRide", () => {
		expect(
			resolveWinnerName(
				MinigameId.HachiRide,
				RoundResult.TimerExpired,
				entries,
				new Set(),
				{ winnerName: "Dave", winningPlayerIds: [4], topScore: 50 },
			),
		).toBe("Dave");
	});

	test("returns empty string when no winner found", () => {
		const allEliminated = new Set(["Bob", "Charlie"]);
		expect(
			resolveWinnerName(
				MinigameId.CanKick,
				RoundResult.HidersWin,
				entries,
				allEliminated,
			),
		).toBe("");
	});
});

// --- computeRoundSummary ---

describe("computeRoundSummary", () => {
	test("OniWins shows elapsed time", () => {
		const result = computeRoundSummary(
			MinigameId.CanKick,
			RoundResult.OniWins,
			[
				{
					playerName: "A",
					role: PlayerRole.Oni,
					catches: 3,
					rescues: 0,
					points: 100,
				},
			],
			45,
		);
		expect(result).toBe("Oni caught everyone in 45 seconds!");
	});

	test("CanKick with rescues shows kick count", () => {
		const result = computeRoundSummary(
			MinigameId.CanKick,
			RoundResult.HidersWin,
			[
				{
					playerName: "A",
					role: PlayerRole.Hider,
					catches: 0,
					rescues: 3,
					points: 50,
				},
			],
			60,
		);
		expect(result).toBe("The can was kicked 3 times!");
	});

	test("no catches shows incredible hiding message", () => {
		const result = computeRoundSummary(
			MinigameId.ShibuyaScramble,
			RoundResult.TimerExpired,
			[
				{
					playerName: "A",
					role: PlayerRole.Hider,
					catches: 0,
					rescues: 0,
					points: 25,
				},
			],
			120,
		);
		expect(result).toBe("Nobody got caught! Incredible hiding!");
	});

	test("hachi ride with top score shows winner", () => {
		const result = computeRoundSummary(
			MinigameId.HachiRide,
			RoundResult.TimerExpired,
			[],
			60,
			{ winnerName: "Alice", winningPlayerIds: [1], topScore: 42 },
		);
		expect(result).toBe("Alice scored 42 points!");
	});

	test("hachi ride with no score shows default message", () => {
		const result = computeRoundSummary(
			MinigameId.HachiRide,
			RoundResult.TimerExpired,
			[],
			60,
			{ winnerName: "", winningPlayerIds: [], topScore: 0 },
		);
		expect(result).toBe("What a ride!");
	});

	test("generic catch summary with elapsed time", () => {
		const result = computeRoundSummary(
			MinigameId.ShibuyaScramble,
			RoundResult.TimerExpired,
			[
				{
					playerName: "A",
					role: PlayerRole.Oni,
					catches: 2,
					rescues: 0,
					points: 80,
				},
				{
					playerName: "B",
					role: PlayerRole.Hider,
					catches: 0,
					rescues: 0,
					points: 25,
				},
			],
			90,
		);
		expect(result).toBe("2 players caught in 90s!");
	});
});
