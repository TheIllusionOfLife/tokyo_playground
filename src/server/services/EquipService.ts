import { OnStart, Service } from "@flamework/core";
import { Players, ServerStorage } from "@rbxts/services";
import { SHOP_CATALOG } from "shared/constants";

import { GlobalEvents } from "shared/network";
import { ItemCategory, ItemId } from "shared/types";
import { PlayerDataService } from "./PlayerDataService";

const COSMETICS_FOLDER = "Cosmetics";
const EQUIPPED_HAT_TAG = "EquippedHat";
const EQUIPPED_TRAIL_TAG = "EquippedTrail";
const EQUIP_COOLDOWN = 0.5; // seconds between equip requests

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
			// Apply for current character if already loaded
			if (player.Character) {
				this.applyCosmetics(player);
			}
			// Apply on future respawns
			const conn = player.CharacterAdded.Connect((character) => {
				const hrp = character.WaitForChild("HumanoidRootPart", 5);
				if (!hrp) {
					warn(
						`[EquipService] HumanoidRootPart timeout for ${player.Name}, skipping cosmetics`,
					);
					return;
				}
				this.applyCosmetics(player);
			});
			this.charAddedConns.set(player.UserId, conn);
		});

		Players.PlayerRemoving.Connect((player) => {
			const conn = this.charAddedConns.get(player.UserId);
			if (conn) {
				conn.Disconnect();
				this.charAddedConns.delete(player.UserId);
			}
			this.equipCooldowns.delete(player.UserId);
		});
	}

	private handleEquipRequest(player: Player, itemId: ItemId) {
		const ownedItems = this.playerDataService.getOwnedItems(player);
		if (!ownedItems.includes(itemId)) {
			return; // Not owned
		}

		const catalogItem = SHOP_CATALOG.find((item) => item.id === itemId);
		if (!catalogItem) return;

		const category = catalogItem.category;
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
		}
		// Emotes deferred (requires uploaded animation IDs)
	}

	private removeCosmetic(player: Player, category: ItemCategory) {
		const character = player.Character;
		if (!character) return;

		if (category === ItemCategory.Hat) {
			// Remove any previously equipped hat
			for (const child of character.GetChildren()) {
				if (child.IsA("Accessory") && child.FindFirstChild(EQUIPPED_HAT_TAG)) {
					child.Destroy();
				}
			}
		} else if (category === ItemCategory.Trail) {
			// Remove any previously equipped trail
			for (const child of character.GetDescendants()) {
				if (child.IsA("Trail") && child.Name === EQUIPPED_TRAIL_TAG) {
					child.Destroy();
				}
			}
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
		hat.Parent = character;
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

		trail.Parent = hrp;
	}
}
