import { OnStart, Service } from "@flamework/core";
import {
	CollectionService,
	Players,
	RunService,
	ServerStorage,
	Workspace,
} from "@rbxts/services";
import {
	NPC_DAILY_INTERACTION_BONUS,
	NPC_INTERACTION_RADIUS,
	NPC_REGISTRY,
	NPC_TREAT_COOLDOWN,
	OMIKUJI_POINTS,
	PHOTOGRAPHER_POSE_REWARD,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import { MissionId, NpcId, TimePhase } from "shared/types";
import { DayNightService } from "./DayNightService";
import { MissionService } from "./MissionService";
import { PlayerDataService } from "./PlayerDataService";

interface ActiveNpc {
	npcId: NpcId;
	model: Model;
	state: "idle" | "interacting";
}

const OMIKUJI_FORTUNES = [
	{ fortune: "Bad Luck", fortuneJP: "凶", tier: 0 },
	{ fortune: "Uncertain", fortuneJP: "末吉", tier: 1 },
	{ fortune: "Small Blessing", fortuneJP: "小吉", tier: 2 },
	{ fortune: "Good Fortune", fortuneJP: "吉", tier: 3 },
	{ fortune: "Great Blessing", fortuneJP: "大吉", tier: 4 },
];

@Service()
export class NpcRoutineService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});
	private activeNpcs = new Map<NpcId, ActiveNpc>();
	private treatCooldowns = new Map<string, number>(); // "NpcId_UserId" -> expiry
	private interactionRadiusSq = NPC_INTERACTION_RADIUS * NPC_INTERACTION_RADIUS;
	private checkAccumulator = 0;

	constructor(
		private readonly dayNightService: DayNightService,
		private readonly playerDataService: PlayerDataService,
		private readonly missionService: MissionService,
	) {}

	onStart() {
		print("[NpcRoutineService] Started");

		// React to phase changes to spawn/despawn NPCs
		RunService.Heartbeat.Connect((dt) => {
			this.checkAccumulator += dt;
			if (this.checkAccumulator < 0.5) return;
			this.checkAccumulator -= 0.5;

			this.updateNpcPresence();
			this.checkPlayerProximity();
		});

		// Handle NPC interaction requests
		this.serverEvents.requestNpcInteraction.connect((player, npcId) => {
			this.handleInteraction(player, npcId);
		});

		// Handle omikuji requests
		this.serverEvents.requestOmikuji.connect((player) => {
			this.handleOmikuji(player);
		});
	}

	private updateNpcPresence() {
		const currentPhase = this.dayNightService.getCurrentPhase();

		for (const [npcId, config] of pairs(NPC_REGISTRY)) {
			const shouldBeActive = config.activePhases.includes(currentPhase);
			const isActive = this.activeNpcs.has(npcId);

			if (shouldBeActive && !isActive) {
				this.spawnNpc(npcId);
			} else if (!shouldBeActive && isActive) {
				this.despawnNpc(npcId);
			}
		}
	}

	private spawnNpc(npcId: NpcId) {
		const config = NPC_REGISTRY[npcId];
		const npcFolder = ServerStorage.FindFirstChild("NPCs");
		const template = npcFolder?.FindFirstChild(npcId) as Model | undefined;

		let model: Model;
		if (template) {
			model = template.Clone();
			// fix L2: explicitly re-add tags after Clone()
			CollectionService.AddTag(model, "NPC");
			CollectionService.AddTag(model, npcId);
		} else {
			// Placeholder: simple Part with name
			model = new Instance("Model");
			model.Name = npcId;
			const part = new Instance("Part");
			part.Name = "Body";
			part.Size = new Vector3(2, 4, 2);
			part.Anchored = true;
			part.CanCollide = false;
			part.BrickColor = BrickColor.random();
			part.Parent = model;
			model.PrimaryPart = part;
		}

		model.PivotTo(new CFrame(config.spawnPosition));
		model.Parent = Workspace;

		this.activeNpcs.set(npcId, {
			npcId,
			model,
			state: "idle",
		});

		this.serverEvents.npcSpawned.broadcast(npcId, config.spawnPosition);
		print(`[NpcRoutineService] Spawned ${config.name}`);
	}

	private despawnNpc(npcId: NpcId) {
		const active = this.activeNpcs.get(npcId);
		if (!active) return;

		this.serverEvents.npcDespawned.broadcast(npcId);
		active.model.Destroy();
		this.activeNpcs.delete(npcId);
		print(`[NpcRoutineService] Despawned ${NPC_REGISTRY[npcId].name}`);
	}

	private checkPlayerProximity() {
		for (const player of Players.GetPlayers()) {
			const character = player.Character;
			if (!character) continue;
			const hrp = character.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (!hrp) continue;

			const pos = hrp.Position;
			for (const [npcId, active] of this.activeNpcs) {
				const npcPos = active.model.GetPivot().Position;
				const delta = pos.sub(npcPos);
				if (delta.Dot(delta) > this.interactionRadiusSq) continue;

				// Player is near NPC, check for auto-interactions
				this.checkAutoInteraction(player, npcId, active);
			}
		}
	}

	private checkAutoInteraction(
		player: Player,
		npcId: NpcId,
		active: ActiveNpc,
	) {
		const cooldownKey = `${npcId}_${player.UserId}`;
		const now = os.clock();
		if ((this.treatCooldowns.get(cooldownKey) ?? 0) > now) return;

		if (npcId === NpcId.RamenChef) {
			this.treatCooldowns.set(cooldownKey, now + NPC_TREAT_COOLDOWN);
			const pts = this.getDailyInteractionPoints(player, npcId);
			this.playerDataService.addPlayPoints(player, pts);
			this.serverEvents.npcInteraction.fire(player, npcId, "treat", pts);
		} else if (npcId === NpcId.Shopkeeper) {
			this.treatCooldowns.set(cooldownKey, now + 60);
			this.serverEvents.npcInteraction.fire(player, npcId, "bow", 0);
		} else if (npcId === NpcId.CatColony) {
			this.treatCooldowns.set(cooldownKey, now + 30);
			const data = this.playerDataService.getPlayerData(player);
			const level = data?.maxHachiLevel ?? 0;
			this.serverEvents.npcInteraction.fire(
				player,
				npcId,
				`catReact_${level}`,
				0,
			);
			this.missionService.incrementAndNotify(
				player,
				MissionId.VisitCatColony,
				1,
			);
		}
	}

	private handleInteraction(player: Player, npcId: string) {
		const active = this.activeNpcs.get(npcId as NpcId);
		if (!active) return;

		const character = player.Character;
		if (!character) return;
		const hrp = character.FindFirstChild("HumanoidRootPart") as
			| BasePart
			| undefined;
		if (!hrp) return;

		const delta = hrp.Position.sub(active.model.GetPivot().Position);
		if (delta.Dot(delta) > this.interactionRadiusSq) return;

		if (npcId === NpcId.Photographer) {
			this.playerDataService.addPlayPoints(player, PHOTOGRAPHER_POSE_REWARD);
			this.serverEvents.npcInteraction.fire(
				player,
				npcId,
				"photograph",
				PHOTOGRAPHER_POSE_REWARD,
			);
			this.missionService.incrementAndNotify(
				player,
				MissionId.GetPhotographed,
				1,
			);
		}
	}

	private handleOmikuji(player: Player) {
		const active = this.activeNpcs.get(NpcId.ShrineKeeper);
		if (!active) return;

		// Proximity check
		const character = player.Character;
		if (!character) return;
		const hrp = character.FindFirstChild("HumanoidRootPart") as
			| BasePart
			| undefined;
		if (!hrp) return;
		const delta = hrp.Position.sub(active.model.GetPivot().Position);
		if (delta.Dot(delta) > this.interactionRadiusSq) return;

		// Daily check
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return;
		const today = math.floor(os.time() / 86400);
		if (data.lastOmikujiDay >= today) return;

		data.lastOmikujiDay = today;

		// Draw fortune
		const tier = math.random(0, OMIKUJI_FORTUNES.size() - 1);
		const fortune = OMIKUJI_FORTUNES[tier];
		const points = OMIKUJI_POINTS[tier];

		this.playerDataService.addPlayPoints(player, points);
		this.serverEvents.omikujiResult.fire(
			player,
			fortune.fortune,
			fortune.fortuneJP,
			fortune.tier,
			points,
		);
		this.missionService.incrementAndNotify(player, MissionId.DrawOmikuji, 1);
		print(
			`[NpcRoutineService] ${player.Name} drew omikuji: ${fortune.fortuneJP} (${points} pts)`,
		);
	}

	private getDailyInteractionPoints(player: Player, npcId: NpcId): number {
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return 3;
		const today = math.floor(os.time() / 86400);
		if (data.lastNpcInteractionDay < today) {
			data.lastNpcInteractionDay = today;
			data.npcFirstInteractions = [];
		}
		if (!data.npcFirstInteractions.includes(npcId)) {
			data.npcFirstInteractions.push(npcId);
			return NPC_DAILY_INTERACTION_BONUS;
		}
		return 3;
	}
}
