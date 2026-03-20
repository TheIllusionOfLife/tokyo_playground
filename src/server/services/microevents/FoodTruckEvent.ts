import { Players } from "@rbxts/services";
import {
	FOOD_TRUCK_DURATION,
	FOOD_TRUCK_EARLY_BIRD_POINTS,
	FOOD_TRUCK_EARLY_BIRD_SLOTS,
	FOOD_TRUCK_LATE_POINTS,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import { MicroEventId, MissionId } from "shared/types";
import { MissionService } from "../MissionService";
import { PlayerDataService } from "../PlayerDataService";
import { IMicroEvent } from "./MicroEventBase";

type ServerEvents = ReturnType<typeof GlobalEvents.createServer>;

export class FoodTruckEvent implements IMicroEvent {
	readonly id = MicroEventId.FoodTruck;
	readonly duration = FOOD_TRUCK_DURATION;
	private elapsed = 0;
	private finished = false;
	private earlyBirdCount = 0;
	private visited = new Set<number>();

	constructor(
		private readonly serverEvents: ServerEvents,
		private readonly playerDataService: PlayerDataService,
		private readonly missionService: MissionService,
	) {}

	start() {
		this.serverEvents.interactFoodTruck.connect((player) => {
			if (this.finished) return;
			if (this.visited.has(player.UserId)) return;
			this.visited.add(player.UserId);

			const isEarlyBird = this.earlyBirdCount < FOOD_TRUCK_EARLY_BIRD_SLOTS;
			if (isEarlyBird) this.earlyBirdCount++;

			const pts = isEarlyBird
				? FOOD_TRUCK_EARLY_BIRD_POINTS
				: FOOD_TRUCK_LATE_POINTS;
			this.playerDataService.addPlayPoints(player, pts);

			const remaining = math.max(
				0,
				FOOD_TRUCK_EARLY_BIRD_SLOTS - this.earlyBirdCount,
			);
			this.serverEvents.foodTruckFound.broadcast(player.Name, remaining);
			this.missionService.incrementAndNotify(
				player,
				MissionId.VisitFoodTruck,
				1,
			);
		});
	}

	tick(dt: number) {
		this.elapsed += dt;
		if (this.elapsed >= this.duration) {
			this.finished = true;
		}
	}

	isFinished(): boolean {
		return this.finished;
	}

	cleanup() {
		this.visited.clear();
	}
}
