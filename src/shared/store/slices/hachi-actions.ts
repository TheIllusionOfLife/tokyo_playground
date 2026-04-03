/**
 * Hachi vehicle store actions.
 * Covers: costume, item count, evolution, race state, field items.
 */
import { HachiRaceStateData } from "shared/types";
import { GameStoreState } from "../game-store-types";

export const hachiInitialState = {
	hachiCostumed: false,
	hachiItemCount: 0,
	hachiEvolutionLevel: 0,
	hachiRaceState: undefined as HachiRaceStateData | undefined,
	hachiFieldRegular: 0,
	hachiFieldRegularTotal: 0,
	hachiFieldBonus: 0,
	hachiFieldBonusTotal: 0,
};

export const hachiActions = {
	setHachiCostumed: (state: GameStoreState, hachiCostumed: boolean) => ({
		...state,
		hachiCostumed,
	}),
	setHachiItemCount: (state: GameStoreState, hachiItemCount: number) => ({
		...state,
		hachiItemCount,
	}),
	setHachiEvolutionLevel: (
		state: GameStoreState,
		hachiEvolutionLevel: number,
	) => ({
		...state,
		hachiEvolutionLevel,
	}),
	setHachiRaceState: (
		state: GameStoreState,
		hachiRaceState: HachiRaceStateData | undefined,
	) => ({
		...state,
		hachiRaceState,
	}),
	setHachiFieldItems: (
		state: GameStoreState,
		remainingRegular: number,
		totalRegular: number,
		remainingBonus: number,
		totalBonus: number,
	) => ({
		...state,
		hachiFieldRegular: remainingRegular,
		hachiFieldRegularTotal: totalRegular,
		hachiFieldBonus: remainingBonus,
		hachiFieldBonusTotal: totalBonus,
	}),
};
