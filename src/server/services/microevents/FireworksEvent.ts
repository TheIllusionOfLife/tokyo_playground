import { CollectionService, Players } from "@rbxts/services";
import {
	FIREWORK_VIEWPOINT_TAG,
	FIREWORKS_DURATION,
	FIREWORKS_GROUND_PROXIMITY,
	FIREWORKS_GROUND_REWARD,
	FIREWORKS_VIEWPOINT_REWARD,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import { MicroEventId, MissionId } from "shared/types";
import { MissionService } from "../MissionService";
import { PlayerDataService } from "../PlayerDataService";
import { IMicroEvent } from "./MicroEventBase";

type ServerEvents = ReturnType<typeof GlobalEvents.createServer>;

export class FireworksEvent implements IMicroEvent {
	readonly id = MicroEventId.Fireworks;
	readonly duration = FIREWORKS_DURATION;
	private elapsed = 0;
	private finished = false;
	private viewpoints: BasePart[] = [];
	private rewarded = new Set<number>();
	private proxCheckAccum = 0;

	constructor(
		private readonly serverEvents: ServerEvents,
		private readonly playerDataService: PlayerDataService,
		private readonly missionService: MissionService,
	) {}

	start() {
		this.viewpoints = CollectionService.GetTagged(
			FIREWORK_VIEWPOINT_TAG,
		).filter((i): i is BasePart => i.IsA("BasePart"));
	}

	tick(dt: number) {
		this.elapsed += dt;
		if (this.elapsed >= this.duration) {
			this.finished = true;
			return;
		}

		// Fix #9: use accumulator instead of modulo (fires once per 3s, not every frame)
		this.proxCheckAccum += dt;
		if (this.proxCheckAccum < 3) return;
		this.proxCheckAccum -= 3;

		const groundProxSq =
			FIREWORKS_GROUND_PROXIMITY * FIREWORKS_GROUND_PROXIMITY;

		for (const player of Players.GetPlayers()) {
			if (this.rewarded.has(player.UserId)) continue;
			const character = player.Character;
			if (!character) continue;
			const hrp = character.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (!hrp) continue;

			let atViewpoint = false;
			for (const vp of this.viewpoints) {
				const delta = hrp.Position.sub(vp.Position);
				if (delta.Dot(delta) < 100) {
					// ~10 studs
					atViewpoint = true;
					break;
				}
			}

			if (atViewpoint) {
				this.rewarded.add(player.UserId);
				this.playerDataService.addPlayPoints(
					player,
					FIREWORKS_VIEWPOINT_REWARD,
				);
			} else {
				// Check ground proximity to any viewpoint
				for (const vp of this.viewpoints) {
					const delta = hrp.Position.sub(vp.Position);
					if (delta.Dot(delta) < groundProxSq) {
						this.rewarded.add(player.UserId);
						this.playerDataService.addPlayPoints(
							player,
							FIREWORKS_GROUND_REWARD,
						);
						break;
					}
				}
			}
		}
	}

	isFinished(): boolean {
		return this.finished;
	}

	cleanup() {
		// Award "First Hanabi" badge
		for (const player of Players.GetPlayers()) {
			if (!this.rewarded.has(player.UserId)) continue;
			const data = this.playerDataService.getPlayerData(player);
			if (data && !data.badges.includes("FirstHanabi")) {
				data.badges.push("FirstHanabi");
			}
			this.missionService.incrementAndNotify(
				player,
				MissionId.WatchFireworks,
				1,
			);
		}
		this.rewarded.clear();
	}
}
