import { OnStart, Service } from "@flamework/core";
import { ServerStorage, TweenService, Workspace } from "@rbxts/services";

const CROWD_WAVE_INTERVAL = 18; // seconds between crowd waves
const CROWD_WAVE_DURATION = 12; // seconds for NPCs to cross
const CROWD_NPCS_PER_PATH = 2; // reduced for lobby performance
const CAR_WAVE_DURATION = 10; // seconds for cars to cross
const TRAFFIC_GAP = 2; // seconds between car and crowd phases
const FADE_OUT_DURATION = 1; // seconds for NPC fade-out

@Service()
export class AmbientCityService implements OnStart {
	private running = false;
	private loopGeneration = 0;
	private activeCrowdNPCs: Model[] = [];
	private activeCarNPCs: Model[] = [];
	private fadingModels = new Set<Model>();

	onStart() {
		print("[AmbientCityService] Started");
		this.start();
	}

	start() {
		if (this.running) return;
		this.running = true;
		this.loopGeneration += 1;
		const gen = this.loopGeneration;
		task.spawn(() => this.runTrafficLoop(gen));
	}

	stop() {
		this.running = false;
		this.destroyAllAmbientActors();
	}

	/** Immediately destroy all spawned NPCs and cars, including those mid-fade. */
	destroyAllAmbientActors() {
		for (const npc of this.activeCrowdNPCs) {
			if (npc.Parent) npc.Destroy();
		}
		this.activeCrowdNPCs = [];

		for (const car of this.activeCarNPCs) {
			if (car.Parent) car.Destroy();
		}
		this.activeCarNPCs = [];

		for (const model of this.fadingModels) {
			if (model.Parent) model.Destroy();
		}
		this.fadingModels.clear();
	}

	/** Alternating traffic loop: cars → gap → pedestrians → gap → repeat */
	private runTrafficLoop(gen: number) {
		// Initial delay before first wave so actors don't pop in immediately on join
		task.wait(TRAFFIC_GAP);
		while (this.running && this.loopGeneration === gen) {
			// Car phase
			const carWave = this.spawnCarWave();
			task.wait(CAR_WAVE_DURATION);
			if (!this.running || this.loopGeneration !== gen) break;
			this.fadeAndDestroy(carWave, this.activeCarNPCs);

			task.wait(TRAFFIC_GAP);
			if (!this.running || this.loopGeneration !== gen) break;

			// Crowd phase
			const crowdWave = this.spawnCrowdWave();
			task.wait(CROWD_WAVE_DURATION);
			if (!this.running || this.loopGeneration !== gen) break;
			this.fadeAndDestroy(crowdWave, this.activeCrowdNPCs);

			task.wait(TRAFFIC_GAP);
			if (!this.running || this.loopGeneration !== gen) break;
		}
	}

	private spawnCrowdWave(): Model[] {
		const waypointsFolder =
			Workspace.FindFirstChild("CrowdWaypoints") ??
			ServerStorage.FindFirstChild("CrowdWaypoints");
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

		const rawDir = endPart.Position.sub(startPart.Position);
		const carDir = rawDir.Magnitude > 0.1 ? rawDir : new Vector3(0, 0, 1);
		car.PivotTo(
			CFrame.lookAt(startPart.Position, startPart.Position.add(carDir)),
		);
		car.Parent = Workspace;

		if (primary) {
			TweenService.Create(
				primary,
				new TweenInfo(CAR_WAVE_DURATION, Enum.EasingStyle.Linear),
				{
					CFrame: CFrame.lookAt(endPart.Position, endPart.Position.add(carDir)),
				},
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
		const rawDir = endPos.sub(startPos);
		const dir = rawDir.Magnitude > 0.1 ? rawDir : new Vector3(0, 0, 1);

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
				hrp.CFrame = CFrame.lookAt(startPos, startPos.add(dir));
				npc.Parent = Workspace;
				TweenService.Create(
					hrp,
					new TweenInfo(duration, Enum.EasingStyle.Linear),
					{ CFrame: CFrame.lookAt(endPos, endPos.add(dir)) },
				).Play();
			} else {
				npc.PivotTo(CFrame.lookAt(startPos, startPos.add(dir)));
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
		body.CFrame = CFrame.lookAt(startPos, startPos.add(dir));
		body.Parent = fallback;
		fallback.PrimaryPart = body;
		fallback.Parent = Workspace;
		TweenService.Create(
			body,
			new TweenInfo(duration, Enum.EasingStyle.Linear),
			{ CFrame: CFrame.lookAt(endPos, endPos.add(dir)) },
		).Play();
		return fallback;
	}

	/** Fade out NPCs/cars over 1s, then destroy. Tracks fading models for safe cleanup. */
	private fadeAndDestroy(wave: Model[], activeList: Model[]) {
		// Remove from active list immediately so next-wave timing isn't blocked
		const waveSet = new Set(wave);
		const remaining = activeList.filter((n) => !waveSet.has(n));
		activeList.clear();
		for (const n of remaining) activeList.push(n);

		// Track fading models so stop() can destroy them mid-fade
		for (const model of wave) {
			this.fadingModels.add(model);
		}

		// Fade out all parts
		for (const model of wave) {
			for (const desc of model.GetDescendants()) {
				if (desc.IsA("BasePart")) {
					TweenService.Create(
						desc,
						new TweenInfo(FADE_OUT_DURATION, Enum.EasingStyle.Linear),
						{ Transparency: 1 },
					).Play();
				} else if (desc.IsA("ParticleEmitter") || desc.IsA("Trail")) {
					desc.Enabled = false;
				}
			}
		}

		// Destroy after fade completes
		task.delay(FADE_OUT_DURATION + 0.1, () => {
			for (const model of wave) {
				this.fadingModels.delete(model);
				if (model.Parent) model.Destroy();
			}
		});
	}
}
