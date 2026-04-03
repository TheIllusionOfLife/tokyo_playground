/**
 * Living Shibuya networking events.
 * Covers: day/night cycle, weather, NPCs, micro-events, PoI discovery,
 * stamps (deprecated), player progression.
 */
import {
	MicroEventData,
	MicroEventProgressData,
	TimePhase,
} from "shared/types";

export interface LivingCityServerToClient {
	// ── Day/Night ────────────────────────────────────────────────────────
	timeOfDayChanged(phase: TimePhase, normalizedTime: number): void;
	timeSync(serverClock: number): void;
	lightingOverride(preset: string): void;

	// ── Stamps (deprecated, kept for compat) ────────────────────────────
	stampDiscovered(stampId: string, displayName: string): void;
	stampSetCompleted(setId: string, rewardItemId: string): void;
	stampCardData(discovered: string[], totalCount: number): void;

	// ── Point of Interest Discovery ─────────────────────────────────────
	poiDiscoveredConfirm(zoneName: string): void;
	poiRewardClaimed(zoneName: string, points: number): void;
	poiSyncAll(discovered: string[], claimed: string[]): void;

	// ── NPCs ─────────────────────────────────────────────────────────────
	npcSpawned(npcId: string, position: Vector3): void;
	npcDespawned(npcId: string): void;
	npcInteraction(
		npcId: string,
		interactionType: string,
		rewardPoints: number,
	): void;
	omikujiResult(
		fortune: string,
		fortuneJP: string,
		tier: number,
		points: number,
	): void;

	// ── Micro-Events ─────────────────────────────────────────────────────
	microEventStarted(
		eventId: string,
		duration: number,
		data: MicroEventData,
	): void;
	microEventEnded(eventId: string): void;
	microEventProgress(eventId: string, data: MicroEventProgressData): void;
	bonOdoriNote(direction: number, beatTime: number): void;
	foodTruckFound(playerName: string, slotsRemaining: number): void;

	// ── Weather ──────────────────────────────────────────────────────────
	weatherChanged(weather: string): void;

	// ── Player Progress ─────────────────────────────────────────────────
	playerProgressSync(maxHachiLevel: number, badges: string[]): void;
}

export interface LivingCityClientToServer {
	// ── Stamps (deprecated) ─────────────────────────────────────────────
	requestStampCard(): void;

	// ── Point of Interest Discovery ─────────────────────────────────────
	poiDiscovered(zoneName: string): void;
	claimPoiReward(zoneName: string): void;

	// ── NPCs ─────────────────────────────────────────────────────────────
	requestNpcInteraction(npcId: string): void;
	requestOmikuji(): void;

	// ── Micro-Events ─────────────────────────────────────────────────────
	bonOdoriHit(direction: number, accuracy: number): void;
	interactFoodTruck(): void;
	obstacleCourseCheckpoint(checkpointIndex: number): void;
	obstacleCourseFinish(): void;
}
