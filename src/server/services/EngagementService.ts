import { OnStart, Service } from "@flamework/core";
import { Players } from "@rbxts/services";
import { FRIEND_REFERRAL_BONUS, SPIN_REWARDS } from "shared/constants";
import { GlobalEvents } from "shared/network";
import { getCurrentDay } from "shared/utils/dayKey";
import { safeHandler } from "../utils/safeConnect";
import { PlayerDataService } from "./PlayerDataService";

/**
 * Handles lucky spin and friend referral engagement features.
 */
@Service()
export class EngagementService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});
	private readonly referralGranted = new Set<string>(); // "userId1:userId2" pairs

	constructor(private readonly playerDataService: PlayerDataService) {}

	onStart() {
		print("[EngagementService] Started");

		// Lucky spin request
		this.serverEvents.requestSpin.connect(
			safeHandler("EngagementService.requestSpin", (player) => {
				this.handleSpin(player);
			}),
		);

		// Spin status: sync after profile is loaded (not PlayerAdded)
		this.playerDataService.registerOnProfileLoaded((player) => {
			this.syncSpinStatus(player);
		});

		// Friend referral: check on join
		Players.PlayerAdded.Connect((player) => {
			task.defer(() => this.checkFriendReferral(player));
		});
		// Also check for players already in-server at startup
		for (const player of Players.GetPlayers()) {
			task.defer(() => this.checkFriendReferral(player));
		}
	}

	private handleSpin(player: Player) {
		const data = this.playerDataService.getPlayerData(player);
		if (!data) {
			this.serverEvents.spinResult.fire(player, 0, false);
			return;
		}

		const today = getCurrentDay();
		const lastSpin = typeIs(data.lastSpinDay, "number") ? data.lastSpinDay : 0;
		if (lastSpin >= today) {
			// Already spun today
			this.serverEvents.spinResult.fire(player, 0, false);
			return;
		}

		// Random weighted spin
		const segmentIndex = math.random(0, SPIN_REWARDS.size() - 1);
		const reward = SPIN_REWARDS[segmentIndex];

		data.lastSpinDay = today;
		this.playerDataService.addPlayPoints(player, reward);

		const level = this.playerDataService.getPlaygroundLevel(player);
		this.serverEvents.playPointsUpdate.fire(
			player,
			data.totalPlayPoints,
			level,
			data.shopBalance,
		);
		this.serverEvents.spinResult.fire(player, reward, true);
		this.serverEvents.spinStatusSync.fire(player, false);

		print(
			`[EngagementService] ${player.Name} spun lucky wheel: +${reward} pts`,
		);
	}

	private syncSpinStatus(player: Player) {
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return;
		const today = getCurrentDay();
		const lastSpin = typeIs(data.lastSpinDay, "number") ? data.lastSpinDay : 0;
		this.serverEvents.spinStatusSync.fire(player, lastSpin < today);
	}

	private checkFriendReferral(player: Player) {
		const [ok, pages] = pcall(() => Players.GetFriendsAsync(player.UserId));
		if (!ok || !pages) return;

		const friendIds = new Set<number>();
		let pageCount = 0;
		const MAX_PAGES = 50;
		while (pageCount < MAX_PAGES) {
			for (const item of pages.GetCurrentPage()) {
				const friendData = item as { Id: number };
				if (friendData.Id) friendIds.add(friendData.Id);
			}
			if (pages.IsFinished) break;
			const [advOk] = pcall(() => pages.AdvanceToNextPageAsync());
			if (!advOk) break;
			pageCount++;
		}

		// Check if any friend is currently in-server
		for (const otherPlayer of Players.GetPlayers()) {
			if (otherPlayer === player) continue;
			if (!friendIds.has(otherPlayer.UserId)) continue;

			// Create a canonical pair key to prevent double-granting
			const lo = math.min(player.UserId, otherPlayer.UserId);
			const hi = math.max(player.UserId, otherPlayer.UserId);
			const pairKey = `${lo}:${hi}`;
			if (this.referralGranted.has(pairKey)) continue;

			// Only grant if both profiles are loaded (don't mark granted if skipped)
			const pData = this.playerDataService.getPlayerData(player);
			const oData = this.playerDataService.getPlayerData(otherPlayer);
			if (!pData || !oData) continue;

			this.referralGranted.add(pairKey);

			this.playerDataService.addPlayPoints(player, FRIEND_REFERRAL_BONUS);
			this.playerDataService.addPlayPoints(otherPlayer, FRIEND_REFERRAL_BONUS);

			// pData/oData are mutated in place by addPlayPoints
			const pLevel = this.playerDataService.getPlaygroundLevel(player);
			this.serverEvents.playPointsUpdate.fire(
				player,
				pData.totalPlayPoints,
				pLevel,
				pData.shopBalance,
			);
			const oLevel = this.playerDataService.getPlaygroundLevel(otherPlayer);
			this.serverEvents.playPointsUpdate.fire(
				otherPlayer,
				oData.totalPlayPoints,
				oLevel,
				oData.shopBalance,
			);

			print(
				`[EngagementService] Friend referral: ${player.Name} + ${otherPlayer.Name} each get +${FRIEND_REFERRAL_BONUS} pts`,
			);
			break; // One referral per join
		}
	}
}
