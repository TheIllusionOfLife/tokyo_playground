import { OnStart, Service } from "@flamework/core";
import { Players } from "@rbxts/services";
import { ALL_MISSION_IDS, MISSION_DEFS } from "shared/constants";
import { GlobalEvents } from "shared/network";
import {
	MissionId,
	MissionProgressData,
	MissionSlot,
	PlayerRole,
	RoundResult,
} from "shared/types";
import { PlayerDataService } from "./PlayerDataService";

@Service()
export class MissionService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});

	constructor(private readonly playerDataService: PlayerDataService) {}

	onStart() {
		print("[MissionService] Started");

		// Register callback so onPlayerJoined fires after profile.Reconcile()
		this.playerDataService.registerOnProfileLoaded((player) => {
			this.onPlayerJoined(player);
		});

		// Handle players already present at bootstrap (Studio solo testing)
		for (const player of Players.GetPlayers()) {
			if (this.playerDataService.getPlayerData(player)) {
				this.onPlayerJoined(player);
			}
		}

		this.serverEvents.collectMissionReward.connect((player, id) => {
			this.handleCollectReward(player, id);
		});
	}

	getCurrentDay(): number {
		return math.floor(os.time() / 86400);
	}

	onPlayerJoined(player: Player) {
		const day = this.getCurrentDay();
		this.playerDataService.checkAndResetMissions(player, day);

		const data = this.playerDataService.getPlayerData(player);
		if (!data) return;

		// Assign 3 daily missions if slots were reset or never set
		if (data.missions.slots.size() === 0) {
			const slots: MissionSlot[] = [];
			const total = ALL_MISSION_IDS.size();
			for (let i = 0; i < 3; i++) {
				const idx = ((day % total) + i) % total;
				slots.push({
					id: ALL_MISSION_IDS[idx],
					progress: 0,
					rewardCollected: false,
				});
			}
			data.missions.slots = slots;
			data.missions.lastResetDay = day;
		}

		const missions = this.buildProgressData(player);
		this.serverEvents.missionUpdate.fire(player, missions);
	}

	recordGameResult(
		player: Player,
		role: PlayerRole,
		result: RoundResult,
		state: { catchCount: number; rescueCount: number },
		pointsEarned: number,
	) {
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return;

		this.incrementAndNotify(player, MissionId.PlayGames, 1);

		const won =
			(role === PlayerRole.Oni && result === RoundResult.OniWins) ||
			(role === PlayerRole.Hider &&
				(result === RoundResult.HidersWin ||
					result === RoundResult.TimerExpired));

		if (won && role === PlayerRole.Oni) {
			this.incrementAndNotify(player, MissionId.WinAsOni, 1);
		}
		if (won && role === PlayerRole.Hider) {
			this.incrementAndNotify(player, MissionId.WinAsHider, 1);
		}
		if (state.catchCount > 0) {
			this.incrementAndNotify(player, MissionId.CatchPlayers, state.catchCount);
		}
		if (state.rescueCount > 0) {
			this.incrementAndNotify(
				player,
				MissionId.RescueTeammates,
				state.rescueCount,
			);
		}
		if (pointsEarned > 0) {
			this.incrementAndNotify(player, MissionId.EarnPoints, pointsEarned);
		}

		const missions = this.buildProgressData(player);
		this.serverEvents.missionUpdate.fire(player, missions);
	}

	onCanKicked(player: Player) {
		this.incrementAndNotify(player, MissionId.KickCan, 1);
		const missions = this.buildProgressData(player);
		this.serverEvents.missionUpdate.fire(player, missions);
	}

	handleCollectReward(player: Player, id: MissionId) {
		const collected = this.playerDataService.markMissionRewardCollected(
			player,
			id,
		);
		if (!collected) return;

		const def = MISSION_DEFS[id];
		this.playerDataService.addPlayPoints(player, def.pointsReward);

		const data = this.playerDataService.getPlayerData(player);
		if (data) {
			const level = this.playerDataService.getPlaygroundLevel(player);
			this.serverEvents.playPointsUpdate.fire(
				player,
				data.totalPlayPoints,
				level,
			);
		}

		const missions = this.buildProgressData(player);
		this.serverEvents.missionUpdate.fire(player, missions);
	}

	buildProgressData(player: Player): MissionProgressData[] {
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return [];

		const result: MissionProgressData[] = [];
		for (const slot of data.missions.slots) {
			const def = MISSION_DEFS[slot.id];
			result.push({
				id: slot.id,
				label: def.label,
				progress: slot.progress,
				target: def.target,
				pointsReward: def.pointsReward,
				rewardCollected: slot.rewardCollected,
			});
		}
		return result;
	}

	private incrementAndNotify(player: Player, id: MissionId, amount: number) {
		const wasNewlyCompleted = this.playerDataService.incrementMissionProgress(
			player,
			id,
			amount,
		);
		if (wasNewlyCompleted) {
			const def = MISSION_DEFS[id];
			this.serverEvents.missionCompleted.fire(player, id, def.pointsReward);
		}
	}
}
