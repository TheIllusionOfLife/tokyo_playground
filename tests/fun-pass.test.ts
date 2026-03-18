import { describe, expect, test } from "bun:test";
import { HACHI_EVOLUTION_THRESHOLDS } from "../src/shared/constants";
import { ItemCategory, type HachiRidePlayerState, type ShopItemData } from "../src/shared/types";
import { buildHachiRaceSnapshot } from "../src/shared/utils/hachiRace";
import { getFeaturedUnlock } from "../src/shared/utils/featuredUnlock";

describe("getFeaturedUnlock", () => {
	test("prefers the first unowned item and reports level progress when locked", () => {
		const items: ShopItemData[] = [
			{
				id: "HatCone" as never,
				name: "Cone Hat",
				category: ItemCategory.Hat,
				price: 50,
				levelRequired: 1,
				owned: true,
				equipped: false,
			},
			{
				id: "TrailRainbow" as never,
				name: "Rainbow Trail",
				category: ItemCategory.Trail,
				price: 200,
				levelRequired: 4,
				owned: false,
				equipped: false,
			},
		];

		expect(getFeaturedUnlock(items, 2, 80)).toEqual({
			name: "Rainbow Trail",
			description: "Reach level 4 to unlock this reward.",
			progressCurrent: 2,
			progressTarget: 4,
		});
	});

	test("reports shop-balance progress when level requirement is already met", () => {
		const items: ShopItemData[] = [
			{
				id: "TrailFlame" as never,
				name: "Flame Trail",
				category: ItemCategory.Trail,
				price: 120,
				levelRequired: 3,
				owned: false,
				equipped: false,
			},
		];

		expect(getFeaturedUnlock(items, 4, 45)).toEqual({
			name: "Flame Trail",
			description: "Earn 75 more points to buy this reward.",
			progressCurrent: 45,
			progressTarget: 120,
		});
	});
});

describe("buildHachiRaceSnapshot", () => {
	test("builds local rank, leader info, and next evolution threshold", () => {
		const states = new Map<number, HachiRidePlayerState>([
			[
				11,
				{
					minigameId: "HachiRide" as never,
					playerId: 11,
					role: "None" as never,
					itemCount: 42,
					evolutionLevel: 3,
					catchCount: 42,
					rescueCount: 0,
				},
			],
			[
				22,
				{
					minigameId: "HachiRide" as never,
					playerId: 22,
					role: "None" as never,
					itemCount: 65,
					evolutionLevel: 4,
					catchCount: 65,
					rescueCount: 0,
				},
			],
			[
				33,
				{
					minigameId: "HachiRide" as never,
					playerId: 33,
					role: "None" as never,
					itemCount: 30,
					evolutionLevel: 2,
					catchCount: 30,
					rescueCount: 0,
				},
			],
		]);

		const snapshot = buildHachiRaceSnapshot(
			states,
			new Map([
				[11, "Akira"],
				[22, "Mika"],
				[33, "Ren"],
			]),
			11,
			HACHI_EVOLUTION_THRESHOLDS,
		);

		expect(snapshot).toEqual({
			playerRank: 2,
			leaderName: "Mika",
			leaderScore: 65,
			nextThreshold: 60,
		});
	});

	test("returns zero threshold when the local player already reached the final evolution", () => {
		const states = new Map<number, HachiRidePlayerState>([
			[
				99,
				{
					minigameId: "HachiRide" as never,
					playerId: 99,
					role: "None" as never,
					itemCount: 80,
					evolutionLevel: 4,
					catchCount: 80,
					rescueCount: 0,
				},
			],
		]);

		expect(
			buildHachiRaceSnapshot(
				states,
				new Map([[99, "Solo"]]),
				99,
				HACHI_EVOLUTION_THRESHOLDS,
			),
		).toEqual({
			playerRank: 1,
			leaderName: "Solo",
			leaderScore: 80,
			nextThreshold: 0,
		});
	});
});
