import { OnStart, Service } from "@flamework/core";
import {
	ALL_MISSION_IDS,
	EXPLORATION_MISSION_IDS,
	MINIGAME_MISSION_IDS,
	MISSION_DEFS,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import {
	AnyPlayerState,
	MinigameId,
	MissionId,
	MissionProgressData,
	MissionSlot,
	PlayerRole,
} from "shared/types";
import { PlayerDataService } from "./PlayerDataService";

@Service()
export class MissionService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});

	constructor(private readonly playerDataService: PlayerDataService) {}

	onStart() {
		print("[MissionService] Started");

		// Register callback so onPlayerJoined fires after profile.Reconcile().
		// PlayerDataService bootstraps existing players via task.spawn in its own onStart,
		// so those profiles also complete via this callback — no separate loop needed.
		this.playerDataService.registerOnProfileLoaded((player) => {
			this.onPlayerJoined(player);
		});

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

		// Assign 3 daily missions: 1 exploration + 1 minigame + 1 from full pool
		if (data.missions.slots.size() === 0) {
			const chosen = new Set<MissionId>();

			// Slot 1: guaranteed exploration mission
			const explorationPool = EXPLORATION_MISSION_IDS.filter(
				(id) => !chosen.has(id),
			);
			if (explorationPool.size() > 0) {
				const pick =
					explorationPool[math.random(0, explorationPool.size() - 1)];
				chosen.add(pick);
			}

			// Slot 2: guaranteed minigame mission
			const minigamePool = MINIGAME_MISSION_IDS.filter((id) => !chosen.has(id));
			if (minigamePool.size() > 0) {
				const pick = minigamePool[math.random(0, minigamePool.size() - 1)];
				chosen.add(pick);
			}

			// Slot 3: from full pool (no duplicates)
			const fullPool = ALL_MISSION_IDS.filter((id) => !chosen.has(id));
			for (let i = chosen.size(); i < 3 && fullPool.size() > 0; i++) {
				const idx = math.random(0, fullPool.size() - 1);
				chosen.add(fullPool[idx]);
				fullPool.remove(idx);
			}

			const slots: MissionSlot[] = [];
			for (const id of chosen) {
				slots.push({ id, progress: 0, rewardCollected: false });
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
		state: AnyPlayerState,
		pointsEarned: number,
		isWinner: boolean,
	) {
		if (!this.playerDataService.getPlayerData(player)) return;

		this.incrementAndNotify(player, MissionId.PlayGames, 1);

		const won = isWinner;

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

		if (state.minigameId === MinigameId.ShibuyaScramble) {
			if (role === PlayerRole.Hider && won) {
				this.incrementAndNotify(player, MissionId.SurviveScramble, 1);
			}
			if (role === PlayerRole.Oni && state.catchCount > 0) {
				this.incrementAndNotify(
					player,
					MissionId.TagInScramble,
					state.catchCount,
				);
			}
		}

		if (state.minigameId === MinigameId.HachiRide) {
			if (state.itemCount > 0) {
				this.incrementAndNotify(
					player,
					MissionId.CollectHachiItems,
					state.itemCount,
				);
			}
			if (state.evolutionLevel >= 3) {
				this.incrementAndNotify(player, MissionId.ReachHachiLevel3, 1);
			}
			if (won) {
				this.incrementAndNotify(player, MissionId.WinHachiRide, 1);
			}
		}

		const missions = this.buildProgressData(player);
		this.serverEvents.missionUpdate.fire(player, missions);
	}

	onSlideUsed(player: Player) {
		this.incrementAndNotify(player, MissionId.ReachRooftop, 1);
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
				data.shopBalance,
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

	/** Increment mission progress and notify client if newly completed. Public for cross-service use. */
	incrementAndNotify(player: Player, id: MissionId, amount: number) {
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
