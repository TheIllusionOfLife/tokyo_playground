import {
	ItemId,
	NpcId,
	Season,
	StampSetData,
	StampSetId,
	TimePhase,
} from "shared/types";

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
