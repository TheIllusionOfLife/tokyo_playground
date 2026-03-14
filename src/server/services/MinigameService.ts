import { Service } from "@flamework/core";
import { MinigameId } from "shared/types";
import { IMinigame } from "./minigames/MinigameBase";

type ServerEvents = ReturnType<
	typeof import("shared/network").GlobalEvents.createServer
>;

type MinigameFactory = (serverEvents: ServerEvents) => IMinigame;

@Service()
export class MinigameService {
	private registry = new Map<MinigameId, MinigameFactory>();

	register(id: MinigameId, factory: MinigameFactory) {
		this.registry.set(id, factory);
		print(`[MinigameService] Registered: ${id}`);
	}

	create(id: MinigameId, serverEvents: ServerEvents): IMinigame | undefined {
		const factory = this.registry.get(id);
		if (!factory) {
			print(`[MinigameService] No factory registered for: ${id}`);
			return undefined;
		}
		return factory(serverEvents);
	}

	getAvailableMinigames(): MinigameId[] {
		const ids: MinigameId[] = [];
		for (const [id] of this.registry) {
			ids.push(id);
		}
		return ids;
	}

	getRegisteredIds(): MinigameId[] {
		return this.getAvailableMinigames();
	}
}
