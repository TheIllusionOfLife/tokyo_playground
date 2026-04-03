/**
 * HachiRide collectible utilities: item creation, spawn position generation,
 * and geometry helpers. Pure functions with no class state dependency.
 */
import { Workspace } from "@rbxts/services";
import {
	HACHI_BLDG_MAX_X,
	HACHI_BLDG_MAX_Z,
	HACHI_BLDG_MIN_X,
	HACHI_BLDG_MIN_Z,
	HACHI_CITY_CENTER,
	HACHI_COIN_MESH_ID,
	HACHI_COIN_TEXTURE_ID,
	HACHI_SKY_DROP_CENTER_BIAS,
	HACHI_SKY_DROP_DENSE_RADIUS,
	HACHI_SKY_DROP_GROUND_Y,
	HACHI_SKY_DROP_MAX_Y,
	HACHI_SKY_DROP_MIN_Y,
	HACHI_STAR_MESH_ID,
	HACHI_STAR_TEXTURE_ID,
} from "shared/constants";

/** Create a collectible part (coin or star) at a given position. */
export function createCollectible(
	position: Vector3,
	size: Vector3,
	isBonus = false,
): BasePart {
	const part = new Instance("Part");
	part.Size = size;
	part.Transparency = 1;
	part.Anchored = true;
	part.CanCollide = false;
	part.CanTouch = false;
	part.CanQuery = false;
	part.CastShadow = false;
	part.Material = Enum.Material.Neon;
	if (!isBonus) {
		part.CFrame = new CFrame(position).mul(CFrame.Angles(math.rad(90), 0, 0));
	} else {
		part.Position = position;
	}

	const mesh = new Instance("SpecialMesh");
	mesh.MeshType = Enum.MeshType.FileMesh;
	mesh.MeshId = isBonus ? HACHI_STAR_MESH_ID : HACHI_COIN_MESH_ID;
	mesh.TextureId = isBonus ? HACHI_STAR_TEXTURE_ID : HACHI_COIN_TEXTURE_ID;
	const nativeSize = isBonus ? 5 : 2;
	const scaleFactor = size.X / nativeSize;
	mesh.Scale = new Vector3(scaleFactor, scaleFactor, scaleFactor);
	mesh.Parent = part;

	const emitter = new Instance("ParticleEmitter");
	emitter.Name = "Shine";
	emitter.Rate = isBonus ? 8 : 4;
	emitter.Lifetime = new NumberRange(0.4, 0.8);
	emitter.Speed = new NumberRange(1, 3);
	emitter.SpreadAngle = new Vector2(180, 180);
	emitter.LightEmission = 1;
	emitter.LightInfluence = 0;
	emitter.Brightness = isBonus ? 2 : 1.5;
	emitter.Size = new NumberSequence([
		new NumberSequenceKeypoint(0, isBonus ? 0.8 : 0.4),
		new NumberSequenceKeypoint(0.5, isBonus ? 0.3 : 0.15),
		new NumberSequenceKeypoint(1, 0),
	]);
	emitter.Transparency = new NumberSequence([
		new NumberSequenceKeypoint(0, 0.2),
		new NumberSequenceKeypoint(0.5, 0.5),
		new NumberSequenceKeypoint(1, 1),
	]);
	emitter.Color = isBonus
		? new ColorSequence(
				Color3.fromRGB(255, 220, 50),
				Color3.fromRGB(255, 180, 0),
			)
		: new ColorSequence(
				Color3.fromRGB(80, 255, 120),
				Color3.fromRGB(30, 200, 60),
			);
	emitter.RotSpeed = new NumberRange(-120, 120);
	emitter.Enabled = false;
	emitter.Parent = part;

	part.Parent = Workspace;
	return part;
}

/** Raycast downward to find the surface Y at a given XZ position. */
export function raycastLandingY(x: number, z: number): number {
	const origin = new Vector3(x, HACHI_SKY_DROP_MAX_Y + 50, z);
	const direction = new Vector3(0, -(HACHI_SKY_DROP_MAX_Y + 100), 0);
	const result = Workspace.Raycast(origin, direction);
	if (result) {
		return result.Position.Y + 2;
	}
	return HACHI_SKY_DROP_GROUND_Y + 2;
}

