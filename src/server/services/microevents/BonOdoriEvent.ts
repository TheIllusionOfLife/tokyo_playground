import { Players } from "@rbxts/services";
import {
	BON_ODORI_DURATION,
	BON_ODORI_GOOD_WINDOW,
	BON_ODORI_MAX_POINTS,
	BON_ODORI_PARTICIPATION_POINTS,
	BON_ODORI_PERFECT_WINDOW,
	BON_ODORI_RADIUS,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import { MicroEventId, MissionId } from "shared/types";
import { MissionService } from "../MissionService";
import { PlayerDataService } from "../PlayerDataService";
import { IMicroEvent } from "./MicroEventBase";

type ServerEvents = ReturnType<typeof GlobalEvents.createServer>;

export class BonOdoriEvent implements IMicroEvent {
	readonly id = MicroEventId.BonOdori;
	readonly duration = BON_ODORI_DURATION;
	private elapsed = 0;
	private finished = false;
	private playerScores = new Map<number, number>();
	private participated = new Set<number>();
	private beatTimer = 0;
	private readonly beatInterval = 60 / 100; // 100 BPM
	private readonly radiusSq = BON_ODORI_RADIUS * BON_ODORI_RADIUS;

	constructor(
		private readonly serverEvents: ServerEvents,
		private readonly playerDataService: PlayerDataService,
		private readonly missionService: MissionService,
	) {}

	start() {
		// Listen for player hits
		this.serverEvents.bonOdoriHit.connect((player, _direction, accuracy) => {
			if (this.finished) return;
			this.participated.add(player.UserId);
			const score = this.playerScores.get(player.UserId) ?? 0;
			let points = 0;
			if (accuracy <= BON_ODORI_PERFECT_WINDOW) points = 3;
			else if (accuracy <= BON_ODORI_GOOD_WINDOW) points = 1;
			this.playerScores.set(
				player.UserId,
				math.min(score + points, BON_ODORI_MAX_POINTS),
			);
		});
	}

	tick(dt: number) {
		this.elapsed += dt;
		if (this.elapsed >= this.duration) {
			this.finished = true;
			return;
		}

		// Send beat notes to nearby players
		this.beatTimer += dt;
		if (this.beatTimer >= this.beatInterval) {
			this.beatTimer -= this.beatInterval;
			const direction = math.random(0, 3); // 0=up, 1=right, 2=down, 3=left
			for (const player of Players.GetPlayers()) {
				this.serverEvents.bonOdoriNote.fire(player, direction, this.elapsed);
			}
		}
	}

	isFinished(): boolean {
		return this.finished;
	}

	cleanup() {
		// Distribute rewards
		for (const player of Players.GetPlayers()) {
			const userId = player.UserId;
			if (!this.participated.has(userId)) continue;

			const score = this.playerScores.get(userId) ?? 0;
			const totalPts = BON_ODORI_PARTICIPATION_POINTS + score;
			this.playerDataService.addPlayPoints(player, totalPts);
			this.missionService.incrementAndNotify(
				player,
				MissionId.AttendBonOdori,
				1,
			);
		}
		this.playerScores.clear();
		this.participated.clear();
	}
}
