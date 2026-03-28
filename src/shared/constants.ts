import {
	ItemCategory,
	ItemId,
	MinigameId,
	MissionId,
	NpcId,
	Season,
	ShopItemData,
	StampSetData,
	StampSetId,
	TimePhase,
} from "shared/types";

// Defaults
export const DEFAULT_WALK_SPEED = 30;
export const CHARACTER_SCALE = 0.5; // half-size characters (makes city feel larger)
export const DEFAULT_JUMP_HEIGHT = 7.2; // standard jump height

// Lobby & Match Flow
export const LOBBY_INTERMISSION = 8;
export const RESULTS_DISPLAY_DURATION = 5;
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
export const CAN_RELOCATE_INTERVAL = 35;
export const CAN_RATTLE_TARGET = 3;
export const CAN_FREED_SPEED_BOOST = 48;
export const CAN_FREED_SPEED_BOOST_DURATION = 3;

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
		roundDuration: 120,
	},
	[MinigameId.ShibuyaScramble]: {
		minPlayers: 2,
		maxPlayers: 10,
		roundDuration: 120,
	},
	[MinigameId.HachiRide]: {
		minPlayers: 1,
		maxPlayers: 8,
		roundDuration: 105,
	},
};

export const MINIGAME_INTROS: Record<
	MinigameId,
	{ title: string; subtitle: string; durationSeconds: number }
