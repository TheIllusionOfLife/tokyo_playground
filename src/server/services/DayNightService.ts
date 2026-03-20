import { OnStart, Service } from "@flamework/core";
import { RunService } from "@rbxts/services";
import {
	DAY_CYCLE_MINUTES,
	LIGHTING_PROFILES,
	TIME_SYNC_INTERVAL,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import { GameState, TimePhase } from "shared/types";
import { GameStateService } from "./GameStateService";

/**
 * Manages the server-authoritative day/night clock (0..DAY_CYCLE_MINUTES).
 * Broadcasts phase changes and periodic time syncs to all clients.
 * During matches, sends a lighting override so matches use fixed lighting.
 */
@Service()
export class DayNightService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});
	private serverClock = 0; // minutes, 0..DAY_CYCLE_MINUTES
	private currentPhase = TimePhase.Morning;
	private lastSyncTime = 0;
	private paused = false;

	/** Optional event-level override (e.g. GoldenHour micro-event). */
	private eventLightingOverride?: (typeof LIGHTING_PROFILES)[TimePhase];

	constructor(private readonly gameStateService: GameStateService) {}

	onStart() {
		print("[DayNightService] Started");

		// Subscribe to state changes via callback pattern (fix M2)
		this.gameStateService.registerOnStateChanged((newState, _oldState) => {
			if (newState === GameState.Playing) {
				this.paused = true;
				this.serverEvents.lightingOverride.broadcast("match");
			} else if (newState === GameState.Lobby) {
				this.paused = false;
				this.serverEvents.lightingOverride.broadcast("cycle");
			}
		});

		// Heartbeat drives the clock
		RunService.Heartbeat.Connect((dt) => this.tick(dt));
	}

	private tick(dt: number) {
		if (this.paused) return;

		// Advance clock (dt is in seconds, convert to minutes)
		this.serverClock += dt / 60;
		if (this.serverClock >= DAY_CYCLE_MINUTES) {
			this.serverClock -= DAY_CYCLE_MINUTES;
		}

		// Check phase transition
		const newPhase = this.computePhase(this.serverClock);
		if (newPhase !== this.currentPhase) {
			this.currentPhase = newPhase;
			const normalized = this.serverClock / DAY_CYCLE_MINUTES;
			this.serverEvents.timeOfDayChanged.broadcast(newPhase, normalized);
			print(`[DayNightService] Phase → ${newPhase}`);
		}

		// Periodic time sync for drift correction
		this.lastSyncTime += dt;
		if (this.lastSyncTime >= TIME_SYNC_INTERVAL) {
			this.lastSyncTime = 0;
			this.serverEvents.timeSync.broadcast(this.serverClock);
		}
	}

	/**
	 * Maps server clock (minutes) to TimePhase.
	 * Morning 0-4, Daytime 4-10, GoldenHour 10-12, Evening 12-15, Night 15-19, Dawn 19-20
	 */
	private computePhase(clock: number): TimePhase {
		if (clock < 4) return TimePhase.Morning;
		if (clock < 10) return TimePhase.Daytime;
		if (clock < 12) return TimePhase.GoldenHour;
		if (clock < 15) return TimePhase.Evening;
		if (clock < 19) return TimePhase.Night;
		return TimePhase.Dawn;
	}

	getCurrentPhase(): TimePhase {
		return this.currentPhase;
	}

	getServerClock(): number {
		return this.serverClock;
	}

	/**
	 * Called by MicroEventService to apply enhanced lighting during events
	 * (fix H1). Pass undefined to clear the override.
	 */
	setEventLightingOverride(
		profile: (typeof LIGHTING_PROFILES)[TimePhase] | undefined,
	) {
		this.eventLightingOverride = profile;
		if (profile) {
			this.serverEvents.lightingOverride.broadcast("event");
		} else {
			this.serverEvents.lightingOverride.broadcast("cycle");
		}
	}

	getEventLightingOverride() {
		return this.eventLightingOverride;
	}

	/** Send current state to a late-joining player. */
	syncPlayer(player: Player) {
		this.serverEvents.timeSync.fire(player, this.serverClock);
		const normalized = this.serverClock / DAY_CYCLE_MINUTES;
		this.serverEvents.timeOfDayChanged.fire(
			player,
			this.currentPhase,
			normalized,
		);
		if (this.paused) {
			this.serverEvents.lightingOverride.fire(player, "match");
		}
	}
}
