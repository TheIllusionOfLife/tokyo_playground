import { OnStart, Service } from "@flamework/core";
import { Players, RunService } from "@rbxts/services";
import {
	EVENT_HISTORY_NO_REPEAT,
	MICRO_EVENT_MAX_INTERVAL,
	MICRO_EVENT_MIN_INTERVAL,
} from "shared/living-shibuya-constants";
import { GlobalEvents } from "shared/network";
import { GameState, MicroEventId } from "shared/types";
import { AnalyticsService } from "./AnalyticsService";
import { DayNightService } from "./DayNightService";
import { EconomyService } from "./EconomyService";
import { GameStateService } from "./GameStateService";
import { BonOdoriEvent } from "./microevents/BonOdoriEvent";
import { FireworksEvent } from "./microevents/FireworksEvent";
import { FoodTruckEvent } from "./microevents/FoodTruckEvent";
import { GoldenHourEvent } from "./microevents/GoldenHourEvent";
import { IMicroEvent } from "./microevents/MicroEventBase";
import { ObstacleCourseEvent } from "./microevents/ObstacleCourseEvent";
import { StreetArtEvent } from "./microevents/StreetArtEvent";
import { PlayerDataService } from "./PlayerDataService";

/**
 * Schedules and manages spontaneous micro-events during lobby phase.
 * Events run one at a time, with randomized intervals and no-repeat
 * history. Cleanly stops current event when a match begins (fix H3).
 */
@Service()
export class MicroEventService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});
	private currentEvent?: IMicroEvent;
	private timeSinceLastEvent = 0;
	private nextEventDelay = 0;
	private eventHistory: MicroEventId[] = [];
	private inLobby = true;
	private eventStartTime = 0;

	constructor(
		private readonly gameStateService: GameStateService,
		private readonly dayNightService: DayNightService,
		private readonly economyService: EconomyService,
		private readonly playerDataService: PlayerDataService,
		private readonly analyticsService: AnalyticsService,
	) {}

	onStart() {
		print("[MicroEventService] Started");

		this.nextEventDelay = this.randomInterval();

		// fix H3 + M2: subscribe via callback, not direct DI from GameStateService
		this.gameStateService.registerOnStateChanged((newState, _oldState) => {
			if (newState === GameState.Playing) {
				this.inLobby = false;
				if (this.currentEvent) {
					this.fireEventAnalytics(this.currentEvent.id, false);
					this.currentEvent.cleanup();
					this.serverEvents.microEventEnded.broadcast(this.currentEvent.id);
					this.currentEvent = undefined;
				}
			} else if (newState === GameState.Lobby) {
				this.inLobby = true;
				this.timeSinceLastEvent = 0;
				this.nextEventDelay = this.randomInterval();
			}
		});

		RunService.Heartbeat.Connect((dt) => this.tick(dt));
	}

	private tick(dt: number) {
		if (!this.inLobby) return;

		// Tick active event
		if (this.currentEvent) {
			this.currentEvent.tick(dt);
			if (this.currentEvent.isFinished()) {
				this.fireEventAnalytics(this.currentEvent.id, true);
				this.currentEvent.cleanup();
				this.serverEvents.microEventEnded.broadcast(this.currentEvent.id);
				print(`[MicroEventService] Event ended: ${this.currentEvent.id}`);
				this.currentEvent = undefined;
				this.timeSinceLastEvent = 0;
				this.nextEventDelay = this.randomInterval();
			}
			return;
		}

		// Schedule next event
		this.timeSinceLastEvent += dt;
		if (this.timeSinceLastEvent >= this.nextEventDelay) {
			this.startRandomEvent();
		}
	}

	private startRandomEvent() {
		const eventId = this.selectEvent();
		if (!eventId) return;

		const evt = this.createEvent(eventId);
		if (!evt) return;

		this.currentEvent = evt;
		this.eventStartTime = os.clock();
		this.eventHistory.push(eventId);
		if (this.eventHistory.size() > EVENT_HISTORY_NO_REPEAT * 2) {
			this.eventHistory = this.eventHistory.filter(
				(_, i) => i >= this.eventHistory.size() - EVENT_HISTORY_NO_REPEAT,
			);
		}

		evt.start();
		this.serverEvents.microEventStarted.broadcast(eventId, evt.duration, {
			eventId,
		});
		print(`[MicroEventService] Event started: ${eventId}`);
	}

	private selectEvent(): MicroEventId | undefined {
		const all = [
			MicroEventId.BonOdori,
			MicroEventId.FoodTruck,
			MicroEventId.Fireworks,
			MicroEventId.StreetArt,
			MicroEventId.ObstacleCourse,
		];

		// GoldenHour is triggered by phase change, not random scheduling
		const recent = this.eventHistory.filter(
			(_, i) => i >= this.eventHistory.size() - EVENT_HISTORY_NO_REPEAT,
		);

		const candidates = all.filter((id) => !recent.includes(id));
		if (candidates.size() === 0) return all[math.random(0, all.size() - 1)];
		return candidates[math.random(0, candidates.size() - 1)];
	}

	private createEvent(eventId: MicroEventId): IMicroEvent | undefined {
		switch (eventId) {
			case MicroEventId.BonOdori:
				return new BonOdoriEvent(this.serverEvents, this.economyService);
			case MicroEventId.FoodTruck:
				return new FoodTruckEvent(this.serverEvents, this.economyService);
			case MicroEventId.Fireworks:
				return new FireworksEvent(this.economyService, this.playerDataService);
			case MicroEventId.StreetArt:
				return new StreetArtEvent(this.serverEvents, this.economyService);
			case MicroEventId.ObstacleCourse:
				return new ObstacleCourseEvent(
					this.serverEvents,
					this.economyService,
					this.playerDataService,
				);
			case MicroEventId.GoldenHour:
				return new GoldenHourEvent(this.serverEvents, this.dayNightService);
			default:
				return undefined;
		}
	}

	private fireEventAnalytics(
		eventId: MicroEventId,
		completedNormally: boolean,
	) {
		const durationSeconds = os.clock() - this.eventStartTime;
		this.analyticsService.fire({
			name: "micro_event_completed",
			eventId,
			participantCount: Players.GetPlayers().size(),
			durationSeconds: math.floor(durationSeconds),
			completedNormally,
		});
	}

	private randomInterval(): number {
		return (
			MICRO_EVENT_MIN_INTERVAL +
			math.random() * (MICRO_EVENT_MAX_INTERVAL - MICRO_EVENT_MIN_INTERVAL)
		);
	}
}
