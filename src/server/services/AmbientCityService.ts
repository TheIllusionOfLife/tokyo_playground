import { OnStart, Service } from "@flamework/core";
import { ServerStorage, TweenService, Workspace } from "@rbxts/services";

const CROWD_WAVE_INTERVAL = 18; // seconds between crowd waves
const CROWD_WAVE_DURATION = 12; // seconds for NPCs to cross
const CROWD_NPCS_PER_PATH = 2; // reduced for lobby performance
const CAR_WAVE_INTERVAL = 25; // seconds between car waves
const CAR_WAVE_DURATION = 10; // seconds for cars to cross

@Service()
export class AmbientCityService implements OnStart {
	private running = false;
	private activeCrowdNPCs: Model[] = [];
	private activeCarNPCs: Model[] = [];

	onStart() {
		print("[AmbientCityService] Started");
		this.start();
	}

	start() {
		if (this.running) return;
		this.running = true;
		task.spawn(() => this.runCrowdLoop());
		task.spawn(() => this.runCarLoop());
	}

	stop() {
		this.running = false;
		this.destroyAllAmbientActors();
	}

	/** Immediately destroy all spawned NPCs and cars. */
	destroyAllAmbientActors() {
		for (const npc of this.activeCrowdNPCs) {
			if (npc.Parent) npc.Destroy();
		}
		this.activeCrowdNPCs = [];

		for (const car of this.activeCarNPCs) {
			if (car.Parent) car.Destroy();
		}
		this.activeCarNPCs = [];
	}

	private runCrowdLoop() {
		while (this.running) {
			task.wait(CROWD_WAVE_INTERVAL);
			if (!this.running) break;
			const wave = this.spawnCrowdWave();
			task.wait(CROWD_WAVE_DURATION + 2);
			if (!this.running) break;
			this.despawnNPCs(wave, this.activeCrowdNPCs);
		}
	}

	private runCarLoop() {
		while (this.running) {
			task.wait(CAR_WAVE_INTERVAL);
			if (!this.running) break;
			const wave = this.spawnCarWave();
			task.wait(CAR_WAVE_DURATION + 2);
			if (!this.running) break;
			this.despawnNPCs(wave, this.activeCarNPCs);
		}
	}

	private spawnCrowdWave(): Model[] {
		const waypointsFolder = Workspace.FindFirstChild("CrowdWaypoints");
		if (!waypointsFolder) return [];
		const noobTemplate = ServerStorage.FindFirstChild("NoobTemplate") as
			| Model
			| undefined;
		const wave: Model[] = [];

		for (let i = 1; i <= 4; i++) {
			const pathFolder = waypointsFolder.FindFirstChild(`Path${i}`);
			if (!pathFolder) continue;
			const startPart = pathFolder.FindFirstChild("Start") as
				| BasePart
				| undefined;
			const endPart = pathFolder.FindFirstChild("End") as BasePart | undefined;
			if (!startPart || !endPart) continue;

			for (let j = 0; j < CROWD_NPCS_PER_PATH; j++) {
				const offset = new Vector3(
					(math.random() - 0.5) * 6,
					0,
					(math.random() - 0.5) * 6,
				);
				const npc = this.createNpc(
					noobTemplate,
					startPart.Position.add(offset),
					endPart.Position.add(offset),
					CROWD_WAVE_DURATION,
				);
				this.activeCrowdNPCs.push(npc);
				wave.push(npc);
			}
		}
		return wave;
	}

	private spawnCarWave(): Model[] {
		const carWP = ServerStorage.FindFirstChild("CarWaypoints");
		if (!carWP) return [];

		const templateNames = ["CarTemplate_1", "CarTemplate_2", "CarTemplate_3"];
		const wave: Model[] = [];

		// Spawn 1 car per wave (reduced for lobby)
		const pathIndex = math.random(1, 3);
		const pathFolder = carWP.FindFirstChild(`Path${pathIndex}`);
		if (!pathFolder) return [];
		const startPart = pathFolder.FindFirstChild("Start") as
			| BasePart
			| undefined;
		const endPart = pathFolder.FindFirstChild("End") as BasePart | undefined;
		if (!startPart || !endPart) return [];

		const templateName =
			templateNames[math.random(0, templateNames.size() - 1)];
		const template = ServerStorage.FindFirstChild(templateName) as
			| Model
			| undefined;
		if (!template) return [];

		const car = template.Clone();
		const primary = car.PrimaryPart;
		for (const desc of car.GetDescendants()) {
			if (desc.IsA("BasePart")) {
				desc.Anchored = desc === primary;
				desc.CanCollide = false;
				desc.CanTouch = false;
				desc.CanQuery = false;
				desc.CastShadow = false;
			}
		}

		car.PivotTo(new CFrame(startPart.Position));
		car.Parent = Workspace;

		if (primary) {
			TweenService.Create(
				primary,
				new TweenInfo(CAR_WAVE_DURATION, Enum.EasingStyle.Linear),
				{ CFrame: new CFrame(endPart.Position) },
			).Play();
		}

		this.activeCarNPCs.push(car);
		wave.push(car);
		return wave;
	}

	private createNpc(
		template: Model | undefined,
		startPos: Vector3,
		endPos: Vector3,
		duration: number,
	): Model {
		if (template) {
			const npc = template.Clone();
			for (const desc of npc.GetDescendants()) {
				if (desc.IsA("BasePart")) {
					desc.CanCollide = false;
					desc.CanTouch = false;
					desc.CanQuery = false;
					desc.CastShadow = false;
				}
			}
			const hrp = npc.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (hrp) {
				hrp.Anchored = true;
				hrp.CFrame = new CFrame(startPos);
				npc.Parent = Workspace;
				TweenService.Create(
					hrp,
					new TweenInfo(duration, Enum.EasingStyle.Linear),
					{ CFrame: new CFrame(endPos) },
				).Play();
			} else {
				npc.PivotTo(new CFrame(startPos));
				npc.Parent = Workspace;
			}
			return npc;
		}
		// Fallback: gray Part
		const fallback = new Instance("Model");
		const body = new Instance("Part");
		body.Name = "HumanoidRootPart";
		body.Size = new Vector3(1, 3, 1);
		body.Anchored = true;
		body.CanCollide = false;
		body.CanTouch = false;
		body.CanQuery = false;
		body.CastShadow = false;
		body.Color = Color3.fromRGB(150, 150, 150);
		body.CFrame = new CFrame(startPos);
		body.Parent = fallback;
		fallback.PrimaryPart = body;
		fallback.Parent = Workspace;
		TweenService.Create(
			body,
			new TweenInfo(duration, Enum.EasingStyle.Linear),
			{ CFrame: new CFrame(endPos) },
		).Play();
		return fallback;
	}

	private despawnNPCs(wave: Model[], activeList: Model[]) {
		for (const npc of wave) {
			if (npc.Parent) npc.Destroy();
		}
		// Remove from active list
		const waveSet = new Set(wave);
		const remaining = activeList.filter((n) => !waveSet.has(n));
		activeList.clear();
		for (const n of remaining) activeList.push(n);
	}
}
