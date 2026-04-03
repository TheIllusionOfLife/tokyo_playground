/**
 * Game store — single Reflex producer with actions organized into slices.
 *
 * The state shape is flat (no nesting) so all existing useSelector calls
 * continue to work unchanged. Only the action/state definitions are split
 * into bounded-context modules for maintainability.
 */
import { createProducer } from "@rbxts/reflex";
import { GameStoreState } from "./game-store-types";
import { economyActions, economyInitialState } from "./slices/economy-actions";
import { feedActions, feedInitialState } from "./slices/feed-actions";
import { hachiActions, hachiInitialState } from "./slices/hachi-actions";
import {
	livingCityActions,
	livingCityInitialState,
} from "./slices/living-city-actions";
import { matchActions, matchInitialState } from "./slices/match-actions";

// Re-export types so existing imports from "shared/store/game-store" keep working
export type { FeedMessage, GameStoreState } from "./game-store-types";

const initialState: GameStoreState = {
	...matchInitialState,
	...economyInitialState,
	...hachiInitialState,
	...livingCityInitialState,
	...feedInitialState,
};

export const gameStore = createProducer(initialState, {
	...matchActions,
	...economyActions,
	...hachiActions,
	...livingCityActions,
	...feedActions,
});
