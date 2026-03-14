import {
	ItemCategory,
	ItemId,
	MinigameId,
	MissionId,
	ShopItemData,
} from "shared/types";

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
		minPlayers: 1,
		maxPlayers: 10,
		roundDuration: 180,
	},
	[MinigameId.ShibuyaScramble]: {
		minPlayers: 1,
		maxPlayers: 10,
		roundDuration: 150,
	},
};

// Missions
export const MISSION_DEFS: Record<
	MissionId,
	{ label: string; target: number; pointsReward: number }
> = {
	[MissionId.PlayGames]: { label: "Play 3 Games", target: 3, pointsReward: 30 },
	[MissionId.WinAsOni]: { label: "Win as Oni", target: 1, pointsReward: 50 },
	[MissionId.WinAsHider]: {
		label: "Win as Hider",
		target: 1,
		pointsReward: 40,
	},
	[MissionId.CatchPlayers]: {
		label: "Catch 5 Players",
		target: 5,
		pointsReward: 60,
	},
	[MissionId.RescueTeammates]: {
		label: "Rescue 3 Teammates",
		target: 3,
		pointsReward: 45,
	},
	[MissionId.KickCan]: {
		label: "Kick the Can 2 Times",
		target: 2,
		pointsReward: 50,
	},
	[MissionId.EarnPoints]: {
		label: "Earn 100 Points",
		target: 100,
		pointsReward: 35,
	},
	[MissionId.SurviveScramble]: {
		label: "Survive Shibuya Scramble",
		target: 1,
		pointsReward: 45,
	},
	[MissionId.TagInScramble]: {
		label: "Tag 3 Hiders as Oni",
		target: 3,
		pointsReward: 55,
	},
	[MissionId.ReachRooftop]: {
		label: "Reach a Rooftop",
		target: 1,
		pointsReward: 30,
	},
};

export const ALL_MISSION_IDS: MissionId[] = [
	MissionId.PlayGames,
	MissionId.WinAsOni,
	MissionId.WinAsHider,
	MissionId.CatchPlayers,
	MissionId.RescueTeammates,
	MissionId.KickCan,
	MissionId.EarnPoints,
	MissionId.SurviveScramble,
	MissionId.TagInScramble,
	MissionId.ReachRooftop,
];

export const SHOP_CATALOG: Omit<ShopItemData, "owned">[] = [
	{
		id: ItemId.HatCone,
		name: "Cone Hat",
		category: ItemCategory.Hat,
		price: 50,
		levelRequired: 1,
	},
	{
		id: ItemId.HatCrown,
		name: "Crown",
		category: ItemCategory.Hat,
		price: 150,
		levelRequired: 3,
	},
	{
		id: ItemId.HatBucket,
		name: "Bucket Hat",
		category: ItemCategory.Hat,
		price: 80,
		levelRequired: 2,
	},
	{
		id: ItemId.TrailStar,
		name: "Star Trail",
		category: ItemCategory.Trail,
		price: 100,
		levelRequired: 2,
	},
	{
		id: ItemId.TrailRainbow,
		name: "Rainbow Trail",
		category: ItemCategory.Trail,
		price: 200,
		levelRequired: 4,
	},
	{
		id: ItemId.TrailFlame,
		name: "Flame Trail",
		category: ItemCategory.Trail,
		price: 120,
		levelRequired: 3,
	},
	{
		id: ItemId.EmoteDance,
		name: "Dance",
		category: ItemCategory.Emote,
		price: 60,
		levelRequired: 1,
	},
	{
		id: ItemId.EmoteCheer,
		name: "Cheer",
		category: ItemCategory.Emote,
		price: 70,
		levelRequired: 1,
	},
	{
		id: ItemId.EmoteWave,
		name: "Wave",
		category: ItemCategory.Emote,
		price: 40,
		levelRequired: 1,
	},
	{
		id: ItemId.EmoteFlip,
		name: "Flip",
		category: ItemCategory.Emote,
		price: 250,
		levelRequired: 5,
	},
];

export const CAN_KICK_PORTAL_TAG = "CanKickPortal";
export const SCRAMBLE_PORTAL_TAG = "ShibuyaScramblePortal";

// Shibuya Scramble
export const SCRAMBLE_ROOFTOP_TP_TAG = "ShibuyaRooftopTP";
export const SCRAMBLE_ROOFTOP_TP_COOLDOWN = 15; // seconds
export const SCRAMBLE_ROOFTOP_TP_DEST = new Vector3(-73, 1476, -1512);

export const SCRAMBLE_TAG_RADIUS = 8;
export const SCRAMBLE_ONI_COUNT_DURATION = 10;
export const SCRAMBLE_CROWD_WAVE_INTERVAL = 20;
export const SCRAMBLE_CROWD_WAVE_DURATION = 10;
export const SCRAMBLE_CROWD_NPC_COUNT = 12;
export const SCRAMBLE_SLIDE_SPEED = 80;
export const SCRAMBLE_SLIDE_COOLDOWN = 8;
export const SCRAMBLE_TAG_BONUS_PER_TAG = 5;
