/**
 * Shared context interface for HachiRide helper modules.
 * Passed as first parameter to helper functions to avoid
 * tight coupling to the minigame class's mutable state.
 */
import { HachiRidePlayerState } from "shared/types";

export interface HachiAnticheatContext {
	playerStates: Map<number, HachiRidePlayerState>;
	playerObjects: Map<number, Player>;
	lastPositions: Map<number, Vector3>;
	lastPositionTime: number;
	strikes: Map<number, number>;
	lastStrikeTime: Map<number, number>;
	respawnGrace: Map<number, number>;
	wallRunStates: Map<number, { running: boolean }>;
	hachiSlideActive: Set<number>;
}
