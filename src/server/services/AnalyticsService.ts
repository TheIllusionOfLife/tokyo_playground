import { OnStart, Service } from "@flamework/core";
import { AnalyticsService as RobloxAnalytics, Players } from "@rbxts/services";
import { AnalyticsEvent } from "shared/analytics";

@Service()
export class AnalyticsService implements OnStart {
	private readonly joinTimes = new Map<number, number>();

	onStart() {
		Players.PlayerAdded.Connect((player) => {
			this.joinTimes.set(player.UserId, os.clock());
			this.fire({
				name: "session_start",
				playerId: player.UserId,
				platform: this.detectPlatform(player),
			});
		});

		Players.PlayerRemoving.Connect((player) => {
			const joinTime = this.joinTimes.get(player.UserId);
			if (joinTime !== undefined) {
				this.fire({
					name: "session_end",
					playerId: player.UserId,
					durationSeconds: math.floor(os.clock() - joinTime),
				});
				this.joinTimes.delete(player.UserId);
			}
		});

		// Prune join times periodically (safety net)
		task.spawn(() => {
			while (true) {
				task.wait(300);
				const playerIds = new Set(
					Players.GetPlayers().map((p) => p.UserId),
				);
				for (const [userId] of this.joinTimes) {
					if (!playerIds.has(userId)) {
						this.joinTimes.delete(userId);
					}
				}
			}
		});

		print("[AnalyticsService] Started");
	}

	fire(event: AnalyticsEvent) {
		const customFields: Record<string, unknown> = {};
		for (const [key, val] of pairs(event as unknown as Record<string, unknown>)) {
			if (key !== "name") {
				customFields[key as string] = val;
			}
		}

		RobloxAnalytics.FireCustomEvent(
			undefined as unknown as Player,
			event.name,
			customFields,
		);

		print(`[Analytics] ${event.name}`);
	}

	fireForPlayer(player: Player, event: AnalyticsEvent) {
		const customFields: Record<string, unknown> = {};
		for (const [key, val] of pairs(event as unknown as Record<string, unknown>)) {
			if (key !== "name") {
				customFields[key as string] = val;
			}
		}

		RobloxAnalytics.FireCustomEvent(player, event.name, customFields);
	}

	private detectPlatform(player: Player): string {
		// GuiService.IsTenFootInterface for console, touch for mobile, else desktop
		const playerGui = player.FindFirstChildOfClass("PlayerGui");
		if (!playerGui) return "unknown";
		// Simple heuristic: platform detection happens via client, but for server
		// analytics we use a basic approach
		return "server";
	}
}
