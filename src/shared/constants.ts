import {
	ItemCategory,
	ItemId,
	MinigameId,
	MissionId,
	ShopItemData,
} from "shared/types";

// Defaults
export const DEFAULT_WALK_SPEED = 16;

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
	[MinigameId.ShibuyaScramble]: {
		minPlayers: 2,
		maxPlayers: 10,
		roundDuration: 150,
	},
	[MinigameId.HachiRide]: {
		minPlayers: 1,
		maxPlayers: 8,
		roundDuration: 180,
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
	[MissionId.CollectHachiItems]: {
		label: "Collect 20 Items on Hachi",
		target: 20,
		pointsReward: 50,
	},
	[MissionId.ReachHachiLevel3]: {
		label: "Evolve Hachi to Big Hachi",
		target: 1,
		pointsReward: 60,
	},
	[MissionId.WinHachiRide]: {
		label: "Win Hachi Ride",
		target: 1,
		pointsReward: 75,
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
	MissionId.CollectHachiItems,
	MissionId.ReachHachiLevel3,
	MissionId.WinHachiRide,
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

// Shop
export const SHOP_CATALOG_COOLDOWN = 2; // seconds between catalog requests

export const SLIDE_RAMP_TAG = "ShibuyaSlideRamp";
export const SLIDE_DIR_Y_OFFSET = -0.4; // downward bias added to ramp LookVector
export const SLIDE_TRIGGER_RADIUS = 6; // studs from ramp surface to trigger (OBB closest-point)
export const HACHI_SLIDE_RAMP_PROXIMITY = 20; // studs — server-side ramp ownership check (OBB)

export const CAN_KICK_PORTAL_TAG = "CanKickPortal";
export const SCRAMBLE_PORTAL_TAG = "ShibuyaScramblePortal";
export const HACHI_RIDE_TAG = "HachiRide";
export const HACHI_RIDE_PORTAL_TAG = "HachiRidePortal";
export const HACHI_ITEM_TAG = "HachiCollectible";
export const HACHI_KEY_ITEM_TAG = "HachiKeyItem";
export const HACHI_SPAWN_TAG = "HachiRideSpawn";

// Hachi Ride tuning
export const HACHI_ROUND_DURATION = 180;
export const HACHI_EVOLUTION_THRESHOLDS = [0, 10, 25, 40, 60];
export const HACHI_WALK_SPEEDS = [48, 54, 60, 72, 90];
export const HACHI_ITEMS_TO_SPAWN = 200;
export const HACHI_COLLECTION_RADIUS = 8;
export const HACHI_BIG_SCALE = 1.5;
export const HACHI_DOUBLE_JUMP_IMPULSE = 139; // old 80 × √3 — yields ~3× jump height
export const HACHI_WALL_RUN_SPEED = 84; // 28 × 3
export const HACHI_WALL_RUN_RAYCAST = 3;
export const HACHI_WALL_RUN_MAX_DUR = 3;
export const HACHI_ITEM_POINT_VALUE = 1;
export const HACHI_WIN_ITEM_BONUS = 20;
export const HACHI_JUMP_VELOCITY = 87; // old 50 × √3 — yields ~3× jump height
export const HACHI_JUMP_COOLDOWN = 0.4; // seconds between jump requests
export const HACHI_EJECT_COOLDOWN = 1.0; // seconds between eject requests
export const HACHI_SLIDE_FORCE_RESTORE_DELAY = 0.5; // seconds to hold MaxForce=0 after impulse
export const HACHI_EJECT_SEAT_DISABLE_DURATION = 0.1; // seconds VehicleSeat stays disabled on eject

// Shibuya Scramble
export const SCRAMBLE_ROOFTOP_TP_TAG = "ShibuyaRooftopTP";
export const SCRAMBLE_ROOFTOP_TP_COOLDOWN = 15; // seconds
export const SCRAMBLE_ROOFTOP_TP_DEST = new Vector3(-73, 1476, -1512);

export const SCRAMBLE_TAG_RADIUS = 8;
export const SCRAMBLE_ONI_COUNT_DURATION = 10;
export const SCRAMBLE_CROWD_WAVE_INTERVAL = 20;
export const SCRAMBLE_CROWD_WAVE_DURATION = 10;
export const SCRAMBLE_CROWD_NPC_COUNT = 12;
export const SCRAMBLE_SLIDE_SPEED = 800;
export const SCRAMBLE_SLIDE_COOLDOWN = 8;
export const SCRAMBLE_TAG_BONUS_PER_TAG = 5;

// Hachi anti-cheat
export const HACHI_MAX_SPEED_TOLERANCE = 1.5; // multiplier over max expected speed
export const HACHI_ANTICHEAT_GRACE_STUDS = 10; // extra tolerance per check interval
export const HACHI_ANTICHEAT_STRIKE_LIMIT = 3; // strikes before snapback
export const HACHI_ANTICHEAT_CHECK_INTERVAL = 1; // seconds between position checks
export const HACHI_ANTICHEAT_STRIKE_DECAY = 30; // seconds clean before strikes reset

// Audio — verified IDs that load successfully in Studio
export const BGM_TRACK_ID = "rbxassetid://7024340270"; // Tokyo Machine "Moshi" (215s chiptune)
export const SE_ITEM_PICKUP = "rbxassetid://4590662766"; // collect chime (1.9s)
export const SE_EVOLVE = "rbxassetid://6647877129"; // magic level-up sparkle (3.1s)
export const SE_SLIDE = "rbxassetid://151284431"; // brief swoosh (2.0s)
export const SE_JUMP = "rbxassetid://5682262154"; // cartoon bounce (0.5s)
