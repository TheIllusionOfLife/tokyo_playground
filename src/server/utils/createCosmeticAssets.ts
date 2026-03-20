import { ServerStorage } from "@rbxts/services";

const COSMETICS_FOLDER = "Cosmetics";

interface HatPartDef {
	shape: Enum.PartType;
	size: Vector3;
	color: Color3;
	material?: Enum.Material;
	offset: Vector3;
}

interface HatConfig {
	name: string;
	parts: HatPartDef[];
}

const HAT_DEFS: HatConfig[] = [
	{
		name: "HatCone",
		parts: [
			{
				shape: Enum.PartType.Cylinder,
				size: new Vector3(2.5, 2, 2),
				color: Color3.fromRGB(255, 140, 0),
				offset: new Vector3(0, 1.5, 0),
			},
			{
				shape: Enum.PartType.Cylinder,
				size: new Vector3(0.3, 2.2, 2.2),
				color: Color3.fromRGB(255, 255, 255),
				offset: new Vector3(0, 0.8, 0),
			},
		],
	},
	{
		name: "HatCrown",
		parts: [
			{
				shape: Enum.PartType.Block,
				size: new Vector3(1.6, 1, 1.6),
				color: Color3.fromRGB(255, 215, 0),
				material: Enum.Material.Neon,
				offset: new Vector3(0, 1.0, 0),
			},
		],
	},
	{
		name: "HatBucket",
		parts: [
			{
				shape: Enum.PartType.Cylinder,
				size: new Vector3(1.2, 2.8, 2.8),
				color: Color3.fromRGB(150, 150, 160),
				offset: new Vector3(0, 0.6, 0),
			},
			{
				shape: Enum.PartType.Cylinder,
				size: new Vector3(0.8, 1.8, 1.8),
				color: Color3.fromRGB(150, 150, 160),
				offset: new Vector3(0, 1.0, 0),
			},
		],
	},
	{
		name: "HatAlleyCatEars",
		parts: [
			{
				shape: Enum.PartType.Block,
				size: new Vector3(1.8, 0.2, 0.3),
				color: Color3.fromRGB(30, 30, 30),
				offset: new Vector3(0, 0.7, 0),
			},
			{
				shape: Enum.PartType.Block,
				size: new Vector3(0.5, 0.6, 0.3),
				color: Color3.fromRGB(30, 30, 30),
				material: Enum.Material.Neon,
				offset: new Vector3(-0.5, 1.2, 0),
			},
			{
				shape: Enum.PartType.Block,
				size: new Vector3(0.5, 0.6, 0.3),
				color: Color3.fromRGB(30, 30, 30),
				material: Enum.Material.Neon,
				offset: new Vector3(0.5, 1.2, 0),
			},
		],
	},
	{
		name: "HatNeonVisor",
		parts: [
			{
				shape: Enum.PartType.Block,
				size: new Vector3(1.8, 0.3, 0.6),
				color: Color3.fromRGB(0, 255, 255),
				material: Enum.Material.Neon,
				offset: new Vector3(0, 0.8, -0.3),
			},
		],
	},
	{
		name: "HatSunsetCrown",
		parts: [
			{
				shape: Enum.PartType.Block,
				size: new Vector3(1.6, 1, 1.6),
				color: Color3.fromRGB(255, 140, 50),
				material: Enum.Material.Neon,
				offset: new Vector3(0, 1.0, 0),
			},
		],
	},
];

/** Creates placeholder hat Accessory models in ServerStorage.Cosmetics if missing. */
export function createCosmeticAssets() {
	const existing = ServerStorage.FindFirstChild(COSMETICS_FOLDER);
	let folder: Folder;
	if (existing?.IsA("Folder")) {
		folder = existing;
	} else {
		folder = new Instance("Folder");
		folder.Name = COSMETICS_FOLDER;
		folder.Parent = ServerStorage;
	}

	for (const def of HAT_DEFS) {
		if (folder.FindFirstChild(def.name)) continue;

		const accessory = new Instance("Accessory");
		accessory.Name = def.name;

		// First part definition becomes the Handle (required by Roblox Accessory)
		const primary = def.parts[0];
		const handle = new Instance("Part");
		handle.Name = "Handle";
		handle.Shape = primary.shape;
		handle.Size = primary.size;
		handle.Color = primary.color;
		if (primary.material) handle.Material = primary.material;
		handle.Anchored = false;
		handle.CanCollide = false;
		handle.Parent = accessory;

		const attachment = new Instance("Attachment");
		attachment.Name = "HatAttachment";
		attachment.Position = primary.offset;
		attachment.Parent = handle;

		// Additional parts are welded to Handle
		for (let i = 1; i < def.parts.size(); i++) {
			const partDef = def.parts[i];
			const extra = new Instance("Part");
			extra.Name = `Part_${i}`;
			extra.Shape = partDef.shape;
			extra.Size = partDef.size;
			extra.Color = partDef.color;
			if (partDef.material) extra.Material = partDef.material;
			extra.Anchored = false;
			extra.CanCollide = false;
			extra.Parent = handle;

			const weld = new Instance("Weld");
			weld.Part0 = handle;
			weld.Part1 = extra;
			weld.C1 = new CFrame(partDef.offset.sub(primary.offset));
			weld.Parent = extra;
		}

		accessory.Parent = folder;
		print(`[Cosmetics] Created hat: ${def.name} (${def.parts.size()} parts)`);
	}
}
