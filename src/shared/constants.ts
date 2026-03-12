import { MinigameId } from "shared/types";

// Lobby & Match Flow
export const LOBBY_INTERMISSION = 15;
export const RESULTS_DISPLAY_DURATION = 8;
export const CLEANUP_DURATION = 3;

// Economy
export const BASE_PARTICIPATION_POINTS = 10;
export const WIN_BONUS_POINTS = 25;
export const ONI_CATCH_BONUS = 5;
export const HIDER_RESCUE_BONUS = 15;
export const CAN_KICK_BONUS = 20;
export const LOSS_MULTIPLIER = 0.6;

// Can Kick
export const ONI_CATCH_RADIUS = 8;
export const CAN_KICK_RADIUS = 10;
export const ONI_COUNT_DURATION = 10;

// Cooldowns
export const ACTION_COOLDOWN = 0.5;

// Leveling — cumulative points needed per level
export const LEVEL_THRESHOLDS: number[] = [
	0, 50, 150, 350, 700, 1200, 2000, 3200, 5000, 8000,
];

interface MinigameConfig {
	minPlayers: number;
	maxPlayers: number;
	roundDuration: number;
}

export const MINIGAME_CONFIGS: Record<MinigameId, MinigameConfig> = {
	[MinigameId.CanKick]: {
		minPlayers: 2,
		maxPlayers: 10,
		roundDuration: 180,
	},
};
