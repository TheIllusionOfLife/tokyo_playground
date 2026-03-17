import { OnStart, Service } from "@flamework/core";
import { Players, RunService } from "@rbxts/services";
import { GlobalEvents } from "shared/network";
import { MinigameId } from "shared/types";
import { HachiRideMinigame } from "./minigames/HachiRideMinigame";
import { PlayerDataService } from "./PlayerDataService";

/**
 * Studio-only admin commands via chat.
 * Usage: /evolve 3, /items 50, /points 500, /level 5, /speed 400
 */
@Service()
export class AdminService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});

	constructor(private readonly playerDataService: PlayerDataService) {}

	onStart() {
		if (!RunService.IsStudio()) return;
		print("[AdminService] Studio detected — admin commands enabled");

		Players.PlayerAdded.Connect((player) => this.bindChat(player));
		for (const player of Players.GetPlayers()) {
			this.bindChat(player);
		}
	}

	private bindChat(player: Player) {
		player.Chatted.Connect((msg) => this.handleCommand(player, msg));
	}

	private handleCommand(player: Player, msg: string) {
		const parts = msg.lower().split(" ");
		const cmd = parts[0];
		const value = parts.size() > 1 ? tonumber(parts[1]) : undefined;

		if (cmd === "/evolve" && value !== undefined) {
			this.setEvolution(player, math.clamp(value, 0, 4));
		} else if (cmd === "/items" && value !== undefined) {
			this.giveItems(player, value);
		} else if (cmd === "/points" && value !== undefined) {
			this.playerDataService.addPlayPoints(player, value);
			const data = this.playerDataService.getPlayerData(player);
			if (data) {
				const lv = this.playerDataService.getPlaygroundLevel(player);
				this.serverEvents.playPointsUpdate.fire(
					player,
					data.totalPlayPoints,
					lv,
					data.shopBalance,
				);
			}
			this.serverEvents.hintTextChanged.fire(player, `+${value} points`);
		} else if (cmd === "/speed" && value !== undefined) {
			const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
			const seat = humanoid?.SeatPart;
			if (seat?.IsA("VehicleSeat")) {
				seat.MaxSpeed = value;
				this.serverEvents.hintTextChanged.fire(
					player,
					`Hachi MaxSpeed → ${value}`,
				);
			}
		} else if (cmd === "/help" || cmd === "/admin") {
			this.serverEvents.hintTextChanged.fire(
				player,
				"/evolve N | /items N | /points N | /speed N",
			);
		}
	}

	private setEvolution(player: Player, level: number) {
		const minigame = HachiRideMinigame.activeInstance;
		if (minigame) {
			minigame.adminSetEvolution(player, level);
		}
		this.serverEvents.hintTextChanged.fire(player, `Evolution → ${level}`);
	}

	private giveItems(player: Player, count: number) {
		this.serverEvents.hachiItemCollected.fire(player, count);
		this.serverEvents.hintTextChanged.fire(player, `Items → ${count}`);
	}
}
