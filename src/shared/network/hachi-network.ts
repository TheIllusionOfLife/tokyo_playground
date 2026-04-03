/**
 * Hachi vehicle networking events.
 * Covers: evolution, item collection, wall-run, jump, slide,
 * race state, field items, costume toggle, eject.
 */
import { HachiRaceStateData } from "shared/types";

export interface HachiServerToClient {
	slideImpulse(dir: Vector3, speed: number): void;
	hachiEvolved(newLevel: number): void;
	hachiItemCollected(itemCount: number): void;
	hachiWallRunStart(wallNormal: Vector3): void;
	hachiWallRunStop(): void;
	hachiDoubleJumpGranted(): void;
	hachiBonusCollected(): void;
	hachiRaceState(state: HachiRaceStateData): void;
	hachiFieldItems(
		remainingRegular: number,
		totalRegular: number,
		remainingBonus: number,
		totalBonus: number,
	): void;
	hachiCostumeEquipped(equipped: boolean): void;
}

export interface HachiClientToServer {
	hachiJump(): void;
	hachiEject(): void;
	hachiDoubleJump(): void;
	requestHachiSlide(): void;
	hachiToggleCostume(equip: boolean): void;
	hachiLobbyDoubleJump(): void;
	hachiLobbyWallRun(wallNormal: Vector3): void;
}
