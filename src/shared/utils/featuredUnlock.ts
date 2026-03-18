import { type ShopItemData } from "shared/types";

export interface FeaturedUnlock {
	name: string;
	description: string;
	progressCurrent: number;
	progressTarget: number;
}

export function getFeaturedUnlock(
	items: ShopItemData[],
	level: number,
	shopBalance: number,
): FeaturedUnlock | undefined {
	const target = items.find((item) => !item.owned);
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