/** Read CityBoundary polygon vertices from Workspace (fallback to AABB). */
export function getCityPolygon(): Vector2[] {
	const folder = Workspace.FindFirstChild("CityBoundary");
	if (!folder) return [];
	const verts: { idx: number; pos: Vector2 }[] = [];
	for (const child of folder.GetChildren()) {
		if (!child.IsA("BasePart")) continue;
		const [numStr] = child.Name.match("^Vertex_(%d+)$");
		if (numStr === undefined) continue;
		const idx = tonumber(numStr) ?? 0;
		verts.push({ idx, pos: new Vector2(child.Position.X, child.Position.Z) });
	}
	verts.sort((a, b) => a.idx < b.idx);
	return verts.map((v) => v.pos);
}

/** Point-in-polygon test using ray casting algorithm (2D, XZ plane). */
export function isInsidePolygon(point: Vector2, polygon: Vector2[]): boolean {
	const n = polygon.size();
	if (n < 3) return true;
	let inside = false;
	for (let i = 0, j = n - 1; i < n; j = i++) {
		const pi = polygon[i];
		const pj = polygon[j];
		if (
			pi.Y > point.Y !== pj.Y > point.Y &&
			point.X < ((pj.X - pi.X) * (point.Y - pi.Y)) / (pj.Y - pi.Y) + pi.X
		) {
			inside = !inside;
		}
	}
	return inside;
}

/** Generate random spawn positions within the city polygon or AABB fallback. */
export function generateSpawnPositions(count: number): Vector3[] {
	const polygon = getCityPolygon();
	const usePolygon = polygon.size() >= 3;

	let aabbMinX = HACHI_BLDG_MIN_X;
	let aabbMaxX = HACHI_BLDG_MAX_X;
	let aabbMinZ = HACHI_BLDG_MIN_Z;
	let aabbMaxZ = HACHI_BLDG_MAX_Z;
	if (usePolygon) {
		aabbMinX = math.huge;
		aabbMaxX = -math.huge;
		aabbMinZ = math.huge;
		aabbMaxZ = -math.huge;
		for (const v of polygon) {
			if (v.X < aabbMinX) aabbMinX = v.X;
			if (v.X > aabbMaxX) aabbMaxX = v.X;
			if (v.Y < aabbMinZ) aabbMinZ = v.Y;
			if (v.Y > aabbMaxZ) aabbMaxZ = v.Y;
		}
	}

	const positions: Vector3[] = [];
	const centerCount = math.floor(count * HACHI_SKY_DROP_CENTER_BIAS);
	const cityCount = count - centerCount;
	const maxAttempts = count * 5;
	let attempts = 0;

	while (positions.size() < cityCount && attempts < maxAttempts) {
		attempts++;
		const x = aabbMinX + math.random() * (aabbMaxX - aabbMinX);
		const z = aabbMinZ + math.random() * (aabbMaxZ - aabbMinZ);
		if (usePolygon && !isInsidePolygon(new Vector2(x, z), polygon)) {
			continue;
		}
		const y = math.random(HACHI_SKY_DROP_MIN_Y, HACHI_SKY_DROP_MAX_Y);
		positions.push(new Vector3(x, y, z));
	}

	const remaining = cityCount + centerCount - positions.size();
	attempts = 0;
	while (
		positions.size() < cityCount + centerCount &&
		attempts < remaining * 5
	) {
		attempts++;
		const angle = math.random() * math.pi * 2;
		const r = math.random() * HACHI_SKY_DROP_DENSE_RADIUS;
		const x = HACHI_CITY_CENTER.X + math.cos(angle) * r;
		const z = HACHI_CITY_CENTER.Z + math.sin(angle) * r;
		if (usePolygon && !isInsidePolygon(new Vector2(x, z), polygon)) {
			continue;
		}
		const y = math.random(HACHI_SKY_DROP_MIN_Y, HACHI_SKY_DROP_MAX_Y);
		positions.push(new Vector3(x, y, z));
	}

	return positions;
}

/** Fisher-Yates shuffle, returns the same array mutated. */
export function shuffle<T>(arr: T[]): T[] {
	for (let i = arr.size() - 1; i > 0; i--) {
		const j = math.floor(math.random() * (i + 1));
		const tmp = arr[i];
		arr[i] = arr[j];
		arr[j] = tmp;
	}
	return arr;
}
