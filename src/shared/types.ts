export enum GameState {
	Lobby = "Lobby",
	Playing = "Playing",
	Results = "Results",
	Cleanup = "Cleanup",
}

export enum MinigameId {
	CanKick = "CanKick",
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

export interface CanKickPlayerState {
	playerId: number;
	role: PlayerRole;
	isCaught: boolean;
	isInJail: boolean;
	rescueCount: number;
	catchCount: number;
}

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

export interface PlayerData {
	coins: number;
	level: number;
	gamesPlayed: number;
	totalPlayPoints: number;
	gamesWon: number;
}

export const DEFAULT_PLAYER_DATA: PlayerData = {
	coins: 0,
	level: 1,
	gamesPlayed: 0,
	totalPlayPoints: 0,
	gamesWon: 0,
};
