import { Players } from "@rbxts/services";
import {
	OBSTACLE_COURSE_CHECKPOINTS,
	OBSTACLE_COURSE_COMPLETION_POINTS,
	OBSTACLE_COURSE_DURATION,
	OBSTACLE_COURSE_REPEAT_POINTS,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import { MicroEventId, MissionId } from "shared/types";
import { MissionService } from "../MissionService";
import { PlayerDataService } from "../PlayerDataService";
import { IMicroEvent } from "./MicroEventBase";

type ServerEvents = ReturnType<typeof GlobalEvents.createServer>;

interface PlayerCourseState {
	/** Timestamp when player hit checkpoint 0 (start gate). */
	startTime: number;
	/** Last completed checkpoint index. */
	lastCheckpoint: number;
}

export class ObstacleCourseEvent implements IMicroEvent {
	readonly id = MicroEventId.ObstacleCourse;
	readonly duration = OBSTACLE_COURSE_DURATION;
	private elapsed = 0;
	private finished = false;
	private playerStates = new Map<number, PlayerCourseState>();

	constructor(
		private readonly serverEvents: ServerEvents,
		private readonly playerDataService: PlayerDataService,
		private readonly missionService: MissionService,
	) {}

	start() {
		// Handle checkpoint events
		this.serverEvents.obstacleCourseCheckpoint.connect(
			(player, checkpointIndex) => {
				if (this.finished) return;

				const userId = player.UserId;
				if (checkpointIndex === 0) {
					// fix H2: server records start time
					this.playerStates.set(userId, {
						startTime: os.clock(),
						lastCheckpoint: 0,
					});
					return;
				}

				const state = this.playerStates.get(userId);
				if (!state) return;

				// Validate checkpoint sequence (must arrive in order, no skipping)
				if (checkpointIndex !== state.lastCheckpoint + 1) return;
				state.lastCheckpoint = checkpointIndex;
			},
		);

		// Handle finish events
		this.serverEvents.obstacleCourseFinish.connect((player) => {
			if (this.finished) return;

			const userId = player.UserId;
			const state = this.playerStates.get(userId);
			if (!state) return;

			// Validate all checkpoints completed
			if (state.lastCheckpoint < OBSTACLE_COURSE_CHECKPOINTS - 1) return;

			// fix H2: server computes elapsed time, ignores any client value
			const elapsed = os.clock() - state.startTime;

			const data = this.playerDataService.getPlayerData(player);
			if (!data) return;

			const isFirstCompletion = data.obstacleBestTime === 0;
			if (data.obstacleBestTime === 0 || elapsed < data.obstacleBestTime) {
				data.obstacleBestTime = elapsed;
			}

			const pts = isFirstCompletion
				? OBSTACLE_COURSE_COMPLETION_POINTS
				: OBSTACLE_COURSE_REPEAT_POINTS;
			this.playerDataService.addPlayPoints(player, pts);

			// "Parkour Pup" badge on first completion
			if (isFirstCompletion && !data.badges.includes("ParkourPup")) {
				data.badges.push("ParkourPup");
			}

			this.missionService.incrementAndNotify(
				player,
				MissionId.CompleteObstacleCourse,
				1,
			);

			// Remove player state so they can restart
			this.playerStates.delete(userId);

			print(
				`[ObstacleCourseEvent] ${player.Name} finished in ${string.format("%.1f", elapsed)}s`,
			);
		});
	}

	tick(dt: number) {
		this.elapsed += dt;
		if (this.elapsed >= this.duration) {
			this.finished = true;
		}
	}

	isFinished(): boolean {
		return this.finished;
	}

	cleanup() {
		this.playerStates.clear();
	}
}
