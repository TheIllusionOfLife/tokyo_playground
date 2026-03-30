import { OnStart, Service } from "@flamework/core";
import { Players, ServerStorage } from "@rbxts/services";
import { SHOP_CATALOG, STAMP_REWARD_CATALOG } from "shared/constants";

import { GlobalEvents } from "shared/network";
import { ItemCategory, ItemId } from "shared/types";
import { PlayerDataService } from "./PlayerDataService";

const COSMETICS_FOLDER = "Cosmetics";
const EQUIPPED_HAT_TAG = "EquippedHat";
const EQUIPPED_TRAIL_TAG = "EquippedTrail";
const EQUIPPED_ACCESSORY_TAG = "EquippedAccessory"; // tag for non-hat accessories
const EQUIP_COOLDOWN = 0.5; // seconds between equip requests

// Accessory categories that use the clone-from-ServerStorage pattern
const ACCESSORY_CATEGORIES = new Set<ItemCategory>([
	ItemCategory.Back,
	ItemCategory.Face,
	ItemCategory.Front,
	ItemCategory.Neck,
	ItemCategory.Shoulder,
	ItemCategory.Waist,
]);

interface TrailStyle {
	lifetime?: number;
	lightEmission?: number;
	widthScale?: NumberSequence;
}

const TRAIL_STYLES: Partial<Record<ItemId, TrailStyle>> = {
	[ItemId.TrailCloudWalk]: {
		lifetime: 1.2,
		lightEmission: 0.8,
		widthScale: new NumberSequence([
			new NumberSequenceKeypoint(0, 1.5),
			new NumberSequenceKeypoint(1, 0.5),
		]),
	},
	[ItemId.TrailTrainSpark]: {
		lifetime: 0.4,
		lightEmission: 0.9,
		widthScale: new NumberSequence([
			new NumberSequenceKeypoint(0, 0.5),
			new NumberSequenceKeypoint(1, 0.05),
		]),
	},
	[ItemId.TrailCherryBlossom]: {
		lifetime: 1.5,
		lightEmission: 0.4,
		widthScale: new NumberSequence([
			new NumberSequenceKeypoint(0, 1.2),
			new NumberSequenceKeypoint(1, 0.3),
		]),
	},
	[ItemId.TrailMidnightSpark]: {
		lifetime: 0.3,
		lightEmission: 1,
		widthScale: new NumberSequence([
			new NumberSequenceKeypoint(0, 0.6),
			new NumberSequenceKeypoint(1, 0.02),
		]),
	},
};

// Trail particle meshes (AI-generated, emitted alongside Trail)
interface TrailParticle {
	meshId: string;
	textureId: string;
	color: ColorSequence;
	rate: number;
	lifetime: NumberRange;
	speed: NumberRange;
	size: NumberSequence;
	rotSpeed: NumberRange;
}

const TRAIL_PARTICLES: Partial<Record<ItemId, TrailParticle>> = {
	[ItemId.TrailStar]: {
		meshId: "rbxassetid://138401429655126",
		textureId: "rbxassetid://95146990943551",
		color: new ColorSequence(
			Color3.fromRGB(255, 230, 100),
			Color3.fromRGB(255, 180, 50),
		),
		rate: 6,
		lifetime: new NumberRange(0.6, 1.0),
		speed: new NumberRange(1, 3),
		size: new NumberSequence([
			new NumberSequenceKeypoint(0, 0.4),
			new NumberSequenceKeypoint(1, 0),
		]),
		rotSpeed: new NumberRange(-90, 90),
	},
	[ItemId.TrailCherryBlossom]: {
		meshId: "rbxassetid://113685548871910",
		textureId: "rbxassetid://103125221812825",
		color: new ColorSequence(
			Color3.fromRGB(255, 180, 200),
			Color3.fromRGB(255, 220, 230),
		),
		rate: 8,
		lifetime: new NumberRange(1.0, 1.8),
		speed: new NumberRange(0.5, 2),
		size: new NumberSequence([
			new NumberSequenceKeypoint(0, 0.5),
			new NumberSequenceKeypoint(1, 0.2),
		]),
		rotSpeed: new NumberRange(-120, 120),
	},
	[ItemId.TrailFlame]: {
		meshId: "rbxassetid://121452065855629",
		textureId: "rbxassetid://132445177887663",
		color: new ColorSequence(
			Color3.fromRGB(255, 100, 0),
			Color3.fromRGB(255, 50, 0),
		),
		rate: 10,
		lifetime: new NumberRange(0.3, 0.6),
		speed: new NumberRange(2, 5),
		size: new NumberSequence([
			new NumberSequenceKeypoint(0, 0.5),
			new NumberSequenceKeypoint(1, 0),
		]),
		rotSpeed: new NumberRange(-45, 45),
	},
	[ItemId.TrailMidnightSpark]: {
		meshId: "rbxassetid://98112913644461",
		textureId: "rbxassetid://97862077014638",
		color: new ColorSequence(
			Color3.fromRGB(100, 50, 200),
			Color3.fromRGB(180, 100, 255),
		),
		rate: 12,
		lifetime: new NumberRange(0.2, 0.4),
		speed: new NumberRange(3, 8),
		size: new NumberSequence([
			new NumberSequenceKeypoint(0, 0.3),
			new NumberSequenceKeypoint(1, 0),
		]),
		rotSpeed: new NumberRange(-180, 180),
	},
	[ItemId.TrailRainbow]: {
		meshId: "rbxassetid://108284978831991",
		textureId: "rbxassetid://125107947901149",
		color: new ColorSequence([
			new ColorSequenceKeypoint(0, Color3.fromRGB(255, 0, 0)),
			new ColorSequenceKeypoint(0.5, Color3.fromRGB(0, 255, 0)),
			new ColorSequenceKeypoint(1, Color3.fromRGB(0, 100, 255)),
		]),
		rate: 6,
		lifetime: new NumberRange(0.5, 1.0),
		speed: new NumberRange(1, 3),
		size: new NumberSequence([
			new NumberSequenceKeypoint(0, 0.4),
			new NumberSequenceKeypoint(1, 0.1),
		]),
		rotSpeed: new NumberRange(-60, 60),
	},
};

