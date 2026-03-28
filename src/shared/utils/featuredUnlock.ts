import {
	type FeaturedUnlockData,
	ItemId,
	type ShopItemData,
} from "shared/types";

export type FeaturedUnlock = FeaturedUnlockData;

const FEATURED_UNLOCK_ORDER: ItemId[] = [
	ItemId.HatCone,
	ItemId.TrailStar,
	ItemId.EmoteDance,
	ItemId.HatBucket,
	ItemId.EmoteCheer,
	ItemId.HatCrown,
	ItemId.TrailFlame,
	ItemId.TrailRainbow,
	ItemId.EmoteWave,
	ItemId.EmoteFlip,
];

export function getFeaturedUnlock(
	items: ShopItemData[],
	level: number,
	shopBalance: number,
): FeaturedUnlockData | undefined {
	let target = items.find((item) => !item.owned);
	for (const itemId of FEATURED_UNLOCK_ORDER) {
		const featuredItem = items.find(
			(item) => item.id === itemId && !item.owned,
		);
		if (featuredItem) {
			target = featuredItem;
			break;
		}
	}
	if (!target) return undefined;

	if (level < target.levelRequired) {
		return {
			name: target.name,
			description: `Reach level ${target.levelRequired} to unlock this reward.`,
			progressCurrent: level,
			progressTarget: target.levelRequired,
		};
	}

	const remaining = target.price - shopBalance;
	if (remaining <= 0) {
		return {
			name: target.name,
			description: "Ready to buy! Open Shop to get it.",
			progressCurrent: target.price,
			progressTarget: target.price,
		};
	}

	return {
		name: target.name,
		description: `Earn ${remaining} more points to buy this reward.`,
		progressCurrent: shopBalance,
		progressTarget: target.price,
	};
}
