import { OnStart, Service } from "@flamework/core";
import { Players, AnalyticsService as RobloxAnalytics } from "@rbxts/services";
import { AnalyticsEvent } from "shared/analytics";

@Service()
export class AnalyticsService implements OnStart {
	private readonly joinTimes = new Map<number, number>();

	onStart() {
		Players.PlayerAdded.Connect((player) => {
			this.joinTimes.set(player.UserId, os.clock());
			this.fireForPlayer(player, {
				name: "session_start",
				playerId: player.UserId,
				platform: "unknown",
			});
		});

		Players.PlayerRemoving.Connect((player) => {
			const joinTime = this.joinTimes.get(player.UserId);
			if (joinTime !== undefined) {
				this.fireForPlayer(player, {
					name: "session_end",
					playerId: player.UserId,
					durationSeconds: math.floor(os.clock() - joinTime),
				});
				this.joinTimes.delete(player.UserId);
			}
		});

		// Bootstrap players who joined before this service initialized
		for (const player of Players.GetPlayers()) {
			if (!this.joinTimes.has(player.UserId)) {
				this.joinTimes.set(player.UserId, os.clock());
			}
		}

		print("[AnalyticsService] Started");
	}

	/** Fire an analytics event for a specific player. */
	fireForPlayer(player: Player, event: AnalyticsEvent) {
		const customFields: Record<string, unknown> = {};
		for (const [key, val] of pairs(
			event as unknown as Record<string, unknown>,
		)) {
			if (key !== "name") {
				customFields[key as string] = val;
			}
		}

		pcall(() => {
			RobloxAnalytics.FireCustomEvent(player, event.name, customFields);
		});
	}

	/**
	 * Fire a global analytics event using an arbitrary active player.
	 * Falls back to print-only if no players are connected.
	 */
	fire(event: AnalyticsEvent) {
		const players = Players.GetPlayers();
		if (players.size() > 0) {
			this.fireForPlayer(players[0], event);
		}
		print(`[Analytics] ${event.name}`);
	}
}
