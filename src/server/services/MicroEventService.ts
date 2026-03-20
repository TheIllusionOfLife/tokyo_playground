import { OnStart, Service } from "@flamework/core";
import { RunService } from "@rbxts/services";
import {
	EVENT_HISTORY_NO_REPEAT,
	MICRO_EVENT_MAX_INTERVAL,
	MICRO_EVENT_MIN_INTERVAL,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import { GameState, MicroEventId } from "shared/types";
import { DayNightService } from "./DayNightService";
import { GameStateService } from "./GameStateService";
import { MissionService } from "./MissionService";
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

	constructor(
		private readonly gameStateService: GameStateService,
		private readonly dayNightService: DayNightService,
		private readonly playerDataService: PlayerDataService,
		private readonly missionService: MissionService,
	) {}

	onStart() {
		print("[MicroEventService] Started");

		this.nextEventDelay = this.randomInterval();

		// fix H3 + M2: subscribe via callback, not direct DI from GameStateService
		this.gameStateService.registerOnStateChanged((newState, _oldState) => {
			if (newState === GameState.Playing) {
				this.inLobby = false;
				if (this.currentEvent) {
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
				return new BonOdoriEvent(
					this.serverEvents,
					this.playerDataService,
					this.missionService,
				);
			case MicroEventId.FoodTruck:
				return new FoodTruckEvent(
					this.serverEvents,
					this.playerDataService,
					this.missionService,
				);
			case MicroEventId.Fireworks:
				return new FireworksEvent(
					this.serverEvents,
					this.playerDataService,
					this.missionService,
				);
			case MicroEventId.StreetArt:
				return new StreetArtEvent(
					this.serverEvents,
					this.playerDataService,
					this.missionService,
				);
			case MicroEventId.ObstacleCourse:
				return new ObstacleCourseEvent(
					this.serverEvents,
					this.playerDataService,
					this.missionService,
				);
			case MicroEventId.GoldenHour:
				return new GoldenHourEvent(this.serverEvents, this.dayNightService);
			default:
				return undefined;
		}
	}

	private randomInterval(): number {
		return (
			MICRO_EVENT_MIN_INTERVAL +
			math.random() * (MICRO_EVENT_MAX_INTERVAL - MICRO_EVENT_MIN_INTERVAL)
		);
	}
}
