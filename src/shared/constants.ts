import {
	ItemCategory,
	ItemId,
	MinigameId,
	MissionId,
	ShopItemData,
	VehicleId,
} from "shared/types";

// Defaults
export const DEFAULT_WALK_SPEED = 30;
export const CHARACTER_SCALE = 0.5; // half-size characters (makes city feel larger)
export const DEFAULT_JUMP_HEIGHT = 7.2; // standard jump height

// Lobby & Match Flow
export const LOBBY_INTERMISSION = 0;
export const RESULTS_DISPLAY_DURATION = 5;
export const CLEANUP_DURATION = 3;

// Economy
export const BASE_PARTICIPATION_POINTS = 10;
export const WIN_BONUS_POINTS = 25;
export const ONI_CATCH_BONUS = 5;
export const HIDER_RESCUE_BONUS = 15;
export const CAN_KICK_BONUS = 20;
export const LOSS_MULTIPLIER = 0.6;
export const DAILY_LOGIN_BONUS_POINTS = 20;

// Login streak bonuses (index = day in streak, capped at day 7)
export const LOGIN_STREAK_BONUSES = [20, 20, 30, 40, 50, 60, 80, 100];

// First-time reward
export const FIRST_TIME_REWARD_POINTS = 50;

// Lucky spin rewards (index = segment, weighted random)
export const SPIN_REWARDS = [5, 10, 10, 15, 15, 20, 25, 50];

// Friend referral
export const FRIEND_REFERRAL_BONUS = 15;

// Can Kick
export const ONI_CATCH_RADIUS = 10;
export const ONI_MOUNTED_CATCH_RADIUS = 14;
export const CAN_KICK_RADIUS = 10;
export const ONI_COUNT_DURATION = 10;
export const CAN_RELOCATE_INTERVAL = 35;
export const CAN_RATTLE_TARGET = 3;
export const CAN_FREED_SPEED_BOOST = 48;
export const CAN_FREED_SPEED_BOOST_DURATION = 3;

// Cooldowns
export const ACTION_COOLDOWN = 0.5;

// AFK Detection
export const AFK_TIMEOUT = 300; // 5 minutes
export const ACTIVITY_HEARTBEAT_INTERVAL = 60; // client fires every 60s if active

