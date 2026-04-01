import { OnStart, Service } from "@flamework/core";
import { Players } from "@rbxts/services";
import { FRIEND_REFERRAL_BONUS, SPIN_REWARDS } from "shared/constants";
import { GlobalEvents } from "shared/network";
import { getCurrentDay } from "shared/utils/dayKey";
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
		this.serverEvents.requestSpin.connect((player) => {
			this.handleSpin(player);
		});

		// Friend referral: check on join if a friend is already in-server
		Players.PlayerAdded.Connect((player) => {
			task.defer(() => this.checkFriendReferral(player));
		});
	}

	private handleSpin(player: Player) {
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return;

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

		print(
			`[EngagementService] ${player.Name} spun lucky wheel: +${reward} pts`,
		);
	}

	private checkFriendReferral(player: Player) {
		const [ok, pages] = pcall(() => Players.GetFriendsAsync(player.UserId));
		if (!ok || !pages) return;

		const friendIds = new Set<number>();
		while (true) {
			for (const item of pages.GetCurrentPage()) {
				const friendData = item as { Id: number };
				if (friendData.Id) friendIds.add(friendData.Id);
			}
			if (pages.IsFinished) break;
			pcall(() => pages.AdvanceToNextPageAsync());
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
			this.referralGranted.add(pairKey);

			// Grant bonus to both
			this.playerDataService.addPlayPoints(player, FRIEND_REFERRAL_BONUS);
			this.playerDataService.addPlayPoints(otherPlayer, FRIEND_REFERRAL_BONUS);

			const playerData = this.playerDataService.getPlayerData(player);
			const otherData = this.playerDataService.getPlayerData(otherPlayer);
			if (playerData) {
				const level = this.playerDataService.getPlaygroundLevel(player);
				this.serverEvents.playPointsUpdate.fire(
					player,
					playerData.totalPlayPoints,
					level,
					playerData.shopBalance,
				);
			}
			if (otherData) {
				const level = this.playerDataService.getPlaygroundLevel(otherPlayer);
				this.serverEvents.playPointsUpdate.fire(
					otherPlayer,
					otherData.totalPlayPoints,
					level,
					otherData.shopBalance,
				);
			}

			print(
				`[EngagementService] Friend referral: ${player.Name} + ${otherPlayer.Name} each get +${FRIEND_REFERRAL_BONUS} pts`,
			);
			break; // One referral per join
		}
	}
}
