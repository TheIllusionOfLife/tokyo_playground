import { CollectionService, Players } from "@rbxts/services";
import {
	BON_ODORI_CENTER_TAG,
	BON_ODORI_DURATION,
	BON_ODORI_GOOD_WINDOW,
	BON_ODORI_MAX_POINTS,
	BON_ODORI_PARTICIPATION_POINTS,
	BON_ODORI_PERFECT_WINDOW,
	BON_ODORI_RADIUS,
} from "shared/living-shibuya-constants";
import { GlobalEvents } from "shared/network";
import { MicroEventId } from "shared/types";
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
	private centerValid = false;
	private beatCount = 0;
	/** Direction of the current active note. */
	private activeNoteDirection = -1;
	/** Tracks which beat each player last scored on (dedup). */
	private lastHitBeat = new Map<number, number>();

	constructor(
		private readonly serverEvents: ServerEvents,
		private readonly playerDataService: PlayerDataService,
	) {}

	start() {
		const centers = CollectionService.GetTagged(BON_ODORI_CENTER_TAG);
		if (centers.size() > 0 && centers[0].IsA("BasePart")) {
			this.centerPos = centers[0].Position;
			this.centerValid = true;
		} else {
			// No valid center found: abort event immediately
			warn("[BonOdoriEvent] No BonOdoriCenter tag found, aborting");
			this.finished = true;
			return;
		}

		this.connections.push(
			this.serverEvents.bonOdoriHit.connect(
				(player, direction, _clientAccuracy) => {
					if (this.finished) return;

					// Validate direction matches the active note
					if (direction !== this.activeNoteDirection) return;

					// Server-side proximity check
					const character = player.Character;
					if (!character) return;
					const hrp = character.FindFirstChild("HumanoidRootPart") as
						| BasePart
						| undefined;
					if (!hrp) return;
					const delta = hrp.Position.sub(this.centerPos);
					if (delta.Dot(delta) > this.radiusSq) return;

					// Dedup: one hit per player per beat
					const lastBeat = this.lastHitBeat.get(player.UserId) ?? -1;
					if (lastBeat >= this.beatCount) return;
					this.lastHitBeat.set(player.UserId, this.beatCount);

					this.participated.add(player.UserId);

					// Server-side accuracy: min distance to nearest beat edge
					// beatTimer is in [0, beatInterval). Closest beat is either
					// the one that just fired (distance = beatTimer) or the
					// upcoming one (distance = beatInterval - beatTimer).
					const accuracy = math.min(
						this.beatTimer,
						this.beatInterval - this.beatTimer,
					);

					const score = this.playerScores.get(player.UserId) ?? 0;
					let points = 0;
					if (accuracy <= BON_ODORI_PERFECT_WINDOW) points = 3;
					else if (accuracy <= BON_ODORI_GOOD_WINDOW) points = 1;
					this.playerScores.set(
						player.UserId,
						math.min(score + points, BON_ODORI_MAX_POINTS),
					);
				},
			),
		);
	}

	tick(dt: number) {
		this.elapsed += dt;
		if (this.elapsed >= this.duration) {
			this.finished = true;
			return;
		}

		this.beatTimer += dt;
		if (this.beatTimer >= this.beatInterval) {
			this.beatTimer -= this.beatInterval;
			this.beatCount++;
			const direction = math.random(0, 3);
			this.activeNoteDirection = direction;

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
		for (const conn of this.connections) {
			conn.Disconnect();
		}
		this.connections = [];

		for (const player of Players.GetPlayers()) {
			const userId = player.UserId;
			if (!this.participated.has(userId)) continue;

			const score = this.playerScores.get(userId) ?? 0;
			const totalPts = BON_ODORI_PARTICIPATION_POINTS + score;
			this.playerDataService.addPlayPoints(player, totalPts);
		}
		this.playerScores.clear();
		this.participated.clear();
		this.lastHitBeat.clear();
	}
}
