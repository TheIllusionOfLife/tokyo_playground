import { MatchPhase } from "shared/types";

export function getAmbientVolumeForPhase(phase: MatchPhase): number {
	return phase === MatchPhase.InProgress ? 0.01 : 0.03;
}
