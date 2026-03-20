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

/** Minimum seconds between checkpoints to reject instant-fire cheats (#4). */
const MIN_CHECKPOINT_INTERVAL = 0.5;

interface PlayerCourseState {
	startTime: number;
	lastCheckpoint: number;
	lastCheckpointTime: number;
}

export class ObstacleCourseEvent implements IMicroEvent {
	readonly id = MicroEventId.ObstacleCourse;
	readonly duration = OBSTACLE_COURSE_DURATION;
	private elapsed = 0;
	private finished = false;
	private playerStates = new Map<number, PlayerCourseState>();
	private connections: RBXScriptConnection[] = [];

	constructor(
		private readonly serverEvents: ServerEvents,
		private readonly playerDataService: PlayerDataService,
		private readonly missionService: MissionService,
	) {}

	start() {
		// Fix #1: track connections for cleanup
		this.connections.push(
			this.serverEvents.obstacleCourseCheckpoint.connect(
				(player, checkpointIndex) => {
					if (this.finished) return;

					const userId = player.UserId;
					const now = os.clock();

					if (checkpointIndex === 0) {
						this.playerStates.set(userId, {
							startTime: now,
							lastCheckpoint: 0,
							lastCheckpointTime: now,
						});
						return;
					}

					const state = this.playerStates.get(userId);
					if (!state) return;

					// Validate sequence (no skipping)
					if (checkpointIndex !== state.lastCheckpoint + 1) return;

					// Fix #4: minimum time between checkpoints rejects instant-fire
					if (now - state.lastCheckpointTime < MIN_CHECKPOINT_INTERVAL) return;

					state.lastCheckpoint = checkpointIndex;
					state.lastCheckpointTime = now;
				},
			),
		);

		this.connections.push(
			this.serverEvents.obstacleCourseFinish.connect((player) => {
				if (this.finished) return;

				const userId = player.UserId;
				const state = this.playerStates.get(userId);
				if (!state) return;

				if (state.lastCheckpoint < OBSTACLE_COURSE_CHECKPOINTS - 1) return;

				const elapsed = os.clock() - state.startTime;

				// Fix #4: reject impossibly fast completions
				const minPossibleTime =
					OBSTACLE_COURSE_CHECKPOINTS * MIN_CHECKPOINT_INTERVAL;
				if (elapsed < minPossibleTime) return;

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

				if (isFirstCompletion && !data.badges.includes("ParkourPup")) {
					data.badges.push("ParkourPup");
				}

				this.missionService.incrementAndNotify(
					player,
					MissionId.CompleteObstacleCourse,
					1,
				);

				this.playerStates.delete(userId);
				print(
					`[ObstacleCourseEvent] ${player.Name} finished in ${string.format("%.1f", elapsed)}s`,
				);
			}),
		);
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
		// Fix #1: disconnect all listeners
		for (const conn of this.connections) {
			conn.Disconnect();
		}
		this.connections = [];
		this.playerStates.clear();
	}
}
