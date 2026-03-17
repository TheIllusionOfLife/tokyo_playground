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

/**
 * Fire a hint text broadcast, deduplicating against the last sent value.
 * Returns the new lastRef value to store.
 */
export function fireHintText(
	serverEvents: ServerEvents,
	text: string,
	lastRef: string,
): string {
	if (text === lastRef) return lastRef;
	serverEvents.hintTextChanged.broadcast(text);
	return text;
}
