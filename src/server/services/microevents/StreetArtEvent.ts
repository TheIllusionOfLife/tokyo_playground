import { Players } from "@rbxts/services";
import {
	STREET_ART_DURATION,
	STREET_ART_FULL_WATCH_POINTS,
	STREET_ART_LAYERS,
	STREET_ART_PARTIAL_POINTS,
	STREET_ART_WATCH_RADIUS,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import { MicroEventId, MissionId } from "shared/types";
import { MissionService } from "../MissionService";
import { PlayerDataService } from "../PlayerDataService";
import { IMicroEvent } from "./MicroEventBase";

type ServerEvents = ReturnType<typeof GlobalEvents.createServer>;

export class StreetArtEvent implements IMicroEvent {
	readonly id = MicroEventId.StreetArt;
	readonly duration = STREET_ART_DURATION;
	private elapsed = 0;
	private finished = false;
	/** Track total watch time per player for full-watch detection. */
	private watchTime = new Map<number, number>();
	private partialVisitors = new Set<number>();
	private readonly watchRadiusSq =
		STREET_ART_WATCH_RADIUS * STREET_ART_WATCH_RADIUS;
	/** Fixed position where the mural is being painted. */
	private readonly artPosition = new Vector3(20, 8, -40);

	constructor(
		private readonly serverEvents: ServerEvents,
		private readonly playerDataService: PlayerDataService,
		private readonly missionService: MissionService,
	) {}

	start() {
		// Art position would be randomized from tagged wall spots in production
	}

	tick(dt: number) {
		this.elapsed += dt;
		if (this.elapsed >= this.duration) {
			this.finished = true;
			return;
		}

		// Progress layer reveal
		const layerProgress = math.floor(
			(this.elapsed / this.duration) * STREET_ART_LAYERS,
		);
		this.serverEvents.microEventProgress.broadcast(this.id, {
			layer: layerProgress,
		});

		// Track watchers
		for (const player of Players.GetPlayers()) {
			const character = player.Character;
			if (!character) continue;
			const hrp = character.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (!hrp) continue;

			const delta = hrp.Position.sub(this.artPosition);
			if (delta.Dot(delta) < this.watchRadiusSq) {
				this.partialVisitors.add(player.UserId);
				const prev = this.watchTime.get(player.UserId) ?? 0;
				this.watchTime.set(player.UserId, prev + dt);
			}
		}
	}

	isFinished(): boolean {
		return this.finished;
	}

	cleanup() {
		const fullWatchThreshold = this.duration * 0.8; // 80% watch time = full

		for (const player of Players.GetPlayers()) {
			const userId = player.UserId;
			const watched = this.watchTime.get(userId) ?? 0;

			if (watched >= fullWatchThreshold) {
				this.playerDataService.addPlayPoints(
					player,
					STREET_ART_FULL_WATCH_POINTS,
				);
				this.missionService.incrementAndNotify(
					player,
					MissionId.WatchStreetArt,
					1,
				);
			} else if (this.partialVisitors.has(userId)) {
				this.playerDataService.addPlayPoints(player, STREET_ART_PARTIAL_POINTS);
			}
		}
		this.watchTime.clear();
		this.partialVisitors.clear();
	}
}
