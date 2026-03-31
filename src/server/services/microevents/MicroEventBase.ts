import { MicroEventId } from "shared/types";

/**
 * Micro-event lifecycle interface.
 *
 * MicroEventService drives the lifecycle: start → tick/isFinished loop → cleanup.
 * Each event manages its own connections and state. Unlike minigames, micro-events
 * do not receive a shared Janitor; cleanup is fully self-contained.
 */
export interface IMicroEvent {
	readonly id: MicroEventId;

	/** Suggested maximum duration in seconds. Termination is driven by isFinished(), not this value. */
	readonly duration: number;

	/** Initialize the event: spawn NPCs, create UI, wire connections. */
	start(): void;

	/** Called every tick during the event. Update progress, check interactions. */
	tick(dt: number): void;

	/** Return true when the event should end (before duration cap). */
	isFinished(): boolean;

	/** Tear down all event state: disconnect connections, destroy instances, clear maps. */
	cleanup(): void;
}
