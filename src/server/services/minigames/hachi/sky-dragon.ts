/**
 * HachiRide sky dragon: spawning, movement, collectible, and cleanup.
 * The dragon flies a linear route, carrying a high-value collectible
 * that respawns each loop.
 */
import { ServerStorage, Workspace } from "@rbxts/services";
import {
	HACHI_FINAL_SPRINT_MULTIPLIER,
	HACHI_STAR_MESH_ID,
	SKY_DRAGON_BONUS_VALUE,
	SKY_DRAGON_COLLECTION_RADIUS,
	SKY_DRAGON_ROUTE_END,
	SKY_DRAGON_ROUTE_START,
	SKY_DRAGON_SCALE,
	SKY_DRAGON_SPEED,
	SKY_DRAGON_YAW_OFFSET,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import { HachiRidePlayerState, MissionId } from "shared/types";
import { MissionService } from "../../MissionService";
import { tryEvolve } from "./evolution";

type ServerEvents = ReturnType<typeof GlobalEvents.createServer>;

/** Mutable state owned by the sky dragon subsystem. */
export interface SkyDragonState {
	dragon?: Model;
	collectible?: BasePart;
	progress: number;
	collected: boolean;
	routeLength: number;
	spawned: boolean;
}

export function createSkyDragonState(): SkyDragonState {
	return {
		progress: 0,
		collected: false,
		routeLength: 0,
		spawned: false,
	};
}

/** Spawn the sky dragon model and its collectible. */
export function spawnSkyDragon(state: SkyDragonState) {
	const template = ServerStorage.FindFirstChild("WhiteDragonTemplate") as
		| Model
		| undefined;
	if (!template) {
		warn("[HachiRide] WhiteDragonTemplate not found in ServerStorage");
		return;
	}

	const dragon = template.Clone();
	dragon.Name = "SkyDragon";
	dragon.ScaleTo(SKY_DRAGON_SCALE);

	for (const desc of dragon.GetDescendants()) {
		if (desc.IsA("BasePart")) {
			desc.Anchored = true;
			desc.CanCollide = true;
			desc.CanTouch = false;
			desc.CanQuery = false;
			desc.CastShadow = false;
			desc.Transparency = 0;
		}
	}

	const body = dragon.FindFirstChild("Body") as BasePart | undefined;
	if (body) {
		dragon.PrimaryPart = body;

		const light = new Instance("PointLight");
		light.Color = Color3.fromRGB(255, 240, 200);
		light.Brightness = 3;
		light.Range = 120;
		light.Parent = body;

		const aura = new Instance("ParticleEmitter");
		aura.Name = "DivineAura";
		aura.Rate = 30;
		aura.Lifetime = new NumberRange(1, 2);
		aura.Speed = new NumberRange(2, 6);
		aura.SpreadAngle = new Vector2(180, 180);
		aura.LightEmission = 1;
		aura.LightInfluence = 0;
		aura.Brightness = 3;
		aura.Size = new NumberSequence([
			new NumberSequenceKeypoint(0, 3),
			new NumberSequenceKeypoint(0.5, 1.5),
			new NumberSequenceKeypoint(1, 0),
		]);
		aura.Transparency = new NumberSequence([
			new NumberSequenceKeypoint(0, 0.3),
			new NumberSequenceKeypoint(0.5, 0.6),
			new NumberSequenceKeypoint(1, 1),
		]);
		aura.Color = new ColorSequence(
			Color3.fromRGB(255, 255, 255),
			Color3.fromRGB(255, 220, 100),
		);
		aura.RotSpeed = new NumberRange(-60, 60);
		aura.Parent = body;

		const trailAttach0 = new Instance("Attachment");
		trailAttach0.Position = new Vector3(0, 0, body.Size.Z / 2);
		trailAttach0.Parent = body;

		const trailAttach1 = new Instance("Attachment");
		trailAttach1.Position = new Vector3(0, 0, -body.Size.Z / 2);
		trailAttach1.Parent = body;

		const trail = new Instance("Trail");
		trail.Attachment0 = trailAttach0;
		trail.Attachment1 = trailAttach1;
		trail.Lifetime = 3;
		trail.MinLength = 0.1;
		trail.FaceCamera = true;
		trail.LightEmission = 0.8;
		trail.Transparency = new NumberSequence([
			new NumberSequenceKeypoint(0, 0.2),
			new NumberSequenceKeypoint(0.5, 0.5),
			new NumberSequenceKeypoint(1, 1),
		]);
		trail.Color = new ColorSequence([
			new ColorSequenceKeypoint(0, Color3.fromRGB(255, 255, 255)),
			new ColorSequenceKeypoint(0.5, Color3.fromRGB(255, 220, 100)),
			new ColorSequenceKeypoint(1, Color3.fromRGB(255, 180, 50)),
		]);
		trail.WidthScale = new NumberSequence([
			new NumberSequenceKeypoint(0, 1),
			new NumberSequenceKeypoint(1, 0.3),
		]);
		trail.Parent = body;
	}

	const dir = SKY_DRAGON_ROUTE_END.sub(SKY_DRAGON_ROUTE_START).Unit;
	state.routeLength = SKY_DRAGON_ROUTE_END.sub(
		SKY_DRAGON_ROUTE_START,
	).Magnitude;
	const yawRad = math.atan2(-dir.X, -dir.Z) + math.rad(SKY_DRAGON_YAW_OFFSET);
	const startCF = new CFrame(SKY_DRAGON_ROUTE_START).mul(
		CFrame.Angles(0, yawRad, 0),
	);
	dragon.PivotTo(startCF);
	dragon.Parent = Workspace;

	state.dragon = dragon;
	state.progress = 0;
	state.collected = false;

	createDragonCollectible(state);

	print(
		`[HachiRide] Sky Dragon spawned. Route length: ${math.floor(state.routeLength)} studs`,
	);
}

function createDragonCollectible(state: SkyDragonState) {
	const part = new Instance("Part");
	part.Name = "DragonTreasure";
	part.Size = new Vector3(8, 8, 8);
	part.Shape = Enum.PartType.Ball;
	part.Anchored = true;
	part.CanCollide = false;
	part.CanTouch = false;
	part.CanQuery = true;
	part.CastShadow = false;
	part.Material = Enum.Material.Neon;
	part.Color = Color3.fromRGB(255, 100, 100);
	part.Transparency = 0;

	const mesh = new Instance("SpecialMesh");
	mesh.MeshType = Enum.MeshType.FileMesh;
	mesh.MeshId = HACHI_STAR_MESH_ID;
	mesh.Scale = new Vector3(3, 3, 3);
	mesh.Parent = part;

	const pLight = new Instance("PointLight");
	pLight.Color = Color3.fromRGB(255, 255, 255);
	pLight.Brightness = 5;
	pLight.Range = 60;
	pLight.Parent = part;

	const emitter = new Instance("ParticleEmitter");
	emitter.Name = "TreasureGlow";
	emitter.Rate = 20;
	emitter.Lifetime = new NumberRange(0.5, 1);
	emitter.Speed = new NumberRange(2, 5);
	emitter.SpreadAngle = new Vector2(180, 180);
	emitter.LightEmission = 1;
	emitter.LightInfluence = 0;
	emitter.Brightness = 4;
	emitter.Size = new NumberSequence([
		new NumberSequenceKeypoint(0, 1.5),
		new NumberSequenceKeypoint(0.5, 0.5),
		new NumberSequenceKeypoint(1, 0),
	]);
	emitter.Transparency = new NumberSequence([
		new NumberSequenceKeypoint(0, 0),
		new NumberSequenceKeypoint(0.5, 0.3),
		new NumberSequenceKeypoint(1, 1),
	]);
	emitter.Color = new ColorSequence([
		new ColorSequenceKeypoint(0, Color3.fromRGB(255, 50, 50)),
		new ColorSequenceKeypoint(0.17, Color3.fromRGB(255, 165, 0)),
		new ColorSequenceKeypoint(0.33, Color3.fromRGB(255, 255, 50)),
		new ColorSequenceKeypoint(0.5, Color3.fromRGB(50, 255, 50)),
		new ColorSequenceKeypoint(0.67, Color3.fromRGB(50, 150, 255)),
		new ColorSequenceKeypoint(0.83, Color3.fromRGB(150, 50, 255)),
		new ColorSequenceKeypoint(1, Color3.fromRGB(255, 50, 200)),
	]);
	emitter.Parent = part;

	part.Parent = Workspace;
	state.collectible = part;
}

/** Advance the dragon along its route and check player collection. */
export function tickSkyDragon(
	ds: SkyDragonState,
	dt: number,
	playerStates: Map<number, HachiRidePlayerState>,
	playerObjects: Map<number, Player>,
	hachiModels: Map<number, Model>,
	finalSprintStarted: boolean,
	serverEvents: ServerEvents,
	missionService: MissionService,
) {
	if (!ds.dragon || !ds.dragon.PrimaryPart) return;

	ds.progress += (SKY_DRAGON_SPEED * dt) / ds.routeLength;

	if (ds.progress >= 1) {
		ds.progress -= 1;
		ds.collected = false;
		if (ds.collectible) {
			ds.collectible.Transparency = 0;
			const glow = ds.collectible.FindFirstChild("TreasureGlow") as
				| ParticleEmitter
				| undefined;
			if (glow) glow.Enabled = true;
			const treasureLight = ds.collectible.FindFirstChildWhichIsA("PointLight");
			if (treasureLight) treasureLight.Enabled = true;
		}
	}

	const pos = SKY_DRAGON_ROUTE_START.Lerp(SKY_DRAGON_ROUTE_END, ds.progress);
	const dir = SKY_DRAGON_ROUTE_END.sub(SKY_DRAGON_ROUTE_START).Unit;
	const yawRad = math.atan2(-dir.X, -dir.Z) + math.rad(SKY_DRAGON_YAW_OFFSET);
	const dragonCF = new CFrame(pos).mul(CFrame.Angles(0, yawRad, 0));
	ds.dragon.PivotTo(dragonCF);

	if (ds.collectible) {
		const body = ds.dragon.PrimaryPart;
		const collectiblePos = body.Position.add(
			new Vector3(0, body.Size.Y / 2 + 10, 0),
		);
		ds.collectible.CFrame = new CFrame(collectiblePos).mul(
			CFrame.Angles(0, os.clock() * 2, 0),
		);
		const hue = (os.clock() * 0.5) % 1;
		ds.collectible.Color = Color3.fromHSV(hue, 0.8, 1);
	}

	if (!ds.collected && ds.collectible) {
		for (const [userId, state] of playerStates) {
			const player = playerObjects.get(userId);
			if (!player?.Character) continue;
			const hrp = player.Character.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (!hrp) continue;

			const dist = hrp.Position.sub(ds.collectible.Position).Magnitude;
			if (dist <= SKY_DRAGON_COLLECTION_RADIUS) {
				ds.collected = true;
				ds.collectible.Transparency = 1;
				const glow = ds.collectible.FindFirstChild("TreasureGlow") as
					| ParticleEmitter
					| undefined;
				if (glow) glow.Enabled = false;
				const treasureLight =
					ds.collectible.FindFirstChildWhichIsA("PointLight");
				if (treasureLight) treasureLight.Enabled = false;

				const dragonValue = finalSprintStarted
					? SKY_DRAGON_BONUS_VALUE * HACHI_FINAL_SPRINT_MULTIPLIER
					: SKY_DRAGON_BONUS_VALUE;
				state.itemCount += dragonValue;
				state.catchCount = state.itemCount;
				serverEvents.hachiItemCollected.fire(player, state.itemCount);
				serverEvents.hachiBonusCollected.fire(player);
				serverEvents.hintTextChanged.broadcast("hint_dragon_collected", [
					player.Name,
					`${dragonValue}`,
				]);
				missionService.incrementAndNotify(
					player,
					MissionId.CollectBonusItem,
					1,
				);
				tryEvolve(state, player, hachiModels.get(userId), serverEvents);

				print(
					`[HachiRide] ${player.Name} collected Dragon Treasure! +${dragonValue} pts`,
				);
				break;
			}
		}
	}
}

/** Destroy dragon and collectible, reset state. */
export function cleanupSkyDragon(state: SkyDragonState) {
	if (state.dragon) {
		state.dragon.Destroy();
		state.dragon = undefined;
	}
	if (state.collectible) {
		state.collectible.Destroy();
		state.collectible = undefined;
	}
	state.progress = 0;
	state.collected = false;
	state.spawned = false;
}