// Trail colors per item
const TRAIL_COLORS: Partial<Record<ItemId, ColorSequence>> = {
	[ItemId.TrailStar]: new ColorSequence(
		Color3.fromRGB(255, 255, 100),
		Color3.fromRGB(255, 200, 50),
	),
	[ItemId.TrailRainbow]: new ColorSequence([
		new ColorSequenceKeypoint(0, Color3.fromRGB(255, 0, 0)),
		new ColorSequenceKeypoint(0.2, Color3.fromRGB(255, 165, 0)),
		new ColorSequenceKeypoint(0.4, Color3.fromRGB(255, 255, 0)),
		new ColorSequenceKeypoint(0.6, Color3.fromRGB(0, 255, 0)),
		new ColorSequenceKeypoint(0.8, Color3.fromRGB(0, 100, 255)),
		new ColorSequenceKeypoint(1, Color3.fromRGB(148, 0, 211)),
	]),
	[ItemId.TrailFlame]: new ColorSequence(
		Color3.fromRGB(255, 100, 0),
		Color3.fromRGB(255, 50, 0),
	),
	[ItemId.TrailCloudWalk]: new ColorSequence([
		new ColorSequenceKeypoint(0, Color3.fromRGB(240, 245, 255)),
		new ColorSequenceKeypoint(0.5, Color3.fromRGB(200, 220, 255)),
		new ColorSequenceKeypoint(1, Color3.fromRGB(180, 210, 255)),
	]),
	[ItemId.TrailTrainSpark]: new ColorSequence([
		new ColorSequenceKeypoint(0, Color3.fromRGB(255, 200, 50)),
		new ColorSequenceKeypoint(0.3, Color3.fromRGB(255, 150, 0)),
		new ColorSequenceKeypoint(1, Color3.fromRGB(255, 100, 0)),
	]),
	[ItemId.TrailCherryBlossom]: new ColorSequence([
		new ColorSequenceKeypoint(0, Color3.fromRGB(255, 180, 200)),
		new ColorSequenceKeypoint(0.5, Color3.fromRGB(255, 150, 180)),
		new ColorSequenceKeypoint(1, Color3.fromRGB(255, 220, 230)),
	]),
	[ItemId.TrailMidnightSpark]: new ColorSequence([
		new ColorSequenceKeypoint(0, Color3.fromRGB(100, 50, 200)),
		new ColorSequenceKeypoint(0.5, Color3.fromRGB(60, 20, 150)),
		new ColorSequenceKeypoint(1, Color3.fromRGB(180, 100, 255)),
	]),
};

