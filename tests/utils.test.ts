import { describe, expect, test } from "bun:test";
import {
	HACHI_EVOLUTION_THRESHOLDS,
	HACHI_MAX_AIR_JUMPS,
	HACHI_STARTING_EVOLUTION,
	HACHI_STARTING_SCORE_OFFSET,
} from "../src/shared/constants";
import { getCurrentDay } from "../src/shared/utils/dayKey";
import {
	edgeRatio_XZ,
	isInsideAABB_XZ,
	squaredDistXZ,
} from "../src/shared/utils/proximityUtils";

// --- proximityUtils ---

describe("isInsideAABB_XZ", () => {
	const min = new Vector3(-10, 0, -10);
	const max = new Vector3(10, 0, 10);

	test("point at center is inside", () => {
		expect(isInsideAABB_XZ(new Vector3(0, 5, 0), min, max)).toBe(true);
	});

	test("point at edge is inside (inclusive)", () => {
		expect(isInsideAABB_XZ(new Vector3(10, 0, 10), min, max)).toBe(true);
		expect(isInsideAABB_XZ(new Vector3(-10, 0, -10), min, max)).toBe(true);
	});

	test("point outside X boundary is rejected", () => {
		expect(isInsideAABB_XZ(new Vector3(11, 0, 0), min, max)).toBe(false);
	});

	test("point outside Z boundary is rejected", () => {
		expect(isInsideAABB_XZ(new Vector3(0, 0, -11), min, max)).toBe(false);
	});

	test("Y coordinate is ignored", () => {
		expect(isInsideAABB_XZ(new Vector3(5, 999, 5), min, max)).toBe(true);
	});
});

describe("edgeRatio_XZ", () => {
	const min = new Vector3(-10, 0, -10);
	const max = new Vector3(10, 0, 10);

	test("center point returns 0", () => {
		expect(edgeRatio_XZ(new Vector3(0, 0, 0), min, max)).toBe(0);
	});

	test("edge point returns 1", () => {
		expect(edgeRatio_XZ(new Vector3(10, 0, 0), min, max)).toBe(1);
		expect(edgeRatio_XZ(new Vector3(0, 0, -10), min, max)).toBe(1);
	});

	test("halfway point returns 0.5", () => {
		expect(edgeRatio_XZ(new Vector3(5, 0, 0), min, max)).toBe(0.5);
	});

	test("beyond edge is clamped to 1", () => {
		expect(edgeRatio_XZ(new Vector3(20, 0, 0), min, max)).toBe(1);
	});

	test("degenerate AABB (zero size) returns 1", () => {
		const same = new Vector3(5, 0, 5);
		expect(edgeRatio_XZ(new Vector3(5, 0, 5), same, same)).toBe(1);
	});
});

describe("squaredDistXZ", () => {
	test("same point returns 0", () => {
		const p = new Vector3(3, 7, 4);
		expect(squaredDistXZ(p, p)).toBe(0);
	});

	test("ignores Y component", () => {
		const a = new Vector3(0, 0, 0);
		const b = new Vector3(0, 100, 0);
		expect(squaredDistXZ(a, b)).toBe(0);
	});

	test("computes correct squared distance in XZ", () => {
		const a = new Vector3(1, 0, 2);
		const b = new Vector3(4, 0, 6);
		// dx=3, dz=4 → 9+16=25
		expect(squaredDistXZ(a, b)).toBe(25);
	});
});

// --- dayKey ---

describe("getCurrentDay", () => {
	test("returns a positive integer", () => {
		const day = getCurrentDay();
		expect(day).toBeGreaterThan(0);
		expect(day).toBe(math.floor(day));
	});

	test("value matches floor(now / 86400)", () => {
		const expected = Math.floor(Date.now() / 1000 / 86400);
		expect(getCurrentDay()).toBe(expected);
	});
});

// --- Evolution thresholds ---

describe("HACHI_EVOLUTION_THRESHOLDS", () => {
	test("thresholds are sorted ascending", () => {
		for (let i = 1; i < HACHI_EVOLUTION_THRESHOLDS.length; i++) {
			expect(HACHI_EVOLUTION_THRESHOLDS[i]).toBeGreaterThan(
				HACHI_EVOLUTION_THRESHOLDS[i - 1],
			);
		}
	});

	test("first threshold is 0 (level 0 requires 0 items)", () => {
		expect(HACHI_EVOLUTION_THRESHOLDS[0]).toBe(0);
	});

	test("starting evolution level is 1", () => {
		expect(HACHI_STARTING_EVOLUTION).toBe(1);
	});

	test("starting score offset equals threshold at starting evolution", () => {
		expect(HACHI_STARTING_SCORE_OFFSET).toBe(
			HACHI_EVOLUTION_THRESHOLDS[HACHI_STARTING_EVOLUTION],
		);
	});

	test("max air jumps array has same length as thresholds", () => {
		expect(HACHI_MAX_AIR_JUMPS.length).toBe(
			HACHI_EVOLUTION_THRESHOLDS.length,
		);
	});

	test("air jumps are non-decreasing with evolution level", () => {
		for (let i = 1; i < HACHI_MAX_AIR_JUMPS.length; i++) {
			expect(HACHI_MAX_AIR_JUMPS[i]).toBeGreaterThanOrEqual(
				HACHI_MAX_AIR_JUMPS[i - 1],
			);
		}
	});
});
