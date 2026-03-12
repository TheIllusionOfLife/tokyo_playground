import { Janitor } from "@rbxts/janitor";
import {
	CanKickPlayerState,
	MinigameId,
	PlayerRole,
	RoundResult,
} from "shared/types";

export interface IMinigame {
	readonly id: MinigameId;
	prepare(players: Player[], matchJanitor: Janitor): void;
	assignRoles(players: Player[]): Map<Player, PlayerRole>;
	startRound(): void;
	tick(dt: number): void;
	checkWinCondition(): RoundResult | undefined;
	getPlayerStates(): Map<number, CanKickPlayerState>;
	cleanup(): void;
	handleCatchRequest?(player: Player): void;
	handleKickCanRequest?(player: Player): boolean | undefined;
	removePlayer?(userId: number): void;
	stopCountdown?(): void;
}
