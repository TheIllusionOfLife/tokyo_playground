import { Networking } from "@flamework/networking";
import { GameState } from "shared/types";

interface ServerToClientEvents {
	gameStateChanged(state: GameState): void;
	scoreUpdated(coins: number): void;
}

interface ClientToServerEvents {
	playerReady(): void;
}

export const GlobalEvents = Networking.createEvent<
	ClientToServerEvents,
	ServerToClientEvents
>();
