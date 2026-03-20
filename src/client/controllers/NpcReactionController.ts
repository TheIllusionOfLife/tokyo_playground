import { Controller, OnStart } from "@flamework/core";
import { GlobalEvents } from "shared/network";
import { gameStore } from "shared/store/game-store";

/**
 * Client-side NPC reaction handler. Wires spawn/despawn/interaction
 * events. Animations and ambient audio per NPC would be driven here.
 */
@Controller()
export class NpcReactionController implements OnStart {
	private readonly clientEvents = GlobalEvents.createClient({});
	private activeNpcs = new Set<string>();

	onStart() {
		this.clientEvents.npcSpawned.connect((npcId, _position) => {
			this.activeNpcs.add(npcId);
			// Fade-in animation would be played here
		});

		this.clientEvents.npcDespawned.connect((npcId) => {
			this.activeNpcs.delete(npcId);
			// Fade-out animation would be played here
		});

		this.clientEvents.npcInteraction.connect(
			(npcId, interactionType, rewardPoints) => {
				if (rewardPoints > 0) {
					gameStore.pushFeedMessage(
						`${npcId}: ${interactionType} (+${rewardPoints} pts)`,
					);
				}
				// Interaction animations/SFX would be triggered here
			},
		);

		this.clientEvents.omikujiResult.connect(
			(fortune, fortuneJP, _tier, points) => {
				gameStore.pushFeedMessage(
					`Fortune: ${fortuneJP} (${fortune}) +${points} pts`,
				);
			},
		);
	}

	isNpcActive(npcId: string): boolean {
		return this.activeNpcs.has(npcId);
	}
}
