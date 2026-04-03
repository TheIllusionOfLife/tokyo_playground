/**
 * Feed message store actions.
 * Covers: push/clear feed messages with TTL filtering.
 */
import { FEED_MESSAGE_TTL_SECONDS } from "shared/utils/feed";
import { FeedMessage, GameStoreState } from "../game-store-types";

export const feedInitialState = {
	feedMessages: [] as FeedMessage[],
};

export const feedActions = {
	pushFeedMessage: (state: GameStoreState, text: string) => ({
		...state,
		feedMessages: [
			...state.feedMessages.filter(
				(m) => os.clock() - m.timestamp < FEED_MESSAGE_TTL_SECONDS,
			),
			{ text, timestamp: os.clock() },
		],
	}),
	clearFeed: (state: GameStoreState) => ({
		...state,
		feedMessages: [],
	}),
};
