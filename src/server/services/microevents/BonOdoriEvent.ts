import { CollectionService, Players } from "@rbxts/services";
import {
	BON_ODORI_CENTER_TAG,
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
	private connections: RBXScriptConnection[] = [];
	private centerPos = Vector3.zero;

	constructor(
		private readonly serverEvents: ServerEvents,
		private readonly playerDataService: PlayerDataService,
		private readonly missionService: MissionService,
	) {}

	start() {
		// Find event center for proximity validation
		const centers = CollectionService.GetTagged(BON_ODORI_CENTER_TAG);
		if (centers.size() > 0 && centers[0].IsA("BasePart")) {
			this.centerPos = centers[0].Position;
		}

		// Listen for player hits (fix #1: track connection for cleanup)
		this.connections.push(
			this.serverEvents.bonOdoriHit.connect((player, _direction, accuracy) => {
				if (this.finished) return;

				// Fix #3: server-side proximity check
				const character = player.Character;
				if (!character) return;
				const hrp = character.FindFirstChild("HumanoidRootPart") as
					| BasePart
					| undefined;
				if (!hrp) return;
				const delta = hrp.Position.sub(this.centerPos);
				if (delta.Dot(delta) > this.radiusSq) return;

				this.participated.add(player.UserId);
				const score = this.playerScores.get(player.UserId) ?? 0;
				let points = 0;
				if (accuracy <= BON_ODORI_PERFECT_WINDOW) points = 3;
				else if (accuracy <= BON_ODORI_GOOD_WINDOW) points = 1;
				this.playerScores.set(
					player.UserId,
					math.min(score + points, BON_ODORI_MAX_POINTS),
				);
			}),
		);
	}

	tick(dt: number) {
		this.elapsed += dt;
		if (this.elapsed >= this.duration) {
			this.finished = true;
			return;
		}

		// Send beat notes to nearby players only
		this.beatTimer += dt;
		if (this.beatTimer >= this.beatInterval) {
			this.beatTimer -= this.beatInterval;
			const direction = math.random(0, 3);
			for (const player of Players.GetPlayers()) {
				const character = player.Character;
				if (!character) continue;
				const hrp = character.FindFirstChild("HumanoidRootPart") as
					| BasePart
					| undefined;
				if (!hrp) continue;
				const delta = hrp.Position.sub(this.centerPos);
				if (delta.Dot(delta) <= this.radiusSq) {
					this.serverEvents.bonOdoriNote.fire(player, direction, this.elapsed);
				}
			}
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
