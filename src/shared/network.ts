import { Networking } from "@flamework/networking";

interface ServerToClientEvents {
	gameStateChanged(state: string): void;
	scoreUpdated(coins: number): void;
}

interface ClientToServerEvents {
	playerReady(): void;
}

export const GlobalEvents = Networking.createEvent<
	ClientToServerEvents,
	ServerToClientEvents
>();
