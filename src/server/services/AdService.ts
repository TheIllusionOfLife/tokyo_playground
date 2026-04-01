import { OnStart, Service } from "@flamework/core";
import { Players, PolicyService } from "@rbxts/services";

/**
 * Manages immersive ad eligibility checks.
 *
 * Ad placement (AdGui instances on building surfaces) is done in Studio.
 * This service handles PolicyService checks for age-appropriate ad serving.
 *
 * Prerequisites (external setup required):
 * - 18+ ID-verified publisher account
 * - 2,000+ monthly unique visitors
 * - Register in Roblox Ads Manager
 * - Complete Experience Questionnaire
 * - Place AdGui instances on building facades in Studio
 *
 * AdGui placement locations (Shibuya):
 * - Shibuya Sky observation deck (2-3 billboards)
 * - Building facades along Center-gai (4-6 billboards)
 * - Shibuya Station platform walls (2-3 billboards)
 * - Digital signboard at Scramble Crossing (1-2 large billboards)
 *
 * Policy notes:
 * - Under-13 users CAN see billboard/portal ads (contextual only)
 * - Rewarded ads are NOT allowed for under-13 users
 * - All ads must have FallbackImage set (Shibuya-themed neon art)
 */
@Service()
export class AdService implements OnStart {
	onStart() {
		print(
			"[AdService] Started (ad infrastructure ready, AdGui placement needed in Studio)",
		);

		// Log ad eligibility for debugging
		Players.PlayerAdded.Connect((player) => {
			task.defer(() => this.checkAdEligibility(player));
		});
	}

	private checkAdEligibility(player: Player) {
		const [ok, result] = pcall(() =>
			PolicyService.GetPolicyInfoForPlayerAsync(player),
		);
		if (!ok || !result) {
			print(`[AdService] Could not get policy for ${player.Name}`);
			return;
		}

		// AreAdsAllowed indicates whether the player can see immersive ads
		const policyInfo = result as { AreAdsAllowed?: boolean };
		print(
			`[AdService] ${player.Name} ads allowed: ${policyInfo.AreAdsAllowed ?? "unknown"}`,
		);
	}
}
