import { OnStart, Service } from "@flamework/core";
import { Players, AnalyticsService as RobloxAnalytics } from "@rbxts/services";
import { AnalyticsEvent } from "shared/analytics";
import { GlobalEvents } from "shared/network";
import { safeHandler } from "../utils/safeConnect";

const PLATFORM_REPORT_TIMEOUT = 5;

@Service()
export class AnalyticsService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});
	private readonly joinTimes = new Map<number, number>();
	private readonly playerPlatforms = new Map<number, string>();
	private readonly pendingSessionStart = new Map<number, thread>();

	onStart() {
		Players.PlayerAdded.Connect((player) => {
			this.joinTimes.set(player.UserId, os.clock());
			// Wait for client to report platform before firing session_start
			const timeoutThread = task.delay(PLATFORM_REPORT_TIMEOUT, () => {
				this.pendingSessionStart.delete(player.UserId);
				this.fireSessionStart(player);
			});
			this.pendingSessionStart.set(player.UserId, timeoutThread);
		});

		const VALID_PLATFORMS = new Set(["mobile", "desktop", "console"]);
		this.serverEvents.reportPlatform.connect(
			safeHandler("AnalyticsService.reportPlatform", (player, platform) => {
				const safePlatform = VALID_PLATFORMS.has(platform)
					? platform
					: "unknown";
				this.playerPlatforms.set(player.UserId, safePlatform);
				const pending = this.pendingSessionStart.get(player.UserId);
				if (pending) {
					task.cancel(pending);
					this.pendingSessionStart.delete(player.UserId);
					this.fireSessionStart(player);
				}
			}),
		);

		Players.PlayerRemoving.Connect((player) => {
			const joinTime = this.joinTimes.get(player.UserId);
			if (joinTime !== undefined) {
				this.fireForPlayer(player, {
					name: "session_end",
					playerId: player.UserId,
					durationSeconds: math.floor(os.clock() - joinTime),
				});
			}
			// Cancel pending timeout if player leaves before platform report
			const pending = this.pendingSessionStart.get(player.UserId);
			if (pending) task.cancel(pending);
			this.joinTimes.delete(player.UserId);
			this.playerPlatforms.delete(player.UserId);
			this.pendingSessionStart.delete(player.UserId);
		});

		// Bootstrap players who joined before this service initialized
		for (const player of Players.GetPlayers()) {
			if (!this.joinTimes.has(player.UserId)) {
				this.joinTimes.set(player.UserId, os.clock());
				const timeoutThread = task.delay(PLATFORM_REPORT_TIMEOUT, () => {
					this.pendingSessionStart.delete(player.UserId);
					this.fireSessionStart(player);
				});
				this.pendingSessionStart.set(player.UserId, timeoutThread);
			}
		}

		print("[AnalyticsService] Started");
	}

	private fireSessionStart(player: Player) {
		const platform = this.playerPlatforms.get(player.UserId) ?? "unknown";
		this.fireForPlayer(player, {
			name: "session_start",
			playerId: player.UserId,
			platform,
		});
	}

	getPlayerPlatform(player: Player): string {
		return this.playerPlatforms.get(player.UserId) ?? "unknown";
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
