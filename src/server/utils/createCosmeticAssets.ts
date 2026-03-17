import { ServerStorage } from "@rbxts/services";

const COSMETICS_FOLDER = "Cosmetics";

interface HatDef {
	name: string;
	shape: Enum.PartType;
	size: Vector3;
	color: Color3;
	offset: Vector3;
}

const HAT_DEFS: HatDef[] = [
	{
		name: "HatCone",
		shape: Enum.PartType.Cylinder,
		size: new Vector3(1.5, 1.2, 1.2),
		color: Color3.fromRGB(255, 200, 50),
		offset: new Vector3(0, 1.2, 0),
	},
	{
		name: "HatCrown",
		shape: Enum.PartType.Block,
		size: new Vector3(1.4, 0.8, 1.4),
		color: Color3.fromRGB(255, 215, 0),
		offset: new Vector3(0, 1.0, 0),
	},
	{
		name: "HatBucket",
		shape: Enum.PartType.Cylinder,
		size: new Vector3(0.8, 1.6, 1.6),
		color: Color3.fromRGB(90, 130, 80),
		offset: new Vector3(0, 0.9, 0),
	},
];

/** Creates placeholder hat Accessory models in ServerStorage.Cosmetics if missing. */
export function createCosmeticAssets() {
	let folder = ServerStorage.FindFirstChild(COSMETICS_FOLDER) as
		| Folder
		| undefined;
	if (!folder) {
		folder = new Instance("Folder");
		folder.Name = COSMETICS_FOLDER;
		folder.Parent = ServerStorage;
	}

	for (const def of HAT_DEFS) {
		if (folder.FindFirstChild(def.name)) continue;

		const accessory = new Instance("Accessory");
		accessory.Name = def.name;

		const handle = new Instance("Part");
		handle.Name = "Handle";
		handle.Shape = def.shape;
		handle.Size = def.size;
		handle.Color = def.color;
		handle.Anchored = false;
		handle.CanCollide = false;
		handle.Parent = accessory;

		const attachment = new Instance("Attachment");
		attachment.Name = "HatAttachment";
		attachment.Position = def.offset;
		attachment.Parent = handle;

		accessory.Parent = folder;
		print(`[Cosmetics] Created placeholder hat: ${def.name}`);
	}
}
