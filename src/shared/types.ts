export enum GameState {
	Lobby = "Lobby",
	Playing = "Playing",
	Results = "Results",
	Cleanup = "Cleanup",
}

// ── Living Shibuya Enums ─────────────────────────────────────────────────

export enum TimePhase {
	Morning = "Morning",
	Daytime = "Daytime",
	GoldenHour = "GoldenHour",
	Evening = "Evening",
	Night = "Night",
	Dawn = "Dawn",
}

export enum Season {
	Spring = "Spring",
	Summer = "Summer",
	Autumn = "Autumn",
	Winter = "Winter",
}

export enum NpcId {
	RamenChef = "RamenChef",
	StreetMusician = "StreetMusician",
	CatColony = "CatColony",
	Shopkeeper = "Shopkeeper",
	Photographer = "Photographer",
	DeliveryCyclist = "DeliveryCyclist",
	ShrineKeeper = "ShrineKeeper",
	Busker = "Busker",
}

export enum MicroEventId {
	BonOdori = "BonOdori",
	FoodTruck = "FoodTruck",
	Fireworks = "Fireworks",
	StreetArt = "StreetArt",
	ObstacleCourse = "ObstacleCourse",
	GoldenHour = "GoldenHour",
}

export enum HachiMood {
	Happy = "Happy",
	Relaxed = "Relaxed",
	Excited = "Excited",
	Sleepy = "Sleepy",
}

export enum StampSetId {
	BackAlley = "BackAlley",
	Rooftop = "Rooftop",
	NightShibuya = "NightShibuya",
	ShrinePath = "ShrinePath",
	Station = "Station",
	GoldenMoments = "GoldenMoments",
	Seasonal = "Seasonal",
	CompleteRally = "CompleteRally",
}

export enum MinigameId {
	CanKick = "CanKick",
	ShibuyaScramble = "ShibuyaScramble",
	HachiRide = "HachiRide",
}

export enum PlayerRole {
	None = "None",
	Oni = "Oni",
	Hider = "Hider",
	Spectator = "Spectator",
}

export enum MatchPhase {
	WaitingForPlayers = "WaitingForPlayers",
	Countdown = "Countdown",
	Preparing = "Preparing",
	InProgress = "InProgress",
	RoundOver = "RoundOver",
	Rewarding = "Rewarding",
}

export enum RoundResult {
	OniWins = "OniWins",
	HidersWin = "HidersWin",
	TimerExpired = "TimerExpired",
}

export type LeaderboardTab = "allTime" | "weeklyHachi";

export enum MissionId {
	PlayGames = "PlayGames",
	WinAsOni = "WinAsOni",
	WinAsHider = "WinAsHider",
	CatchPlayers = "CatchPlayers",
	RescueTeammates = "RescueTeammates",
	KickCan = "KickCan",
	EarnPoints = "EarnPoints",
	SurviveScramble = "SurviveScramble",
	TagInScramble = "TagInScramble",

	CollectHachiItems = "CollectHachiItems",
	ReachHachiLevel3 = "ReachHachiLevel3",
	WinHachiRide = "WinHachiRide",
	CollectBonusItem = "CollectBonusItem",
	DodgeCars = "DodgeCars",
	PlayWithFriends = "PlayWithFriends",
	PlayAllGames = "PlayAllGames",
	CatchStreak = "CatchStreak",
	CollectHachiItems30 = "CollectHachiItems30",
	WinTwoInARow = "WinTwoInARow",
}

export enum VehicleId {
	DefaultHachi = "DefaultHachi",
	WhiteCat = "WhiteCat",
	CalicoCat = "CalicoCat",
	Kart = "Kart",
	WhiteDragon = "WhiteDragon",
	GreenDragon = "GreenDragon",
	Bear = "Bear",
	ShibaInu = "ShibaInu",
	Kitsune = "Kitsune",
	ToyCar = "ToyCar",
	ManekiNeko = "ManekiNeko",
	ShibuyaBus = "ShibuyaBus",
	Rickshaw = "Rickshaw",
	Skateboard = "Skateboard",
	Onigiri = "Onigiri",
	Shinkansen = "Shinkansen",
}

export enum ItemId {
	HatCone = "HatCone",
	HatCrown = "HatCrown",
	HatBucket = "HatBucket",
	TrailStar = "TrailStar",
	TrailRainbow = "TrailRainbow",
	TrailFlame = "TrailFlame",
	// New shop items
	TrailCherryBlossom = "TrailCherryBlossom",
	TrailMidnightSpark = "TrailMidnightSpark",
	// Kitsune series (+ hats with assets)
	HatKitsuneMask = "HatKitsuneMask",
	HatTokyoTower = "HatTokyoTower",
	KitsuneBack = "KitsuneBack",
	KitsuneFace = "KitsuneFace",
	KitsuneFront = "KitsuneFront",
	KitsuneNeck = "KitsuneNeck",
	KitsuneShoulder = "KitsuneShoulder",
	KitsuneWaist = "KitsuneWaist",
	// Living Shibuya stamp set rewards
	HatAlleyCatEars = "HatAlleyCatEars",
	TrailCloudWalk = "TrailCloudWalk",
	HatNeonVisor = "HatNeonVisor",
	TrailTrainSpark = "TrailTrainSpark",
	HatSunsetCrown = "HatSunsetCrown",
	SkinGoldenHachi = "SkinGoldenHachi",
}

export enum ItemCategory {
	Hat = "Hat",
	Trail = "Trail",
	Back = "Back",
	Face = "Face",
	Front = "Front",
	Neck = "Neck",
	Shoulder = "Shoulder",
	Waist = "Waist",
}