> = {
	[MinigameId.CanKick]: {
		title: "Street Hide-and-Seek",
		subtitle: "Avoid the Oni and free your team with the can.",
		durationSeconds: 5,
	},
	[MinigameId.ShibuyaScramble]: {
		title: "Shibuya Chaos",
		subtitle: "Blend into the crowd, survive, and use the crossing.",
		durationSeconds: 5,
	},
	[MinigameId.HachiRide]: {
		title: "Ride Hachi",
		subtitle: "Collect trash, evolve fast, and steal the lead.",
		durationSeconds: 5,
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
	// Living Shibuya missions
	[MissionId.DiscoverStamps]: {
		label: "Discover 3 Stamps",
		target: 3,
		pointsReward: 40,
	},
	[MissionId.CompleteStampSet]: {
		label: "Complete a Stamp Set",
		target: 1,
		pointsReward: 75,
	},
	[MissionId.VisitFoodTruck]: {
		label: "Find the Food Truck",
		target: 1,
		pointsReward: 30,
	},
	[MissionId.WatchFireworks]: {
		label: "Watch a Fireworks Show",
		target: 1,
		pointsReward: 25,
	},
	[MissionId.AttendBonOdori]: {
		label: "Join the Bon Odori",
		target: 1,
		pointsReward: 35,
	},
	[MissionId.GetPhotographed]: {
		label: "Get Photographed 3 Times",
		target: 3,
		pointsReward: 30,
	},
	[MissionId.DrawOmikuji]: {
		label: "Draw Your Fortune",
		target: 1,
		pointsReward: 20,
	},
	[MissionId.CompleteObstacleCourse]: {
		label: "Complete Hachi Obstacle Course",
		target: 1,
		pointsReward: 45,
	},
	[MissionId.VisitCatColony]: {
		label: "Visit the Cat Colony",
		target: 1,
		pointsReward: 20,
	},
	[MissionId.WatchStreetArt]: {
		label: "Watch Street Art Being Made",
		target: 1,
		pointsReward: 35,
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
	// Living Shibuya exploration missions
	MissionId.DiscoverStamps,
	MissionId.CompleteStampSet,
	MissionId.VisitFoodTruck,
	MissionId.WatchFireworks,
	MissionId.AttendBonOdori,
	MissionId.GetPhotographed,
	MissionId.DrawOmikuji,
	MissionId.CompleteObstacleCourse,
	MissionId.VisitCatColony,
	MissionId.WatchStreetArt,
];

/**
 * Exploration mission IDs for weighted daily selection (M8).
 * Excludes DiscoverStamps and CompleteStampSet: those are permanent
 * progression objectives tracked via stamp rally, not daily tasks.
 */
export const EXPLORATION_MISSION_IDS: MissionId[] = [
	MissionId.VisitFoodTruck,
	MissionId.WatchFireworks,
	MissionId.AttendBonOdori,
	MissionId.GetPhotographed,
	MissionId.DrawOmikuji,
	MissionId.CompleteObstacleCourse,
	MissionId.VisitCatColony,
	MissionId.WatchStreetArt,
];

export const SHOP_CATALOG: Omit<ShopItemData, "owned" | "equipped">[] = [
	{
		id: ItemId.HatCone,
		name: "Alley Cone Cap",
		category: ItemCategory.Hat,
		price: 50,
		levelRequired: 1,
	},
	{
		id: ItemId.HatCrown,
		name: "Scramble Crown",
		category: ItemCategory.Hat,
		price: 150,
		levelRequired: 3,
	},
	{
		id: ItemId.HatBucket,
		name: "Station Bucket Hat",
		category: ItemCategory.Hat,
		price: 80,
		levelRequired: 2,
	},
	{
		id: ItemId.TrailStar,
		name: "Neon Paw Trail",
		category: ItemCategory.Trail,
		price: 100,
		levelRequired: 2,
	},
	{
		id: ItemId.TrailRainbow,
		name: "Crossing Lights Trail",
		category: ItemCategory.Trail,
		price: 200,
		levelRequired: 4,
	},
	{
		id: ItemId.TrailFlame,
		name: "Lantern Flame Trail",
		category: ItemCategory.Trail,
		price: 120,
		levelRequired: 3,
	},
	{
		id: ItemId.EmoteDance,
		name: "Festival Dance",
		category: ItemCategory.Emote,
		price: 60,
		levelRequired: 1,
	},
	{
		id: ItemId.EmoteCheer,
		name: "Conductor Cheer",
		category: ItemCategory.Emote,
		price: 70,
		levelRequired: 1,
	},
	{
		id: ItemId.EmoteWave,
		name: "Tourist Wave",
		category: ItemCategory.Emote,
		price: 40,
		levelRequired: 1,
	},
	{
		id: ItemId.EmoteFlip,
		name: "Rooftop Flip",
		category: ItemCategory.Emote,
		price: 250,
		levelRequired: 5,
	},
];

// Stamp set reward items (unlocked by stamps, not purchased)
export const STAMP_REWARD_CATALOG: Omit<ShopItemData, "owned" | "equipped">[] =
	[
		{
			id: ItemId.HatAlleyCatEars,
			name: "Alley Cat Ears",
			category: ItemCategory.Hat,
			price: 0,
			levelRequired: 0,
		},
		{
			id: ItemId.TrailCloudWalk,
			name: "Cloud Walk",
			category: ItemCategory.Trail,
			price: 0,
			levelRequired: 0,
		},
		{
			id: ItemId.HatNeonVisor,
			name: "Neon Visor",
			category: ItemCategory.Hat,
			price: 0,
			levelRequired: 0,
		},
		{
			id: ItemId.EmoteOmamoriPrayer,
			name: "Omamori Prayer",
			category: ItemCategory.Emote,
			price: 0,
			levelRequired: 0,
		},
		{
			id: ItemId.TrailTrainSpark,
			name: "Train Spark",
			category: ItemCategory.Trail,
			price: 0,
			levelRequired: 0,
		},
		{
			id: ItemId.HatSunsetCrown,
			name: "Sunset Crown",
			category: ItemCategory.Hat,
			price: 0,
			levelRequired: 0,
		},
		{
			id: ItemId.TitleShibuyaExplorer,
			name: "Shibuya Explorer",
			category: ItemCategory.Emote,
			price: 0,
			levelRequired: 0,
		},
		{
			id: ItemId.SkinGoldenHachi,
			name: "Golden Hachi",
			category: ItemCategory.Trail,
			price: 0,
			levelRequired: 0,
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
export const HACHI_COSTUME_NAME = "HachiCostume";
export const HACHI_RIDE_TAG = "HachiRide";
export const HACHI_RIDE_PORTAL_TAG = "HachiRidePortal";
export const HACHI_ITEM_TAG = "HachiCollectible";
export const HACHI_KEY_ITEM_TAG = "HachiKeyItem";
export const HACHI_SPAWN_TAG = "HachiRideSpawn";

// Hachi Ride tuning
export const HACHI_ROUND_DURATION =
	MINIGAME_CONFIGS[MinigameId.HachiRide].roundDuration;
export const HACHI_STARTING_EVOLUTION = 2; // start with double jump + wall run
export const HACHI_LOBBY_MIN_LEVEL = 3; // lobby Hachi always has double jump + wall run
export const HACHI_EVOLUTION_THRESHOLDS = [0, 5, 12, 20, 30];
export const HACHI_WALK_SPEEDS = [50, 50, 50, 50, 50]; // flat speed (no evolution boost for now)
export const HACHI_ITEMS_TO_SPAWN = 200;
export const HACHI_COLLECTION_RADIUS = 8;
export const HACHI_DEFAULT_SCALE = CHARACTER_SCALE; // matches character scale
export const HACHI_BIG_SCALE = 1.5;
export const HACHI_DOUBLE_JUMP_IMPULSE = 106; // same as HACHI_JUMP_VELOCITY
export const HACHI_WALL_RUN_SPEED = 75;
export const HACHI_WALL_RUN_RAYCAST = 3;
export const HACHI_WALL_RUN_MAX_DUR = 3;
export const HACHI_ITEM_POINT_VALUE = 1;
export const HACHI_BONUS_ITEM_COUNT = 20;
export const HACHI_BONUS_ITEM_VALUE = 5;
export const HACHI_WIN_ITEM_BONUS = 20;
export const HACHI_JUMP_VELOCITY = 106; // 150 * sqrt(0.5) for half jump apex
export const HACHI_JUMP_COOLDOWN = 0.1; // seconds between jump requests
export const HACHI_EJECT_COOLDOWN = 1.0; // seconds between eject requests
export const HACHI_HOTSPOT_RADIUS = 18;
export const HACHI_HOTSPOT_ROTATION_INTERVAL = 20;
export const HACHI_HOTSPOT_MULTIPLIER = 2;
export const HACHI_FINAL_SPRINT_WINDOW = 30;
export const HACHI_FINAL_SPRINT_MULTIPLIER = 3;

// Shibuya Scramble
export const SCRAMBLE_ROOFTOP_TP_TAG = "ShibuyaRooftopTP";
export const SCRAMBLE_ROOFTOP_TP_COOLDOWN = 15; // seconds
export const SCRAMBLE_ROOFTOP_TP_DEST = new Vector3(-73, 1476, -1512);

export const SCRAMBLE_TAG_RADIUS = 8;
export const SCRAMBLE_ONI_COUNT_DURATION = 10;
export const SCRAMBLE_CROWD_WAVE_INTERVAL = 20;
export const SCRAMBLE_CROWD_WAVE_DURATION = 10;
export const SCRAMBLE_CROWD_NPC_COUNT = 12;
export const SCRAMBLE_MAX_ACTIVE_SPIRIT_WAVES = 1;
export const SCRAMBLE_SLIDE_SPEED = 800;
export const SCRAMBLE_SLIDE_COOLDOWN = 8;
export const SCRAMBLE_TAG_BONUS_PER_TAG = 5;
export const SCRAMBLE_SPIRIT_WAVE_DURATION = 5;

// Hachi anti-cheat
export const HACHI_MAX_SPEED_TOLERANCE = 1.5; // multiplier over max expected speed
export const HACHI_ANTICHEAT_GRACE_STUDS = 10; // extra tolerance per check interval
export const HACHI_ANTICHEAT_STRIKE_LIMIT = 3; // strikes before snapback
export const HACHI_ANTICHEAT_CHECK_INTERVAL = 1; // seconds between position checks
export const HACHI_ANTICHEAT_STRIKE_DECAY = 30; // seconds clean before strikes reset

// Audio — verified IDs that load successfully in Studio
export const BGM_TRACK_ID = "rbxassetid://7024340270"; // Tokyo Machine "Moshi" (215s chiptune)
export const SE_ITEM_PICKUP = "rbxassetid://4590662766"; // collect chime (1.9s)
export const SE_BONUS_PICKUP = "rbxassetid://6518811702"; // magic pickup (1.2s)
export const SE_EVOLVE = "rbxassetid://6647877129"; // magic level-up sparkle (3.1s)
export const SE_SLIDE = "rbxassetid://151284431"; // brief swoosh (2.0s)
export const SE_JUMP = "rbxassetid://5682262154"; // cartoon bounce (0.5s)
export const SE_CAN_KICK = "rbxassetid://2865227271"; // triumphant chime (2.0s)
export const SE_CATCH = SE_CAN_KICK; // reuses can kick chime for catch impact
export const SE_TICK = "rbxassetid://12221967"; // classic tick (0.3s)
export const SE_HEARTBEAT = "rbxassetid://6101411994"; // dramatic heartbeat (11.1s)
export const SE_CHEER = "rbxassetid://9112766203"; // crowd celebration (79.6s)
export const SE_AMBIENT_CITY = "rbxassetid://9112758242"; // city ambience loop (27s)

// Living Shibuya Audio
export const SE_STAMP_CHIME = "rbxassetid://6518811702"; // warm magic pickup (1.2s)
export const SE_STAMP_SET_COMPLETE = "rbxassetid://6647877129"; // sparkle fanfare (reuses evolve)
export const SE_OMIKUJI_DRAW = "rbxassetid://4590662766"; // gentle chime (reuses item pickup)
export const SE_NPC_TREAT = "rbxassetid://4590662766"; // treat toss chime
export const SE_HACHI_BARK = "rbxassetid://5682262154"; // short bark (reuses jump)
export const SE_HACHI_YAWN = "rbxassetid://151284431"; // slow whoosh (reuses slide)
export const SE_CAMERA_SHUTTER = "rbxassetid://12221967"; // quick click (reuses tick)
export const SE_FIREWORK_BOOM = "rbxassetid://2865227271"; // impact boom (reuses can kick)
export const SE_FIREWORK_WHISTLE = "rbxassetid://6101411994"; // rising whistle
export const SE_BON_ODORI_DRUM = "rbxassetid://9112766203"; // festival drums (reuses cheer)
export const SE_FOOD_TRUCK_JINGLE = "rbxassetid://7024340270"; // catchy jingle (reuses BGM)
export const SE_RAIN_AMBIENT = "rbxassetid://9112758242"; // rain ambience (reuses city ambient)
export const SE_GOLDEN_HOUR_CHIME = "rbxassetid://6518811702"; // warm shimmer

// Streak bonuses — multiplier by consecutive games played (index = streak count, capped)
export const STREAK_MULTIPLIERS = [1.0, 1.0, 1.1, 1.2, 1.2, 1.35];

// ══════════════════════════════════════════════════════════════════════════
// Living Shibuya Constants
// ══════════════════════════════════════════════════════════════════════════

// ── Day/Night Cycle ──────────────────────────────────────────────────────
export const DAY_CYCLE_MINUTES = 20;
export const LIGHTING_TWEEN_DURATION = 8; // seconds
export const TIME_SYNC_INTERVAL = 60; // seconds between timeSync broadcasts

/** Lighting target values per TimePhase. ClockTime is Roblox Lighting.ClockTime (0-24). */
export const LIGHTING_PROFILES: Record<
	TimePhase,
	{
		Ambient: Color3;
		OutdoorAmbient: Color3;
		ClockTime: number;
		Brightness: number;
		ColorShift_Top: Color3;
	}
> = {
	[TimePhase.Morning]: {
		Ambient: Color3.fromRGB(180, 150, 120),
		OutdoorAmbient: Color3.fromRGB(200, 170, 130),
		ClockTime: 6.5,
		Brightness: 2,
		ColorShift_Top: Color3.fromRGB(255, 200, 150),
	},
	[TimePhase.Daytime]: {
		Ambient: Color3.fromRGB(200, 200, 200),
		OutdoorAmbient: Color3.fromRGB(200, 200, 200),
		ClockTime: 14,
		Brightness: 3,
		ColorShift_Top: Color3.fromRGB(255, 255, 255),
	},
	[TimePhase.GoldenHour]: {
		Ambient: Color3.fromRGB(220, 170, 100),
		OutdoorAmbient: Color3.fromRGB(230, 180, 110),
		ClockTime: 17,
		Brightness: 2.5,
		ColorShift_Top: Color3.fromRGB(255, 180, 80),
	},
	[TimePhase.Evening]: {
		Ambient: Color3.fromRGB(130, 100, 160),
		OutdoorAmbient: Color3.fromRGB(140, 110, 170),
		ClockTime: 19,
		Brightness: 1.5,
		ColorShift_Top: Color3.fromRGB(200, 130, 200),
	},
	[TimePhase.Night]: {
		Ambient: Color3.fromRGB(60, 60, 100),
		OutdoorAmbient: Color3.fromRGB(50, 50, 90),
		ClockTime: 24, // Roblox treats 24 as 0 visually; tween 19->24 goes forward through night
		Brightness: 1,
		ColorShift_Top: Color3.fromRGB(80, 80, 150),
	},
	[TimePhase.Dawn]: {
		Ambient: Color3.fromRGB(140, 120, 140),
		OutdoorAmbient: Color3.fromRGB(150, 130, 150),
		ClockTime: 5,
		Brightness: 1.8,
		ColorShift_Top: Color3.fromRGB(200, 160, 180),
	},
};

// ── Stamp Rally ──────────────────────────────────────────────────────────
export const STAMP_DISCOVERY_RADIUS = 12;
export const STAMP_DISCOVERY_RADIUS_SQ =
	STAMP_DISCOVERY_RADIUS * STAMP_DISCOVERY_RADIUS; // fix L1: squared for perf
export const STAMP_DISCOVERY_POINTS = 10;
export const STAMP_SET_COMPLETION_POINTS = 50;
export const STAMP_MASTER_COMPLETION_POINTS = 500;
export const STAMP_CARD_DISPLAY_DURATION = 3; // seconds
export const STAMP_HINT_RADIUS = 50;
export const STAMP_TOTAL_COUNT = 30;
export const STAMP_PROXIMITY_HZ = 2; // checks per second

export const STAMP_SET_DEFINITIONS: Record<StampSetId, StampSetData> = {
	[StampSetId.BackAlley]: {
		setId: StampSetId.BackAlley,
		stampIds: [
			"alley_garden",
			"alley_graffiti",
			"alley_cats",
			"alley_vending",
			"alley_stairs",
		],
		rewardItemId: ItemId.HatAlleyCatEars,
		displayName: "Back Alley (裏路地)",
	},
	[StampSetId.Rooftop]: {
		setId: StampSetId.Rooftop,
		stampIds: [
			"roof_garden",
			"roof_antenna",
			"roof_view",
			"roof_shrine",
			"roof_pool",
		],
		rewardItemId: ItemId.TrailCloudWalk,
		displayName: "Rooftop (屋上)",
	},
	[StampSetId.NightShibuya]: {
		setId: StampSetId.NightShibuya,
		stampIds: [
			"night_neon",
			"night_bar",
			"night_crossing",
			"night_tower",
			"night_izakaya",
		],
		rewardItemId: ItemId.HatNeonVisor,
		displayName: "Night Shibuya (夜渋谷)",
	},
	[StampSetId.ShrinePath]: {
		setId: StampSetId.ShrinePath,
		stampIds: [
			"shrine_torii",
			"shrine_offering",
			"shrine_bell",
			"shrine_garden",
		],
		rewardItemId: ItemId.EmoteOmamoriPrayer,
		displayName: "Shrine Path (参道)",
	},
	[StampSetId.Station]: {
		setId: StampSetId.Station,
		stampIds: [
			"station_platform",
			"station_gate",
			"station_locker",
			"station_bench",
		],
		rewardItemId: ItemId.TrailTrainSpark,
		displayName: "Station (駅前)",
	},
	[StampSetId.GoldenMoments]: {
		setId: StampSetId.GoldenMoments,
		stampIds: ["golden_bridge", "golden_park", "golden_tower"],
		rewardItemId: ItemId.HatSunsetCrown,
		displayName: "Golden Moments (黄金時)",
	},
	[StampSetId.Seasonal]: {
		setId: StampSetId.Seasonal,
		stampIds: [
			"seasonal_spring",
			"seasonal_summer",
			"seasonal_autumn",
			"seasonal_winter",
		],
		rewardItemId: ItemId.TitleShibuyaExplorer,
		displayName: "Seasonal (四季)",
	},
	[StampSetId.CompleteRally]: {
		setId: StampSetId.CompleteRally,
		stampIds: [], // dynamically checked: all stamps must be discovered
		rewardItemId: ItemId.SkinGoldenHachi,
		displayName: "Complete Rally (全制覇)",
	},
};

// ── Season Helper ────────────────────────────────────────────────────────
export function getCurrentSeason(): Season {
	const month = tonumber(os.date("!%m"))!;
	if (month >= 3 && month <= 5) return Season.Spring;
	if (month >= 6 && month <= 8) return Season.Summer;
	if (month >= 9 && month <= 11) return Season.Autumn;
	return Season.Winter;
}

// ── NPCs ─────────────────────────────────────────────────────────────────
export const NPC_INTERACTION_RADIUS = 10;
export const NPC_SPAWN_FADE_DURATION = 1.0;
export const NPC_TREAT_COOLDOWN = 120;
export const NPC_DAILY_INTERACTION_BONUS = 10;
export const NPC_STREAMING_RADIUS = 80;
export const CAT_APPROACH_SPEED = 2;
export const PHOTOGRAPHER_POSE_REWARD = 5;
export const OMIKUJI_POINTS = [5, 8, 12, 18, 25]; // 凶→大吉 (5 tiers)

export interface NpcConfig {
	name: string;
	activePhases: TimePhase[];
	spawnPosition: Vector3;
}

export const NPC_REGISTRY: Record<NpcId, NpcConfig> = {
	[NpcId.RamenChef]: {
		name: "Ramen Chef",
		activePhases: [TimePhase.Morning, TimePhase.Daytime, TimePhase.Evening],
		spawnPosition: new Vector3(-120, 4, -550),
	},
	[NpcId.StreetMusician]: {
		name: "Street Musician",
		activePhases: [TimePhase.Evening, TimePhase.Night],
		spawnPosition: new Vector3(-60, 3, -640),
	},
	[NpcId.CatColony]: {
		name: "Stray Cats",
		activePhases: [
			TimePhase.Morning,
			TimePhase.Daytime,
			TimePhase.GoldenHour,
			TimePhase.Evening,
			TimePhase.Night,
			TimePhase.Dawn,
		],
		spawnPosition: new Vector3(100, 45, -300),
	},
	[NpcId.Shopkeeper]: {
		name: "Konbini Clerk",
		activePhases: [TimePhase.Daytime, TimePhase.Evening],
		spawnPosition: new Vector3(-150, 3, -600),
	},
	[NpcId.Photographer]: {
		name: "Night Photographer",
		activePhases: [TimePhase.Night],
		spawnPosition: new Vector3(0, 3, -650),
	},
	[NpcId.DeliveryCyclist]: {
		name: "Delivery Cyclist",
		activePhases: [TimePhase.Daytime, TimePhase.Evening],
		spawnPosition: new Vector3(200, 3, -500),
	},
	[NpcId.ShrineKeeper]: {
		name: "Shrine Maiden",
		activePhases: [TimePhase.Morning, TimePhase.Daytime],
		spawnPosition: new Vector3(-500, 5, -700),
	},
	[NpcId.Busker]: {
		name: "Beatboxer",
		activePhases: [TimePhase.Night],
		spawnPosition: new Vector3(400, 3, -580),
	},
};

// ── Micro-Events ─────────────────────────────────────────────────────────
export const MICRO_EVENT_MIN_INTERVAL = 720; // 12 min
export const MICRO_EVENT_MAX_INTERVAL = 1080; // 18 min
export const EVENT_HISTORY_NO_REPEAT = 2;

// Bon Odori
export const BON_ODORI_RADIUS = 25;
export const BON_ODORI_BPM = 100;
export const BON_ODORI_PERFECT_WINDOW = 0.1; // seconds
export const BON_ODORI_GOOD_WINDOW = 0.2;
export const BON_ODORI_MAX_POINTS = 30;
export const BON_ODORI_PARTICIPATION_POINTS = 5;
export const BON_ODORI_DURATION = 90;

// Food Truck
export const FOOD_TRUCK_JINGLE_RANGE = 200;
export const FOOD_TRUCK_EARLY_BIRD_SLOTS = 8;
export const FOOD_TRUCK_EARLY_BIRD_POINTS = 15;
export const FOOD_TRUCK_LATE_POINTS = 5;
export const FOOD_TRUCK_DURATION = 120;
export const FOOD_TRUCK_COSMETIC_DURATION = 600; // 10 min

// Fireworks
export const FIREWORKS_DURATION = 90;
export const FIREWORKS_VIEWPOINT_REWARD = 8;
export const FIREWORKS_GROUND_REWARD = 3;
export const FIREWORKS_GROUND_PROXIMITY = 40;
export const FIREWORKS_VIEWPOINT_COUNT = 4;

// Street Art
export const STREET_ART_DURATION = 150;
export const STREET_ART_FULL_WATCH_POINTS = 12;
export const STREET_ART_PARTIAL_POINTS = 3;
export const STREET_ART_LAYERS = 10;
export const STREET_ART_WATCH_RADIUS = 20;

// Hachi Obstacle Course
export const OBSTACLE_COURSE_DURATION = 180;
export const OBSTACLE_COURSE_CHECKPOINTS = 8;
export const OBSTACLE_COURSE_COMPLETION_POINTS = 15;
export const OBSTACLE_COURSE_REPEAT_POINTS = 5;

// Golden Hour Event
export const GOLDEN_HOUR_EVENT_CHANCE = 0.4;
export const GOLDEN_HOUR_STAMP_MULTIPLIER = 2;
export const GOLDEN_HOUR_DURATION = 180;

// ── Hachi Ambient ────────────────────────────────────────────────────────
export const AMBIENT_CHECK_INTERVAL = 0.5;
export const MOOD_DECAY_DURATION = 60;
export const SLEEP_IDLE_THRESHOLD = 8;
export const TONGUE_OUT_SPEED_THRESHOLD = 75;
export const HACHI_PAIR_INTERACTION_RADIUS = 8;

// ── Tags (Living Shibuya) ────────────────────────────────────────────────
export const STAMP_SPOT_TAG = "StampSpot";
export const NEON_SIGN_TAG = "NeonSign";
export const LANTERN_TAG = "Lantern";
export const SUN_SHAFT_TAG = "SunShaft";
export const FOOD_STALL_TAG = "FoodStall";
export const WATER_FEATURE_TAG = "WaterFeature";
export const MUSICIAN_TAG = "Musician";
export const FIREWORK_VIEWPOINT_TAG = "FireworkViewpoint";
export const FOOD_TRUCK_SPOT_TAG = "FoodTruckSpot";
export const STREET_ART_WALL_TAG = "StreetArtWall";
export const OBSTACLE_COURSE_SPAWN_TAG = "ObstacleCourseSpawn";
export const BON_ODORI_CENTER_TAG = "BonOdoriCenter";
