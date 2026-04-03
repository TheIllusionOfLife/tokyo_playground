/**
 * Phase transition validation. Extracted for testability.
 */
import { MatchPhase } from "shared/types";

export const VALID_TRANSITIONS = new Map<MatchPhase, MatchPhase[]>([
	[MatchPhase.WaitingForPlayers, [MatchPhase.Countdown]],
	[MatchPhase.Countdown, [MatchPhase.Preparing, MatchPhase.WaitingForPlayers]],
	[MatchPhase.Preparing, [MatchPhase.InProgress]],
	[MatchPhase.InProgress, [MatchPhase.RoundOver, MatchPhase.WaitingForPlayers]],
	[MatchPhase.RoundOver, [MatchPhase.Rewarding]],
	[MatchPhase.Rewarding, [MatchPhase.WaitingForPlayers]],
]);

/** Returns true if transitioning from `from` to `to` is allowed. */
export function isValidTransition(from: MatchPhase, to: MatchPhase): boolean {
	if (from === to) return true;
	const targets = VALID_TRANSITIONS.get(from);
	return targets !== undefined && targets.includes(to);
}
