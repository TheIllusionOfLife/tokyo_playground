import { CollectionService, Players } from "@rbxts/services";
import {
	FOOD_TRUCK_DURATION,
	FOOD_TRUCK_EARLY_BIRD_POINTS,
	FOOD_TRUCK_EARLY_BIRD_SLOTS,
	FOOD_TRUCK_LATE_POINTS,
	FOOD_TRUCK_SPOT_TAG,
	NPC_INTERACTION_RADIUS,
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
	private connections: RBXScriptConnection[] = [];
	private truckPos = Vector3.zero;
	private readonly interactionRadiusSq =
		NPC_INTERACTION_RADIUS * NPC_INTERACTION_RADIUS;

	constructor(
		private readonly serverEvents: ServerEvents,
		private readonly playerDataService: PlayerDataService,
		private readonly missionService: MissionService,
	) {}

	start() {
		// Pick a random truck spot
		const spots = CollectionService.GetTagged(FOOD_TRUCK_SPOT_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);
		if (spots.size() > 0) {
			this.truckPos = spots[math.random(0, spots.size() - 1)].Position;
		}

		// Fix #1: track connection. Fix #2: add proximity check.
		this.connections.push(
			this.serverEvents.interactFoodTruck.connect((player) => {
				if (this.finished) return;
				if (this.visited.has(player.UserId)) return;

				// Fix #2: server-side proximity validation
				const character = player.Character;
				if (!character) return;
				const hrp = character.FindFirstChild("HumanoidRootPart") as
					| BasePart
					| undefined;
				if (!hrp) return;
				const delta = hrp.Position.sub(this.truckPos);
				if (delta.Dot(delta) > this.interactionRadiusSq) return;

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
			}),
		);
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
		// Fix #1: disconnect all listeners
		for (const conn of this.connections) {
			conn.Disconnect();
		}
		this.connections = [];
		this.visited.clear();
	}
}
