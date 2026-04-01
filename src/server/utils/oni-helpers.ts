import { GlobalEvents } from "shared/network";
import { PlayerRole } from "shared/types";

type ServerEvents = ReturnType<typeof GlobalEvents.createServer>;

interface OniPlayerState {
	role: PlayerRole;
}

/**
 * Starts the Oni counting countdown. Returns the spawned thread so the caller
 * can cancel it via stopOniCountdown.
 */
export function startOniCountdown(
	serverEvents: ServerEvents,
	duration: number,
	onComplete: () => void,
): thread {
	return task.spawn(() => {
		for (let i = duration; i >= 1; i--) {
			serverEvents.countdownTick.broadcast(i);
			task.wait(1);
		}
		serverEvents.countdownTick.broadcast(0);
		onComplete();
	});
}

/**
 * Stops the Oni counting countdown immediately, clears the overlay,
 * and restores Oni WalkSpeed.
 */
export function stopOniCountdown(
	countdownThread: thread | undefined,
	serverEvents: ServerEvents,
	playerStates: Map<number, OniPlayerState>,
	playerObjects: Map<number, Player>,
	walkSpeed: number,
): void {
	serverEvents.countdownTick.broadcast(0);
	if (countdownThread) {
		task.cancel(countdownThread);
	}
	for (const [userId, state] of playerStates) {
		if (state.role !== PlayerRole.Oni) continue;
		const player = playerObjects.get(userId);
		if (!player?.Character) continue;
		const humanoid = player.Character.FindFirstChildOfClass("Humanoid");
		if (humanoid) humanoid.WalkSpeed = walkSpeed;
	}
}

/** Per-hint-key lock map: prevents gameplay hints from overwriting instructional hints. */
const hintLockMap = new Map<string, number>();

/**
 * Fire a hint text broadcast, deduplicating against the last sent value.
 * When `lockDuration` is provided, the hint establishes a lock window during
 * which non-locking hints are suppressed (e.g. instructional hints persist
 * for 3 seconds even if gameplay hints fire).
 * Returns the new lastRef value to store.
 */
export function fireHintText(
	serverEvents: ServerEvents,
	text: string,
	lastRef: string,
	args?: string[],
	lockDuration?: number,
): string {
	const dedupKey = args ? `${text}:${args.join(",")}` : text;

	// If this is NOT a locking call, check if any active lock suppresses it
	if (lockDuration === undefined) {
		const now = os.clock();
		let suppressed = false;
		const expiredKeys: string[] = [];
		for (const [key, lockUntil] of hintLockMap) {
			if (now < lockUntil) {
				suppressed = true;
			} else {
				expiredKeys.push(key);
			}
		}
		// Clean up expired locks (safe: not mutating during iteration)
		for (const key of expiredKeys) {
			hintLockMap.delete(key);
		}
		if (suppressed) return lastRef;
	}

	// Set lock if requested
	if (lockDuration !== undefined) {
		hintLockMap.set(dedupKey, os.clock() + lockDuration);
	}

	if (dedupKey === lastRef) return lastRef;
	serverEvents.hintTextChanged.broadcast(text, args);
	return dedupKey;
}
