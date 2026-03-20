import { Controller, OnStart } from "@flamework/core";
import { SoundService, TweenService, Workspace } from "@rbxts/services";
import {
	NPC_SPAWN_FADE_DURATION,
	SE_CAMERA_SHUTTER,
	SE_NPC_TREAT,
	SE_OMIKUJI_DRAW,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import { gameStore } from "shared/store/game-store";

/**
 * Client-side NPC reaction handler. Wires spawn/despawn/interaction
 * events with fade animations, SFX, and feed messages.
 */
@Controller()
export class NpcReactionController implements OnStart {
	private readonly clientEvents = GlobalEvents.createClient({});
	private activeNpcs = new Set<string>();

	onStart() {
		this.clientEvents.npcSpawned.connect((npcId, _position) => {
			this.activeNpcs.add(npcId);
			// Fade-in: find NPC model in Workspace and tween transparency
			const model = Workspace.FindFirstChild(npcId) as Model | undefined;
			if (model) {
				for (const desc of model.GetDescendants()) {
					if (desc.IsA("BasePart")) {
						desc.Transparency = 1;
						TweenService.Create(desc, new TweenInfo(NPC_SPAWN_FADE_DURATION), {
							Transparency: 0,
						}).Play();
					}
				}
			}
		});

		this.clientEvents.npcDespawned.connect((npcId) => {
			this.activeNpcs.delete(npcId);
			// Fade-out: tween transparency to 1 before server destroys
			const model = Workspace.FindFirstChild(npcId) as Model | undefined;
			if (model) {
				for (const desc of model.GetDescendants()) {
					if (desc.IsA("BasePart")) {
						TweenService.Create(desc, new TweenInfo(NPC_SPAWN_FADE_DURATION), {
							Transparency: 1,
						}).Play();
					}
				}
			}
		});

		this.clientEvents.npcInteraction.connect(
			(npcId, interactionType, rewardPoints) => {
				if (rewardPoints > 0) {
					gameStore.pushFeedMessage(
						`${npcId}: ${interactionType} (+${rewardPoints} pts)`,
					);
				}

				// Play SFX based on interaction type
				if (interactionType === "treat") {
					this.playSfx(SE_NPC_TREAT, 0.4);
				} else if (interactionType === "photograph") {
					this.playSfx(SE_CAMERA_SHUTTER, 0.6);
				}
			},
		);

		this.clientEvents.omikujiResult.connect(
			(fortune, fortuneJP, _tier, points) => {
				gameStore.pushFeedMessage(
					`Fortune: ${fortuneJP} (${fortune}) +${points} pts`,
				);
				this.playSfx(SE_OMIKUJI_DRAW, 0.5);
			},
		);
	}

	private playSfx(soundId: string, volume: number) {
		const sound = new Instance("Sound");
		sound.SoundId = soundId;
		sound.Volume = volume;
		sound.Parent = SoundService;
		sound.Play();
		sound.Ended.Once(() => sound.Destroy());
	}

	isNpcActive(npcId: string): boolean {
		return this.activeNpcs.has(npcId);
	}
}
