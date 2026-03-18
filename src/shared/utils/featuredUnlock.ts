import { ItemId, type ShopItemData } from "shared/types";

export interface FeaturedUnlock {
	name: string;
	description: string;
	progressCurrent: number;
	progressTarget: number;
}

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
): FeaturedUnlock | undefined {
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

	return {
		name: target.name,
		description: `Earn ${math.max(0, target.price - shopBalance)} more points to buy this reward.`,
		progressCurrent: math.min(shopBalance, target.price),
		progressTarget: target.price,
	};
}
