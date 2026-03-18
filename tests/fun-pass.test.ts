import { describe, expect, test } from "bun:test";
import {
	type HachiRidePlayerState,
	ItemId,
	ItemCategory,
	type QueueStatusData,
	type ShopItemData,
} from "../src/shared/types";
import { formatQueueStatusDetail } from "../src/shared/utils/queueStatus";
import { canTriggerSpiritWave } from "../src/shared/utils/scrambleCrowd";
import { getFeaturedUnlock } from "../src/shared/utils/featuredUnlock";
import { buildHachiRaceSnapshot } from "../src/shared/utils/hachiRace";

const TEST_HACHI_THRESHOLDS = [0, 10, 25, 40, 60];
(globalThis as unknown as { math: typeof Math }).math = Math;

describe("getFeaturedUnlock", () => {
	test("prefers curated unlock order instead of raw catalog order", () => {
		const items: ShopItemData[] = [
			{
				id: ItemId.EmoteFlip,
				name: "Rooftop Flip",
				category: ItemCategory.Emote,
				price: 250,
				levelRequired: 5,
				owned: false,
				equipped: false,
			},
			{
				id: ItemId.HatCone,
				name: "Alley Cone Cap",
				category: ItemCategory.Hat,
				price: 50,
				levelRequired: 1,
				owned: false,
				equipped: false,
			},
		];

		expect(getFeaturedUnlock(items, 1, 10)).toEqual({
			name: "Alley Cone Cap",
			description: "Earn 40 more points to buy this reward.",
			progressCurrent: 10,
			progressTarget: 50,
		});
	});

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

describe("formatQueueStatusDetail", () => {
	test("describes the auto-start countdown without implying opt-in readiness", () => {
		const status: QueueStatusData = {
			featuredMinigameId: "CanKick" as never,
			secondsUntilStart: 8,
			joinedPlayerCount: 5,
			autoStartEnabled: true,
		};

		expect(formatQueueStatusDetail(status)).toBe(
			"Starting in 8s • 5 in server",
		);
	});

	test("shows when a portal pick overrides the automatic rotation", () => {
		const status: QueueStatusData = {
			featuredMinigameId: "HachiRide" as never,
			secondsUntilStart: 0,
			joinedPlayerCount: 3,
			autoStartEnabled: false,
		};

		expect(formatQueueStatusDetail(status)).toBe(
			"Portal selected • 3 in server",
		);
	});
});

describe("canTriggerSpiritWave", () => {
	test("rejects waves when there are no charges left", () => {
		expect(canTriggerSpiritWave(0, 0, 1)).toBe(false);
	});

	test("rejects waves once the concurrent cap is reached", () => {
		expect(canTriggerSpiritWave(1, 1, 1)).toBe(false);
	});

	test("allows a wave when the player has a charge and the lane is free", () => {
		expect(canTriggerSpiritWave(1, 0, 1)).toBe(true);
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
			TEST_HACHI_THRESHOLDS,
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
				TEST_HACHI_THRESHOLDS,
			),
		).toEqual({
			playerRank: 1,
			leaderName: "Solo",
			leaderScore: 80,
			nextThreshold: 0,
		});
	});
});