@Service()
export class EquipService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});
	private readonly charAddedConns = new Map<number, RBXScriptConnection>();
	private readonly equipCooldowns = new Map<number, number>();

	constructor(private readonly playerDataService: PlayerDataService) {}

	onStart() {
		print("[EquipService] Started");

		this.serverEvents.requestEquip.connect((player, itemId) => {
			const now = os.clock();
			if (now - (this.equipCooldowns.get(player.UserId) ?? 0) < EQUIP_COOLDOWN)
				return;
			this.equipCooldowns.set(player.UserId, now);
			this.handleEquipRequest(player, itemId);
		});

		// Apply cosmetics on character spawn (after profile is loaded)
		this.playerDataService.registerOnProfileLoaded((player) => {
			this.bindPlayerCosmetics(player);
		});

		// Bootstrap players whose profiles loaded before this service started
		for (const player of Players.GetPlayers()) {
			const data = this.playerDataService.getPlayerData(player);
			if (data && !this.charAddedConns.has(player.UserId)) {
				this.bindPlayerCosmetics(player);
			}
		}

		Players.PlayerRemoving.Connect((player) => {
			const conn = this.charAddedConns.get(player.UserId);
			if (conn) {
				conn.Disconnect();
				this.charAddedConns.delete(player.UserId);
			}
			this.equipCooldowns.delete(player.UserId);
		});
	}

	private bindPlayerCosmetics(player: Player) {
		// Apply for current character if already loaded
		if (player.Character) {
			this.applyCosmetics(player);
		}
		// Apply on future respawns
		const conn = player.CharacterAdded.Connect((character) => {
			const hrp = character.WaitForChild("HumanoidRootPart", 5);
			const head = character.WaitForChild("Head", 5);
			if (!hrp || !head) {
				warn(
					`[EquipService] Character parts timeout for ${player.Name}, skipping cosmetics`,
				);
				return;
			}
			this.applyCosmetics(player);
		});
		this.charAddedConns.set(player.UserId, conn);
	}

	private handleEquipRequest(player: Player, itemId: ItemId) {
		const catalogItem =
			SHOP_CATALOG.find((item) => item.id === itemId) ??
			STAMP_REWARD_CATALOG.find((item) => item.id === itemId);
		if (!catalogItem) return;

		const category = catalogItem.category;

		const ownedItems = this.playerDataService.getOwnedItems(player);
		if (!ownedItems.includes(itemId)) {
			this.serverEvents.equipResult.fire(player, false, category, undefined);
			return;
		}
		const equippedItems = this.playerDataService.getEquippedItems(player);

		// Toggle: if already equipped, unequip
		if (equippedItems[category] === itemId) {
			this.playerDataService.unequipItem(player, category);
			this.removeCosmetic(player, category);
			this.serverEvents.equipResult.fire(player, true, category, undefined);
		} else {
			// Equip new item (replaces previous in same category)
			this.removeCosmetic(player, category);
			this.playerDataService.equipItem(player, category, itemId);
			this.applyCosmetic(player, category, itemId);
			this.serverEvents.equipResult.fire(player, true, category, itemId);
		}
	}

	private applyCosmetics(player: Player) {
		const equippedItems = this.playerDataService.getEquippedItems(player);
		for (const [category, itemId] of pairs(equippedItems)) {
			if (itemId !== undefined) {
				this.applyCosmetic(player, category as ItemCategory, itemId as ItemId);
			}
		}
	}

	private applyCosmetic(
		player: Player,
		category: ItemCategory,
		itemId: ItemId,
	) {
		const character = player.Character;
		if (!character) return;

		if (category === ItemCategory.Hat) {
			this.applyHat(character, itemId);
		} else if (category === ItemCategory.Trail) {
			this.applyTrail(character, itemId);
		} else if (ACCESSORY_CATEGORIES.has(category)) {
			this.applyAccessory(character, itemId, category);
		}
	}

	private removeCosmetic(player: Player, category: ItemCategory) {
		const character = player.Character;
		if (!character) return;

		if (category === ItemCategory.Hat) {
			for (const child of character.GetChildren()) {
				if (child.IsA("Accessory") && child.FindFirstChild(EQUIPPED_HAT_TAG)) {
					child.Destroy();
				}
			}
		} else if (category === ItemCategory.Trail) {
			const particleName = EQUIPPED_TRAIL_TAG + "_particles";
			for (const child of character.GetDescendants()) {
				if (
					(child.IsA("Trail") && child.Name === EQUIPPED_TRAIL_TAG) ||
					(child.IsA("ParticleEmitter") && child.Name === particleName)
				) {
					child.Destroy();
				}
			}
		} else if (ACCESSORY_CATEGORIES.has(category)) {
			// Remove accessory tagged with this category
			for (const child of character.GetChildren()) {
				if (
					child.IsA("Accessory") &&
					child.FindFirstChild(EQUIPPED_ACCESSORY_TAG) &&
					child.GetAttribute("EquipCategory") === category
				) {
					child.Destroy();
				}
			}
		}
	}

	private applyAccessory(
		character: Model,
		itemId: ItemId,
		category: ItemCategory,
	) {
		const cosmeticsFolder = ServerStorage.FindFirstChild(COSMETICS_FOLDER);
		if (!cosmeticsFolder) {
			warn("[EquipService] Missing ServerStorage.Cosmetics folder");
			return;
		}
		const template = cosmeticsFolder.FindFirstChild(itemId);
		if (!template || !template.IsA("Accessory")) {
			warn(`[EquipService] Missing accessory: ${itemId}`);
			return;
		}

		// Remove existing avatar accessories in the same slot to prevent visual stacking
		const newAccType = template.AccessoryType;
		for (const child of character.GetChildren()) {
			if (
				child.IsA("Accessory") &&
				child.AccessoryType === newAccType &&
				!child.FindFirstChild(EQUIPPED_ACCESSORY_TAG) &&
				!child.FindFirstChild(EQUIPPED_HAT_TAG)
			) {
				child.Destroy();
			}
		}

		const accessory = template.Clone();
		const tag = new Instance("BoolValue");
		tag.Name = EQUIPPED_ACCESSORY_TAG;
		tag.Parent = accessory;
		accessory.SetAttribute("EquipCategory", category);

		const humanoid = character.FindFirstChildOfClass("Humanoid");
		if (humanoid) {
			humanoid.AddAccessory(accessory);
		} else {
			accessory.Parent = character;
		}
	}

	private applyHat(character: Model, itemId: ItemId) {
		// Clone from ServerStorage.Cosmetics
		const cosmeticsFolder = ServerStorage.FindFirstChild(COSMETICS_FOLDER);
		if (!cosmeticsFolder) {
			warn("[EquipService] Missing ServerStorage.Cosmetics folder");
			return;
		}
		const template = cosmeticsFolder.FindFirstChild(itemId);
		if (!template || !template.IsA("Accessory")) {
			warn(`[EquipService] Missing hat Accessory: ${itemId}`);
			return;
		}

		const hat = template.Clone();
		// Tag so we can identify equipped hats for removal
		const tag = new Instance("BoolValue");
		tag.Name = EQUIPPED_HAT_TAG;
		tag.Parent = hat;

		const humanoid = character.FindFirstChildOfClass("Humanoid");
		if (humanoid) {
			humanoid.AddAccessory(hat);
		} else {
			hat.Parent = character;
		}
	}

	private applyTrail(character: Model, itemId: ItemId) {
		const hrp = character.FindFirstChild("HumanoidRootPart") as
			| BasePart
			| undefined;
		const head = character.FindFirstChild("Head") as BasePart | undefined;
		if (!hrp || !head) return;

		// Find or create attachments for trail
		let att0 = hrp.FindFirstChild("TrailAttachment0") as Attachment | undefined;
		if (!att0) {
			att0 = new Instance("Attachment");
			att0.Name = "TrailAttachment0";
			att0.Position = new Vector3(0, 0, 0);
			att0.Parent = hrp;
		}

		let att1 = head.FindFirstChild("TrailAttachment1") as
			| Attachment
			| undefined;
		if (!att1) {
			att1 = new Instance("Attachment");
			att1.Name = "TrailAttachment1";
			att1.Position = new Vector3(0, 0, 0);
			att1.Parent = head;
		}

		const trail = new Instance("Trail");
		trail.Name = EQUIPPED_TRAIL_TAG;
		trail.Attachment0 = att0;
		trail.Attachment1 = att1;
		trail.Lifetime = 0.8;
		trail.MinLength = 0.1;
		trail.FaceCamera = true;
		trail.LightEmission = 0.5;
		trail.Transparency = new NumberSequence(0, 1);
		trail.WidthScale = new NumberSequence([
			new NumberSequenceKeypoint(0, 1),
			new NumberSequenceKeypoint(1, 0.2),
		]);

		const colorSeq = TRAIL_COLORS[itemId];
		if (colorSeq) {
			trail.Color = colorSeq;
		}

		const style = TRAIL_STYLES[itemId];
		if (style) {
			if (style.lifetime !== undefined) trail.Lifetime = style.lifetime;
			if (style.lightEmission !== undefined)
				trail.LightEmission = style.lightEmission;
			if (style.widthScale !== undefined) trail.WidthScale = style.widthScale;
		}

		trail.Parent = hrp;

		// Add particle emitter alongside trail if configured
		const particleCfg = TRAIL_PARTICLES[itemId];
		if (particleCfg) {
			const emitter = new Instance("ParticleEmitter");
			emitter.Name = EQUIPPED_TRAIL_TAG + "_particles";
			emitter.Color = particleCfg.color;
			emitter.Rate = particleCfg.rate;
			emitter.Lifetime = particleCfg.lifetime;
			emitter.Speed = particleCfg.speed;
			emitter.Size = particleCfg.size;
			emitter.RotSpeed = particleCfg.rotSpeed;
			emitter.Texture = particleCfg.textureId;
			emitter.SpreadAngle = new Vector2(30, 30);
			emitter.LightEmission = 0.6;
			emitter.Transparency = new NumberSequence([
				new NumberSequenceKeypoint(0, 0),
				new NumberSequenceKeypoint(0.8, 0.3),
				new NumberSequenceKeypoint(1, 1),
			]);
			emitter.Parent = att0;
		}
	}
}