export interface CanKickPlayerState {
	minigameId: MinigameId.CanKick;
	playerId: number;
	role: PlayerRole;
	isCaught: boolean;
	isInJail: boolean;
	rescueCount: number;
	catchCount: number;
	canKickCount: number;
}

export interface ShibuyaScramblePlayerState {
	minigameId: MinigameId.ShibuyaScramble;
	playerId: number;
	role: PlayerRole;
	isTagged: boolean;
	catchCount: number;
	rescueCount: number;
	carWavesSurvived: number;
}

export interface HachiRidePlayerState {
	minigameId: MinigameId.HachiRide;
	playerId: number;
	role: PlayerRole;
	itemCount: number;
	evolutionLevel: number;
	catchCount: number;
	rescueCount: number;
}

export type AnyPlayerState =
	| CanKickPlayerState
	| ShibuyaScramblePlayerState
	| HachiRidePlayerState;

export interface MatchState {
	matchId: string;
	minigameId: MinigameId;
	phase: MatchPhase;
	timeRemaining: number;
	roundResult?: RoundResult;
}

export interface RewardBreakdown {
	baseReward: number;
	winBonus: number;
	roleBonus: number;
	rescueBonus: number;
	totalPoints: number;
}

export interface ScoreboardEntry {
	playerName: string;
	role: PlayerRole;
	catches: number;
	rescues: number;
	points: number;
}

export interface QueueStatusData {
	featuredMinigameId: MinigameId;
	secondsUntilStart: number;
	joinedPlayerCount: number;
	autoStartEnabled: boolean;
}

export interface RoundIntroData {
	title: string;
	subtitle: string;
	durationSeconds: number;
}

export interface FeaturedUnlockData {
	name: string;
	description: string;
	progressCurrent: number;
	progressTarget: number;
}

export interface HachiRaceStateData {
	playerRank: number;
	leaderName: string;
	leaderScore: number;
	nextThreshold: number;
}

export interface MissionProgressData {
	id: MissionId;
	label: string;
	progress: number;
	target: number;
	pointsReward: number;
	rewardCollected: boolean;
}

export interface MissionSlot {
	id: MissionId;
	progress: number;
	rewardCollected: boolean;
}

export interface PlayerMissions {
	slots: MissionSlot[];
	lastResetDay: number;
}

export interface ShopItemData {
	id: ItemId;
	name: string;
	category: ItemCategory;
	price: number;
	levelRequired: number;
	owned: boolean;
	equipped: boolean;
}

export interface VehicleShopData {
	id: VehicleId;
	name: string;
	price: number;
	levelRequired: number;
	owned: boolean;
	equipped: boolean;
}

// ── Living Shibuya Interfaces ────────────────────────────────────────────

export interface StampSpotData {
	stampId: string;
	stampSet: StampSetId;
	displayName: string;
	displayNameJP: string;
	difficulty: number;
	requiredHachiLevel: number;
	seasonOnly?: Season;
	timeOnly?: TimePhase;
}

export interface StampSetData {
	setId: StampSetId;
	stampIds: string[];
	rewardItemId: ItemId;
	displayName: string;
}

export interface MicroEventData {
	eventId: string;
	location?: Vector3;
	extraData?: unknown;
}

export interface NpcInteractionData {
	npcId: string;
	interactionType: string;
	rewardPoints: number;
}

export interface PlayerData {
	coins: number;
	level: number;
	gamesPlayed: number;
	totalPlayPoints: number;
	gamesWon: number;
	missions: PlayerMissions;
	ownedItems: ItemId[];
	equippedItems: Partial<Record<ItemCategory, ItemId>>;
	shopBalance: number;
	streakCount: number;
	// Living Shibuya: Stamp Rally
	discoveredStamps: string[];
	maxHachiLevel: number;
	// Living Shibuya: NPC Interactions
	lastOmikujiDay: number;
	npcFirstInteractions: string[];
	lastNpcInteractionDay: number;
	// Living Shibuya: Micro-Events
	badges: string[];
	obstacleBestTime: number;
	// Daily login
	lastLoginDay: number;
	// Point of Interest discovery (replaces stamps)
	discoveredPoi: string[];
	poiClaimedRewards: string[];
	// Engagement
	loginStreak: number;
	lastSpinDay: number;
	firstTimeRewardClaimed: boolean;
	// Vehicles
	equippedVehicle: VehicleId;
	ownedVehicles: VehicleId[];
	// Cumulative stats (for badges)
	totalCanKicks: number;
	totalRescues: number;
	totalCatches: number;
	totalWallRuns: number;
	missionsCompleted: number;
}

export const DEFAULT_PLAYER_DATA: PlayerData = {
	coins: 0,
	level: 1,
	gamesPlayed: 0,
	totalPlayPoints: 0,
	gamesWon: 0,
	missions: { slots: [], lastResetDay: 0 },
	ownedItems: [],
	equippedItems: {},
	shopBalance: 0,
	streakCount: 0,
	// Living Shibuya defaults
	discoveredStamps: [],
	maxHachiLevel: 0,
	lastOmikujiDay: 0,
	npcFirstInteractions: [],
	lastNpcInteractionDay: 0,
	badges: [],
	obstacleBestTime: 0,
	lastLoginDay: 0,
	discoveredPoi: [],
	poiClaimedRewards: [],
	loginStreak: 0,
	lastSpinDay: 0,
	firstTimeRewardClaimed: false,
	equippedVehicle: VehicleId.DefaultHachi,
	ownedVehicles: [VehicleId.DefaultHachi],
	totalCanKicks: 0,
	totalRescues: 0,
	totalCatches: 0,
	totalWallRuns: 0,
	missionsCompleted: 0,
};