// Leveling — cumulative points needed per level
export const LEVEL_THRESHOLDS: number[] = [
	0, 50, 200, 500, 1000, 1800, 3000, 4500, 7000, 10000,
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
	{ titleKey: string; subtitleKey: string; durationSeconds: number }
> = {
	[MinigameId.CanKick]: {
		titleKey: "intro_can_kick_title",
		subtitleKey: "intro_can_kick_sub",
		durationSeconds: 10,
	},
	[MinigameId.ShibuyaScramble]: {
		titleKey: "intro_scramble_title",
		subtitleKey: "intro_scramble_sub",
		durationSeconds: 10,
	},
	[MinigameId.HachiRide]: {
		titleKey: "intro_hachi_title",
		subtitleKey: "intro_hachi_sub",
		durationSeconds: 10,
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
	[MissionId.CollectBonusItem]: {
		label: "Collect a Bonus Item",
		target: 1,
		pointsReward: 40,
	},
	[MissionId.DodgeCars]: {
		label: "Survive a Car Wave",
		target: 1,
		pointsReward: 35,
	},
	[MissionId.PlayWithFriends]: {
		label: "Play with a Friend",
		target: 1,
		pointsReward: 55,
	},
	[MissionId.PlayAllGames]: {
		label: "Play All 3 Games",
		target: 1,
		pointsReward: 65,
	},
	[MissionId.CatchStreak]: {
		label: "Catch 3 in One Round",
		target: 1,
		pointsReward: 70,
	},
	[MissionId.CollectHachiItems30]: {
		label: "Collect 30 Items on Hachi",
		target: 30,
		pointsReward: 55,
	},
	[MissionId.WinTwoInARow]: {
		label: "Win 2 Games in a Row",
		target: 1,
		pointsReward: 80,
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
	MissionId.CollectHachiItems,
	MissionId.ReachHachiLevel3,
	MissionId.WinHachiRide,
	MissionId.CollectBonusItem,
	MissionId.DodgeCars,
	MissionId.PlayWithFriends,
	MissionId.PlayAllGames,
	MissionId.CatchStreak,
	MissionId.CollectHachiItems30,
	MissionId.WinTwoInARow,
];

/** Minigame-specific missions for daily slot selection. */
export const MINIGAME_MISSION_IDS: MissionId[] = [
	MissionId.KickCan,
	MissionId.SurviveScramble,
	MissionId.TagInScramble,
	MissionId.CollectHachiItems,
	MissionId.ReachHachiLevel3,
	MissionId.WinHachiRide,
	MissionId.CollectBonusItem,
	MissionId.DodgeCars,
	MissionId.PlayAllGames,
	MissionId.CatchStreak,
	MissionId.CollectHachiItems30,
	MissionId.WinTwoInARow,
];

export const SHOP_CATALOG: Omit<ShopItemData, "owned" | "equipped">[] = [
	{
		id: ItemId.HatCone,
		name: "Alley Cone Cap",
		category: ItemCategory.Hat,
		price: 100,
		levelRequired: 1,
	},
	{
		id: ItemId.HatCrown,
		name: "Scramble Crown",
		category: ItemCategory.Hat,
		price: 350,
		levelRequired: 3,
	},
	{
		id: ItemId.HatBucket,
		name: "Station Bucket Hat",
		category: ItemCategory.Hat,
		price: 180,
		levelRequired: 2,
	},
	{
		id: ItemId.TrailStar,
		name: "Neon Paw Trail",
		category: ItemCategory.Trail,
		price: 200,
		levelRequired: 2,
	},
	{
		id: ItemId.TrailRainbow,
		name: "Crossing Lights Trail",
		category: ItemCategory.Trail,
		price: 500,
		levelRequired: 4,
	},
	{
		id: ItemId.TrailFlame,
		name: "Lantern Flame Trail",
		category: ItemCategory.Trail,
		price: 300,
		levelRequired: 3,
	},
	{
		id: ItemId.TrailCherryBlossom,
		name: "Cherry Blossom Trail",
		category: ItemCategory.Trail,
		price: 100,
		levelRequired: 1,
	},
	{
		id: ItemId.TrailMidnightSpark,
		name: "Midnight Spark Trail",
		category: ItemCategory.Trail,
		price: 600,
		levelRequired: 5,
	},
	// Hats (assets now exist)
	{
		id: ItemId.HatKitsuneMask,
		name: "Kitsune Mask",
		category: ItemCategory.Hat,
		price: 400,
		levelRequired: 4,
	},
	{
		id: ItemId.HatTokyoTower,
		name: "Tokyo Tower Cap",
		category: ItemCategory.Hat,
		price: 650,
		levelRequired: 5,
	},
	// Kitsune series
	{
		id: ItemId.KitsuneBack,
		name: "Kitsune Tail",
		category: ItemCategory.Back,
		price: 350,
		levelRequired: 3,
	},
	{
		id: ItemId.KitsuneFace,
		name: "Kitsune Whiskers",
		category: ItemCategory.Face,
		price: 200,
		levelRequired: 2,
	},
	{
		id: ItemId.KitsuneFront,
		name: "Kitsune Omamori",
		category: ItemCategory.Front,
		price: 250,
		levelRequired: 3,
	},
	{
		id: ItemId.KitsuneNeck,
		name: "Shrine Bell Collar",
		category: ItemCategory.Neck,
		price: 300,
		levelRequired: 3,
	},
	{
		id: ItemId.KitsuneShoulder,
		name: "Fox Fire Mantle",
		category: ItemCategory.Shoulder,
		price: 500,
		levelRequired: 4,
	},
	{
		id: ItemId.KitsuneWaist,
		name: "Fox Obi Sash",
		category: ItemCategory.Waist,
		price: 400,
		levelRequired: 4,
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

// Boundary — AABB of city_and_roads with 200-stud padding
export const BOUNDARY_AABB_MIN = new Vector3(-11900, -50, 32400);
export const BOUNDARY_AABB_MAX = new Vector3(-9400, 500, 34500);
export const BOUNDARY_WARNING_RATIO = 0.6; // start warning at 60% toward edge (covers suburb)

// Point of Interest discovery
export const POI_DISCOVERY_POINTS = 10;
export const ALL_POI_ZONES = [
	"ShibuyaSky",
	"ShibuyaCrossing",
	"HachikoSquare",
	"CenterGai",
	"SkySlideHub",
	"Dogenzaka",
	"Hikarie",
	"MiyashitaPark",
	"ShibuyaStation",
];

export const ZONE_TAG = "Zone";
export const ZONE_DEBOUNCE = 30; // seconds before re-showing same zone
export const ZONE_DISPLAY_DURATION = 3; // seconds to show zone popup

export const CAN_KICK_PORTAL_TAG = "CanKickPortal";
export const SCRAMBLE_PORTAL_TAG = "ShibuyaScramblePortal";
export const HACHI_COSTUME_NAME = "HachiCostume";
export const HACHI_RIDE_TAG = "HachiRide";
export const HACHI_RIDE_PORTAL_TAG = "HachiRidePortal";
export const HACHI_SPAWN_TAG = "HachiRideSpawn";

// Hachi Ride tuning
export const HACHI_ROUND_DURATION =
	MINIGAME_CONFIGS[MinigameId.HachiRide].roundDuration;
export const HACHI_STARTING_EVOLUTION = 2; // start with double jump + wall run
export const HACHI_LOBBY_MIN_LEVEL = 3; // lobby Hachi always has double jump + wall run
export const HACHI_EVOLUTION_THRESHOLDS = [0, 10, 24, 40, 60];
// Max air jumps per evolution level (index = level)
// Level 0: 0, Level 1-2: 1 (double), Level 3: 2 (triple), Level 4: 3 (quadruple)
export const HACHI_MAX_AIR_JUMPS = [0, 1, 1, 2, 3];
export const HACHI_WALK_SPEEDS = [70, 70, 70, 70, 70]; // flat speed (no evolution boost for now)
export const HACHI_ITEMS_TO_SPAWN = 800;
export const HACHI_COLLECTION_RADIUS = 14;
export const HACHI_DEFAULT_SCALE = CHARACTER_SCALE; // matches character scale
export const HACHI_BIG_SCALE = 1.5;
export const HACHI_DOUBLE_JUMP_IMPULSE = 106; // same as HACHI_JUMP_VELOCITY
export const HACHI_WALL_RUN_SPEED = 75;
export const HACHI_WALL_RUN_RAYCAST = 3;
export const HACHI_WALL_RUN_MAX_DUR = 3;
export const HACHI_ITEM_POINT_VALUE = 1;
export const HACHI_BONUS_ITEM_COUNT = 50;
export const HACHI_BONUS_ITEM_VALUE = 5;
export const HACHI_ROOFTOP_BONUS_COUNT = 30;
export const HACHI_SKY_DROP_BONUS_COUNT = 20;
export const HACHI_WIN_ITEM_BONUS = 20;
export const HACHI_JUMP_VELOCITY = 106; // 150 * sqrt(0.5) for half jump apex
export const HACHI_JUMP_COOLDOWN = 0.1; // seconds between jump requests
export const HACHI_EJECT_COOLDOWN = 1.0; // seconds between eject requests
export const HACHI_FINAL_SPRINT_WINDOW = 30;
export const HACHI_FINAL_SPRINT_MULTIPLIER = 3;

// Can Kick visual
export const CAN_KICK_RISE = 15; // studs the can flies up
export const CAN_KICK_SPIN = 1080; // degrees of spin
export const CAN_KICK_TWEEN_DURATION = 1.2; // seconds

// Hachi Ride collectible meshes (AI-generated)
export const HACHI_COIN_MESH_ID = "rbxassetid://106160080561432";
export const HACHI_COIN_TEXTURE_ID = "rbxassetid://96453484501646";
export const HACHI_STAR_MESH_ID = "rbxassetid://78058646229827";
export const HACHI_STAR_TEXTURE_ID = "rbxassetid://92501872934670";

// Hachi Ride sky-drop
export const HACHI_SKY_DROP_MIN_Y = 300;
export const HACHI_SKY_DROP_MAX_Y = 400;
export const HACHI_SKY_DROP_FALL_DURATION = 4; // seconds
export const HACHI_SKY_DROP_GROUND_Y = 16;
export const HACHI_SKY_DROP_DENSE_RADIUS = 400; // center-bias radius (wider spread)
export const HACHI_SKY_DROP_CENTER_BIAS = 0.15; // 15% items within dense radius
export const HACHI_SKY_DROP_BUILDING_BIAS = 0.85; // 85% items within building area (0% uniform/suburb)
// Building area bounds (LOD2 parts above Y=30)
export const HACHI_BLDG_MIN_X = -11364;
export const HACHI_BLDG_MAX_X = -9908;
export const HACHI_BLDG_MIN_Z = 32734;
export const HACHI_BLDG_MAX_Z = 34065;
export const HACHI_SKY_DROP_ACTIVE_RATIO = 1.0; // all items fall (distribution now fixed: 30 rooftop + 20 random)
export const HACHI_CITY_CENTER = new Vector3(-10608, 0, 33375);
// DEM bounds (_533935_dem_6697_op_gml)
export const HACHI_CITY_MIN_X = -11679;
export const HACHI_CITY_MAX_X = -9631;
export const HACHI_CITY_MIN_Z = 32634;
export const HACHI_CITY_MAX_Z = 34286;
export const HACHI_ROOFTOP_BONUS_OFFSET_Y = 50;
export const HACHI_ROOFTOP_BUILDINGS: { topY: number; x: number; z: number }[] =
	[
		{ topY: 216.7, x: -10476, z: 33443 },
		{ topY: 187.2, x: -10689, z: 33634 },
		{ topY: 178.3, x: -10362, z: 33374 },
		{ topY: 173.8, x: -10475, z: 33623 },
		{ topY: 172.0, x: -10402, z: 33557 },
		{ topY: 156.0, x: -10833, z: 32873 },
		{ topY: 139.5, x: -10227, z: 33406 },
		{ topY: 137.6, x: -11133, z: 33876 },
		{ topY: 137.1, x: -10466, z: 33710 },
		{ topY: 135.1, x: -9942, z: 33484 },
		{ topY: 129.6, x: -10252, z: 33066 },
		{ topY: 124.4, x: -10938, z: 33638 },
		{ topY: 121.7, x: -10882, z: 33278 },
		{ topY: 116.8, x: -10586, z: 33750 },
		{ topY: 116.2, x: -10956, z: 33046 },
		{ topY: 114.0, x: -10764, z: 33454 },
		{ topY: 112.6, x: -10153, z: 33369 },
		{ topY: 111.6, x: -10752, z: 33093 },
		{ topY: 108.3, x: -10642, z: 33514 },
		{ topY: 101.1, x: -10673, z: 32777 },
		{ topY: 92.4, x: -10183, z: 33494 },
		{ topY: 92.0, x: -11008, z: 33520 },
		{ topY: 91.9, x: -10837, z: 32919 },
		{ topY: 88.1, x: -9982, z: 33037 },
		{ topY: 87.7, x: -9936, z: 33018 },
		{ topY: 87.6, x: -10506, z: 32968 },
		{ topY: 87.2, x: -11048, z: 33626 },
		{ topY: 86.4, x: -10122, z: 33115 },
		{ topY: 85.8, x: -10944, z: 32914 },
		{ topY: 85.7, x: -10081, z: 33148 },
	];

// Shibuya Scramble

export const SCRAMBLE_TAG_RADIUS = 10;
export const SCRAMBLE_MOUNTED_TAG_RADIUS = 14;
export const SCRAMBLE_ONI_COUNT_DURATION = 10;
export const SCRAMBLE_CROWD_WAVE_INTERVAL = 20;
export const SCRAMBLE_CROWD_WAVE_DURATION = 10;
export const SCRAMBLE_CROWD_NPC_COUNT = 12;
export const SCRAMBLE_MAX_ACTIVE_SPIRIT_WAVES = 1;
export const SCRAMBLE_SLIDE_SPEED = 800;
export const SCRAMBLE_SLIDE_COOLDOWN = 8;
export const SCRAMBLE_TAG_BONUS_PER_TAG = 5;
export const SCRAMBLE_SPIRIT_WAVE_DURATION = 5;

// Scramble cars
export const SCRAMBLE_CAR_SPEED_DURATION = 10; // seconds for car tween across road
export const SCRAMBLE_CAR_SPAWN_INTERVAL = 15; // seconds between car waves
export const SCRAMBLE_CAR_WAVE_DURATION = 10; // seconds cars are present (matches tween)
export const SCRAMBLE_CAR_DODGE_RADIUS = 12; // proximity check for dodge mission

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
export const SE_HACHI_JUMP = "rbxassetid://9125402735"; // cute pop bounce
export const HACHI_PAW_DECAL_ID = "rbxassetid://300134974"; // paw print for jump button
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

// ── Vehicle System ──────────────────────────────────────────────────────

export enum AnimProfile {
	Quadruped = "Quadruped",
	Wheeled = "Wheeled",
	Serpentine = "Serpentine",
	Static = "Static",
}

export interface VehicleDef {
	id: VehicleId;
	name: string;
	nameKey: string;
	templateName: string;
	price: number;
	levelRequired: number;
	animProfile: AnimProfile;
	speedScale: number;
	idleAmp: number;
}

export const VEHICLE_CATALOG: VehicleDef[] = [
	{
		id: VehicleId.DefaultHachi,
		name: "Hachi",
		nameKey: "vehicle_hachi",
		templateName: "HachiTemplate",
		price: 0,
		levelRequired: 0,
		animProfile: AnimProfile.Quadruped,
		speedScale: 1.0,
		idleAmp: 0.15,
	},
	{
		id: VehicleId.WhiteCat,
		name: "White Cat",
		nameKey: "vehicle_white_cat",
		templateName: "NekoTemplate",
		price: 0,
		levelRequired: 0,
		animProfile: AnimProfile.Quadruped,
		speedScale: 1.1,
		idleAmp: 0.2,
	},
	{
		id: VehicleId.CalicoCat,
		name: "Calico Cat",
		nameKey: "vehicle_calico_cat",
		templateName: "CalicoCatTemplate",
		price: 300,
		levelRequired: 2,
		animProfile: AnimProfile.Static,
		speedScale: 1.0,
		idleAmp: 0.2,
	},
	{
		id: VehicleId.Kart,
		name: "Kart",
		nameKey: "vehicle_kart",
		templateName: "KartTemplate",
		price: 300,
		levelRequired: 2,
		animProfile: AnimProfile.Wheeled,
		speedScale: 1.0,
		idleAmp: 0.05,
	},
	{
		id: VehicleId.WhiteDragon,
		name: "White Dragon",
		nameKey: "vehicle_white_dragon",
		templateName: "WhiteDragonTemplate",
		price: 800,
		levelRequired: 5,
		animProfile: AnimProfile.Static,
		speedScale: 1.0,
		idleAmp: 0.2,
	},
	{
		id: VehicleId.GreenDragon,
		name: "Green Dragon",
		nameKey: "vehicle_green_dragon",
		templateName: "GreenDragonTemplate",
		price: 600,
		levelRequired: 4,
		animProfile: AnimProfile.Static,
		speedScale: 1.0,
		idleAmp: 0.2,
	},
	{
		id: VehicleId.Tanuki,
		name: "Tanuki",
		nameKey: "vehicle_tanuki",
		templateName: "TanukiTemplate",
		price: 400,
		levelRequired: 3,
		animProfile: AnimProfile.Quadruped,
		speedScale: 0.9,
		idleAmp: 0.2,
	},
	{
		id: VehicleId.ShibaInu,
		name: "Shiba Inu",
		nameKey: "vehicle_shiba",
		templateName: "ShibaInuTemplate",
		price: 200,
		levelRequired: 1,
		animProfile: AnimProfile.Quadruped,
		speedScale: 1.0,
		idleAmp: 0.15,
	},
	{
		id: VehicleId.Kitsune,
		name: "Kitsune",
		nameKey: "vehicle_kitsune",
		templateName: "KitsuneTemplate",
		price: 600,
		levelRequired: 4,
		animProfile: AnimProfile.Quadruped,
		speedScale: 1.15,
		idleAmp: 0.12,
	},
	{
		id: VehicleId.Daruma,
		name: "Daruma",
		nameKey: "vehicle_daruma",
		templateName: "DarumaTemplate",
		price: 500,
		levelRequired: 3,
		animProfile: AnimProfile.Static,
		speedScale: 1.0,
		idleAmp: 0.3,
	},
	{
		id: VehicleId.ManekiNeko,
		name: "Maneki-neko",
		nameKey: "vehicle_maneki",
		templateName: "ManekiNekoTemplate",
		price: 700,
		levelRequired: 4,
		animProfile: AnimProfile.Static,
		speedScale: 1.0,
		idleAmp: 0.2,
	},
];

// Living Shibuya constants moved to shared/living-shibuya-constants.ts
