import { describe, expect, test } from "bun:test";
import {
	type CanKickPlayerState,
	type HachiRidePlayerState,
	MinigameId,
	PlayerRole,
	type ShibuyaScramblePlayerState,
} from "../src/shared/types";
import {
	calculateCanKickRewards,
	calculateHachiRideRewards,
	calculateShibuyaScrambleRewards,
} from "../src/shared/utils/rewardCalc";

// --- Helpers for building player state ---

function makeCanKickState(
	overrides: Partial<CanKickPlayerState> = {},
): CanKickPlayerState {
	return {
		minigameId: MinigameId.CanKick,
		playerId: 1,
		role: PlayerRole.Hider,
		isCaught: false,
		isInJail: false,
		rescueCount: 0,
		catchCount: 0,
		canKickCount: 0,
		...overrides,
	};
}

function makeHachiState(
	overrides: Partial<HachiRidePlayerState> = {},
): HachiRidePlayerState {
	return {
		minigameId: MinigameId.HachiRide,
		playerId: 1,
		role: PlayerRole.None,
		itemCount: 0,
		evolutionLevel: 1,
		catchCount: 0,
		rescueCount: 0,
		...overrides,
	};
}

function makeScrambleState(
	overrides: Partial<ShibuyaScramblePlayerState> = {},
): ShibuyaScramblePlayerState {
	return {
		minigameId: MinigameId.ShibuyaScramble,
		playerId: 1,
		role: PlayerRole.Hider,
		isTagged: false,
		catchCount: 0,
		rescueCount: 0,
		...overrides,
	};
}

// --- CanKick Rewards ---

describe("calculateCanKickRewards", () => {
	test("oni who wins with 3 catches gets full reward", () => {
		const result = calculateCanKickRewards(
			makeCanKickState({ catchCount: 3 }),
			PlayerRole.Oni,
			true,
		);
		// ONI_BASE(40) + WIN(25) + CATCH_BONUS(15*3=45)
		expect(result).toEqual({
			baseReward: 40,
			winBonus: 25,
			roleBonus: 45,
			rescueBonus: 0,
			totalPoints: 110,
		});
	});

	test("oni who loses with 0 catches gets only base", () => {
		const result = calculateCanKickRewards(
			makeCanKickState({ catchCount: 0 }),
			PlayerRole.Oni,
			false,
		);
		expect(result).toEqual({
			baseReward: 40,
			winBonus: 0,
			roleBonus: 0,
			rescueBonus: 0,
			totalPoints: 40,
		});
	});

	test("hider who wins with 2 rescues gets rescue bonus + can kick bonus", () => {
		const result = calculateCanKickRewards(
			makeCanKickState({ rescueCount: 2 }),
			PlayerRole.Hider,
			true,
		);
		// BASE(25) + WIN(25) + RESCUE(15*2=30) + CAN_KICK(20)
		expect(result).toEqual({
			baseReward: 25,
			winBonus: 25,
			roleBonus: 50,
			rescueBonus: 0,
			totalPoints: 100,
		});
	});

	test("hider who wins with 0 rescues gets no can kick bonus", () => {
		const result = calculateCanKickRewards(
			makeCanKickState({ rescueCount: 0 }),
			PlayerRole.Hider,
			true,
		);
		// BASE(25) + WIN(25), no rescue bonus, no can kick bonus
		expect(result).toEqual({
			baseReward: 25,
			winBonus: 25,
			roleBonus: 0,
			rescueBonus: 0,
			totalPoints: 50,
		});
	});

	test("hider who loses with 1 rescue gets rescue bonus + can kick bonus", () => {
		const result = calculateCanKickRewards(
			makeCanKickState({ rescueCount: 1 }),
			PlayerRole.Hider,
			false,
		);
		// BASE(25) + RESCUE(15) + CAN_KICK(20)
		expect(result).toEqual({
			baseReward: 25,
			winBonus: 0,
			roleBonus: 35,
			rescueBonus: 0,
			totalPoints: 60,
		});
	});
});

// --- HachiRide Rewards ---

describe("calculateHachiRideRewards", () => {
	test("score equals itemCount minus starting offset (10)", () => {
		const result = calculateHachiRideRewards(makeHachiState({ itemCount: 30 }));
		// 30 - 10 = 20
		expect(result).toEqual({
			baseReward: 0,
			winBonus: 0,
			roleBonus: 0,
			rescueBonus: 0,
			totalPoints: 20,
		});
	});

	test("score is clamped to 0 when itemCount is below offset", () => {
		const result = calculateHachiRideRewards(makeHachiState({ itemCount: 5 }));
		expect(result.totalPoints).toBe(0);
	});

	test("score is 0 when itemCount exactly equals offset", () => {
		const result = calculateHachiRideRewards(makeHachiState({ itemCount: 10 }));
		expect(result.totalPoints).toBe(0);
	});

	test("score is 0 when itemCount is 0", () => {
		const result = calculateHachiRideRewards(makeHachiState({ itemCount: 0 }));
		expect(result.totalPoints).toBe(0);
	});

	test("has no base, win, or role bonuses regardless of state", () => {
		const result = calculateHachiRideRewards(
			makeHachiState({ itemCount: 100, evolutionLevel: 4 }),
		);
		expect(result.baseReward).toBe(0);
		expect(result.winBonus).toBe(0);
		expect(result.roleBonus).toBe(0);
		expect(result.rescueBonus).toBe(0);
	});
});

// --- ShibuyaScramble Rewards ---

describe("calculateShibuyaScrambleRewards", () => {
	test("oni who wins with 4 tags gets full reward", () => {
		const result = calculateShibuyaScrambleRewards(
			makeScrambleState({ catchCount: 4 }),
			PlayerRole.Oni,
			true,
		);
		// ONI_BASE(40) + WIN(25) + TAG_BONUS(15*4=60)
		expect(result).toEqual({
			baseReward: 40,
			winBonus: 25,
			roleBonus: 60,
			rescueBonus: 0,
			totalPoints: 125,
		});
	});

	test("oni who loses with 0 tags gets only base", () => {
		const result = calculateShibuyaScrambleRewards(
			makeScrambleState({ catchCount: 0 }),
			PlayerRole.Oni,
			false,
		);
		expect(result).toEqual({
			baseReward: 40,
			winBonus: 0,
			roleBonus: 0,
			rescueBonus: 0,
			totalPoints: 40,
		});
	});

	test("hider who wins gets base + win, no role bonus", () => {
		const result = calculateShibuyaScrambleRewards(
			makeScrambleState(),
			PlayerRole.Hider,
			true,
		);
		expect(result).toEqual({
			baseReward: 25,
			winBonus: 25,
			roleBonus: 0,
			rescueBonus: 0,
			totalPoints: 50,
		});
	});

	test("hider who loses gets only base participation", () => {
		const result = calculateShibuyaScrambleRewards(
			makeScrambleState(),
			PlayerRole.Hider,
			false,
		);
		expect(result).toEqual({
			baseReward: 25,
			winBonus: 0,
			roleBonus: 0,
			rescueBonus: 0,
			totalPoints: 25,
		});
	});

	test("hider catch count does not affect rewards (oni-only bonus)", () => {
		const result = calculateShibuyaScrambleRewards(
			makeScrambleState({ catchCount: 10 }),
			PlayerRole.Hider,
			false,
		);
		expect(result.roleBonus).toBe(0);
	});
});
