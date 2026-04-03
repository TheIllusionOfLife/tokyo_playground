import { describe, expect, test } from "bun:test";
import { MatchPhase } from "../src/shared/types";
import {
	VALID_TRANSITIONS,
	isValidTransition,
} from "../src/shared/utils/matchPhase";

const ALL_PHASES = [
	MatchPhase.WaitingForPlayers,
	MatchPhase.Countdown,
	MatchPhase.Preparing,
	MatchPhase.InProgress,
	MatchPhase.RoundOver,
	MatchPhase.Rewarding,
];

describe("VALID_TRANSITIONS", () => {
	test("every phase has an entry in the transition map", () => {
		for (const phase of ALL_PHASES) {
			expect(VALID_TRANSITIONS.has(phase)).toBe(true);
		}
	});

	test("all target phases are themselves valid phases", () => {
		for (const [, targets] of VALID_TRANSITIONS) {
			for (const target of targets) {
				expect(ALL_PHASES).toContain(target);
			}
		}
	});
});

describe("isValidTransition", () => {
	test("same-phase transition is always valid (no-op)", () => {
		for (const phase of ALL_PHASES) {
			expect(isValidTransition(phase, phase)).toBe(true);
		}
	});

	// --- Forward flow ---
	test("WaitingForPlayers → Countdown", () => {
		expect(
			isValidTransition(
				MatchPhase.WaitingForPlayers,
				MatchPhase.Countdown,
			),
		).toBe(true);
	});

	test("Countdown → Preparing", () => {
		expect(
			isValidTransition(MatchPhase.Countdown, MatchPhase.Preparing),
		).toBe(true);
	});

	test("Preparing → InProgress", () => {
		expect(
			isValidTransition(MatchPhase.Preparing, MatchPhase.InProgress),
		).toBe(true);
	});

	test("InProgress → RoundOver", () => {
		expect(
			isValidTransition(MatchPhase.InProgress, MatchPhase.RoundOver),
		).toBe(true);
	});

	test("RoundOver → Rewarding", () => {
		expect(
			isValidTransition(MatchPhase.RoundOver, MatchPhase.Rewarding),
		).toBe(true);
	});

	test("Rewarding → WaitingForPlayers", () => {
		expect(
			isValidTransition(
				MatchPhase.Rewarding,
				MatchPhase.WaitingForPlayers,
			),
		).toBe(true);
	});

	// --- Early abort paths ---
	test("Countdown → WaitingForPlayers (abort)", () => {
		expect(
			isValidTransition(
				MatchPhase.Countdown,
				MatchPhase.WaitingForPlayers,
			),
		).toBe(true);
	});

	test("InProgress → WaitingForPlayers (abort)", () => {
		expect(
			isValidTransition(
				MatchPhase.InProgress,
				MatchPhase.WaitingForPlayers,
			),
		).toBe(true);
	});

	// --- Invalid transitions ---
	test("WaitingForPlayers → InProgress is invalid (skips phases)", () => {
		expect(
			isValidTransition(
				MatchPhase.WaitingForPlayers,
				MatchPhase.InProgress,
			),
		).toBe(false);
	});

	test("Preparing → WaitingForPlayers is invalid (no abort from Preparing)", () => {
		expect(
			isValidTransition(
				MatchPhase.Preparing,
				MatchPhase.WaitingForPlayers,
			),
		).toBe(false);
	});

	test("RoundOver → WaitingForPlayers is invalid (must go through Rewarding)", () => {
		expect(
			isValidTransition(
				MatchPhase.RoundOver,
				MatchPhase.WaitingForPlayers,
			),
		).toBe(false);
	});

	test("Rewarding → InProgress is invalid (can only go to WaitingForPlayers)", () => {
		expect(
			isValidTransition(MatchPhase.Rewarding, MatchPhase.InProgress),
		).toBe(false);
	});

	test("WaitingForPlayers → Rewarding is invalid (skips entire flow)", () => {
		expect(
			isValidTransition(
				MatchPhase.WaitingForPlayers,
				MatchPhase.Rewarding,
			),
		).toBe(false);
	});

	test("InProgress → Countdown is invalid (backward)", () => {
		expect(
			isValidTransition(MatchPhase.InProgress, MatchPhase.Countdown),
		).toBe(false);
	});
});
