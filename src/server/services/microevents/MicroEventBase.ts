import { MicroEventId } from "shared/types";

/**
 * Interface for all micro-events. Each event manages its own
 * lifecycle: start, tick, isFinished, and cleanup.
 */
export interface IMicroEvent {
	readonly id: MicroEventId;
	readonly duration: number;
	start(): void;
	tick(dt: number): void;
	isFinished(): boolean;
	cleanup(): void;
}
