import React, { useState } from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { clientEvents } from "client/network";
import { VEHICLE_ICON_IDS } from "shared/constants";
import { t } from "shared/localization";
import {
	L_SHOP,
	L_SHOP_BALANCE,
	L_SHOP_BUY,
	L_SHOP_EQUIP,
	L_SHOP_NEED_PTS,
	L_SHOP_TAB_ACCESSORY,
	L_SHOP_TRY_ON,
	L_SHOP_UNEQUIP,
	L_VEHICLE_TAB,
} from "shared/localization/keys";
import { GameStoreState, gameStore } from "shared/store/game-store";
import { MatchPhase, ShopItemData, VehicleShopData } from "shared/types";

interface VehicleDisplayInfo {
	emoji: string;
	accentColor: Color3;
	familyTag: string;
}

const VEHICLE_DISPLAY: Map<string, VehicleDisplayInfo> = new Map([
	// Quadruped (Animal)
	[
		"DefaultHachi",
		{
			emoji: "\u{1F436}",
			accentColor: Color3.fromRGB(180, 120, 60),
			familyTag: "vehicle_family_animal",
		},
	],
	[
		"WhiteCat",
		{
			emoji: "\u{1F431}",
			accentColor: Color3.fromRGB(180, 120, 60),
			familyTag: "vehicle_family_animal",
		},
	],
	[
		"CalicoCat",
		{
			emoji: "\u{1F408}",
			accentColor: Color3.fromRGB(180, 120, 60),
			familyTag: "vehicle_family_animal",
		},
	],
	[
		"Bear",
		{
			emoji: "\u{1F43B}",
			accentColor: Color3.fromRGB(180, 120, 60),
			familyTag: "vehicle_family_animal",
		},
	],
	[
		"ShibaInu",
		{
			emoji: "\u{1F415}",
			accentColor: Color3.fromRGB(180, 120, 60),
			familyTag: "vehicle_family_animal",
		},
	],
	[
		"Kitsune",
		{
			emoji: "\u{1F98A}",
			accentColor: Color3.fromRGB(180, 120, 60),
			familyTag: "vehicle_family_animal",
		},
	],
	[
		"ManekiNeko",
		{
			emoji: "\u{1F63A}",
			accentColor: Color3.fromRGB(180, 120, 60),
			familyTag: "vehicle_family_animal",
		},
	],
	// Wheeled (Vehicle)
	[
		"Kart",
		{
			emoji: "\u{1F3CE}",
			accentColor: Color3.fromRGB(60, 120, 200),
			familyTag: "vehicle_family_vehicle",
		},
	],
	[
		"ToyCar",
		{
			emoji: "\u{1F697}",
			accentColor: Color3.fromRGB(60, 120, 200),
			familyTag: "vehicle_family_vehicle",
		},
	],
	[
		"ShibuyaBus",
		{
			emoji: "\u{1F68C}",
			accentColor: Color3.fromRGB(60, 120, 200),
			familyTag: "vehicle_family_vehicle",
		},
	],
	[
		"Rickshaw",
		{
			emoji: "\u{1F6FA}",
			accentColor: Color3.fromRGB(60, 120, 200),
			familyTag: "vehicle_family_vehicle",
		},
	],
	[
		"Skateboard",
		{
			emoji: "\u{1F6F9}",
			accentColor: Color3.fromRGB(60, 120, 200),
			familyTag: "vehicle_family_vehicle",
		},
	],
	[
		"Shinkansen",
		{
			emoji: "\u{1F685}",
			accentColor: Color3.fromRGB(60, 120, 200),
			familyTag: "vehicle_family_vehicle",
		},
	],
	// Static/Serpentine (Magic)
	[
		"WhiteDragon",
		{
			emoji: "\u{1F409}",
			accentColor: Color3.fromRGB(140, 80, 200),
			familyTag: "vehicle_family_magic",
		},
	],
	[
		"GreenDragon",
		{
			emoji: "\u{1F432}",
			accentColor: Color3.fromRGB(140, 80, 200),
			familyTag: "vehicle_family_magic",
		},
	],
	[
		"Onigiri",
		{
			emoji: "\u{1F359}",
			accentColor: Color3.fromRGB(140, 80, 200),
			familyTag: "vehicle_family_magic",
		},
	],
]);

const DEFAULT_DISPLAY: VehicleDisplayInfo = {
	emoji: "\u{2728}",
	accentColor: Color3.fromRGB(100, 100, 100),
	familyTag: "vehicle_family_mount",
};

function ShopCard({
	item,
	balance,
	level,
	order,
}: {
	item: ShopItemData;
	balance: number;
	level: number;
	order: number;
}) {
	const canAfford = balance >= item.price;
	const levelMet = level >= item.levelRequired;

	let buttonText: string;
	let buttonColor: Color3;
	let active: boolean;

	if (item.owned && item.equipped) {
		buttonText = t(L_SHOP_UNEQUIP);
		buttonColor = Color3.fromRGB(80, 160, 200);
		active = true;
	} else if (item.owned) {
		buttonText = t(L_SHOP_EQUIP);
		buttonColor = Color3.fromRGB(80, 200, 180);
		active = true;
	} else if (!levelMet) {
		buttonText = `Lv.${item.levelRequired}`;
		buttonColor = Color3.fromRGB(80, 50, 50);
		active = false;
	} else if (!canAfford) {
		buttonText = t(L_SHOP_NEED_PTS);
		buttonColor = Color3.fromRGB(80, 50, 50);
		active = false;
	} else {
		buttonText = t(L_SHOP_BUY);
		buttonColor = Color3.fromRGB(80, 200, 120);
		active = true;
	}

	return (
		<frame
			key={item.id}
			Size={new UDim2(0, 128, 0, 96)}
			BackgroundColor3={Color3.fromRGB(35, 35, 50)}
			BackgroundTransparency={0.2}
			BorderSizePixel={0}
			LayoutOrder={order}
		>
			<uicorner CornerRadius={new UDim(0, 6)} />
			<textlabel
				Size={new UDim2(1, -8, 0, 26)}
				Position={new UDim2(0, 4, 0, 4)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(230, 230, 230)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={item.name}
			/>
			<textlabel
				Size={new UDim2(1, !item.owned && levelMet ? -62 : -8, 0, 18)}
				Position={new UDim2(0, 4, 0, 32)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(150, 150, 200)}
				TextScaled={true}
				Font={Enum.Font.Gotham}
				Text={`${item.category} • ${item.price}pts`}
				TextXAlignment={Enum.TextXAlignment.Left}
			/>
			<textbutton
				Size={new UDim2(1, -8, 0, 28)}
				Position={new UDim2(0, 4, 0, 60)}
				BackgroundColor3={buttonColor}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={buttonText}
				Active={active}
				Event={{
					Activated: () => {
						if (!active) return;
						if (item.owned) {
							clientEvents.requestEquip.fire(item.id);
						} else {
							clientEvents.requestPurchase.fire(item.id);
						}
					},
				}}
			>
				<uicorner CornerRadius={new UDim(0, 4)} />
			</textbutton>
			{/* Try On button for unowned items */}
			{!item.owned && levelMet && (
				<textbutton
					Size={new UDim2(0, 50, 0, 16)}
					Position={new UDim2(1, -54, 0, 34)}
					BackgroundColor3={Color3.fromRGB(100, 80, 140)}
					TextColor3={Color3.fromRGB(220, 220, 255)}
					TextScaled={true}
					Font={Enum.Font.Gotham}
					Text={t(L_SHOP_TRY_ON)}
					Event={{
						Activated: () => {
							clientEvents.requestPreview.fire(item.id);
						},
					}}
				>
					<uicorner CornerRadius={new UDim(0, 3)} />
				</textbutton>
			)}
		</frame>
	);
}

function VehicleCard({
	vehicle,
	balance,
	level,
	order,
}: {
	vehicle: VehicleShopData;
	balance: number;
	level: number;
	order: number;
}) {
	const canAfford = balance >= vehicle.price;
	const levelMet = level >= vehicle.levelRequired;
	const info = VEHICLE_DISPLAY.get(vehicle.id) ?? DEFAULT_DISPLAY;

	let buttonText: string;
	let buttonColor: Color3;
	let active: boolean;

	if (vehicle.owned && vehicle.equipped) {
		buttonText = t(L_SHOP_UNEQUIP);
		buttonColor = Color3.fromRGB(80, 160, 200);
		active = true;
	} else if (vehicle.owned) {
		buttonText = t(L_SHOP_EQUIP);
		buttonColor = Color3.fromRGB(80, 200, 180);
		active = true;
	} else if (!levelMet) {
		buttonText = `Lv.${vehicle.levelRequired}`;
		buttonColor = Color3.fromRGB(80, 50, 50);
		active = false;
	} else if (!canAfford) {
		buttonText = vehicle.price > 0 ? `${vehicle.price}pts` : "Free";
		buttonColor = Color3.fromRGB(80, 50, 50);
		active = false;
	} else {
		buttonText = vehicle.price > 0 ? `${vehicle.price}pts` : "Free";
		buttonColor = Color3.fromRGB(80, 200, 120);
		active = true;
	}

	return (
		<frame
			key={vehicle.id}
			Size={new UDim2(0, 140, 0, 84)}
			BackgroundColor3={Color3.fromRGB(35, 35, 50)}
			BackgroundTransparency={0.2}
			BorderSizePixel={0}
			LayoutOrder={order}
		>
			<uicorner CornerRadius={new UDim(0, 8)} />
			<uistroke
				Color={Color3.fromRGB(60, 60, 80)}
				Thickness={1}
				Transparency={0.3}
			/>
			{/* Family tag (inside card, top-right) */}
			<textlabel
				Size={new UDim2(0, 48, 0, 14)}
				Position={new UDim2(1, -4, 0, 2)}
				AnchorPoint={new Vector2(1, 0)}
				BackgroundColor3={Color3.fromRGB(0, 0, 0)}
				BackgroundTransparency={0.4}
				TextColor3={Color3.fromRGB(220, 220, 240)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={t(info.familyTag)}
				ZIndex={2}
			>
				<uicorner CornerRadius={new UDim(0, 4)} />
				<uitextsizeconstraint MaxTextSize={10} />
			</textlabel>
			{/* Colored icon area with name */}
			<frame
				Size={new UDim2(1, 0, 0, 44)}
				BackgroundColor3={info.accentColor}
				BackgroundTransparency={0.3}
				BorderSizePixel={0}
			>
				<uicorner CornerRadius={new UDim(0, 8)} />
				{VEHICLE_ICON_IDS[vehicle.id] !== undefined &&
				VEHICLE_ICON_IDS[vehicle.id] !== "rbxassetid://0" ? (
					<imagelabel
						Size={new UDim2(0, 32, 0, 32)}
						Position={new UDim2(0, 6, 0.5, 0)}
						AnchorPoint={new Vector2(0, 0.5)}
						BackgroundTransparency={1}
						Image={VEHICLE_ICON_IDS[vehicle.id]}
						ImageColor3={Color3.fromRGB(255, 255, 255)}
						ScaleType={Enum.ScaleType.Fit}
					/>
				) : (
					<textlabel
						Size={new UDim2(0, 28, 0, 28)}
						Position={new UDim2(0, 8, 0.5, 0)}
						AnchorPoint={new Vector2(0, 0.5)}
						BackgroundTransparency={1}
						TextScaled={true}
						Text={info.emoji}
						Font={Enum.Font.GothamBold}
						TextColor3={Color3.fromRGB(255, 255, 255)}
					/>
				)}
				{/* Vehicle name (next to icon) */}
				<textlabel
					Size={new UDim2(1, -46, 0, 24)}
					Position={new UDim2(0, 42, 0.5, 0)}
					AnchorPoint={new Vector2(0, 0.5)}
					BackgroundTransparency={1}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					Font={Enum.Font.GothamBold}
					Text={vehicle.name}
					TextXAlignment={Enum.TextXAlignment.Left}
				>
					<uitextsizeconstraint MaxTextSize={15} />
				</textlabel>
			</frame>
			{/* Action button (shows price for unacquired, EQUIP/UNEQUIP for owned) */}
			<textbutton
				Size={new UDim2(1, -12, 0, 28)}
				Position={new UDim2(0.5, 0, 1, -6)}
				AnchorPoint={new Vector2(0.5, 1)}
				BackgroundColor3={buttonColor}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={buttonText}
				Active={active}
				Event={{
					Activated: () => {
						if (!active) return;
						if (vehicle.owned) {
							clientEvents.requestVehicleEquip.fire(vehicle.id);
						} else {
							clientEvents.requestVehiclePurchase.fire(vehicle.id);
						}
					},
				}}
			>
				<uicorner CornerRadius={new UDim(0, 4)} />
			</textbutton>
		</frame>
	);
}

type ShopTab = "cosmetics" | "vehicles";

export function ShopPanel() {
	const activeOverlay = useSelector(
		(state: GameStoreState) => state.activeOverlay,
	);
	const open = activeOverlay === "shop";
	const rawShopItems = useSelector((state: GameStoreState) => state.shopItems);
	const rawVehicleItems = useSelector(
		(state: GameStoreState) => state.vehicleItems,
	);
	// Sort by price ascending
	const shopItems = [...rawShopItems].sort((a, b) => a.price < b.price);
	const vehicleItems = [...rawVehicleItems].sort((a, b) => a.price < b.price);
	const shopBalance = useSelector((state: GameStoreState) => state.shopBalance);
	const level = useSelector((state: GameStoreState) => state.playgroundLevel);
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);
	const [tab, setTab] = useState<ShopTab>("vehicles");

	// Request catalog data when shop opens (replaces old onOpen callback)
	React.useEffect(() => {
		if (open) {
			setTab("vehicles");
			clientEvents.requestShopCatalog.fire();
			clientEvents.requestVehicleCatalog.fire();
		}
	}, [open]);

	return (
		<>
			{/* Toggle button removed — now handled by ActionBar */}
			{/* Full-screen overlay when open */}
			{open ? (
				<>
					{/* Centered shop card */}
					<frame
						key="ShopOverlay"
						Size={new UDim2(0.75, 0, 0.8, 0)}
						Position={new UDim2(0.5, 0, 0.5, 0)}
						AnchorPoint={new Vector2(0.5, 0.5)}
						BackgroundColor3={Color3.fromRGB(20, 20, 40)}
						BackgroundTransparency={0.05}
						BorderSizePixel={0}
						ZIndex={19}
					>
						<uicorner CornerRadius={new UDim(0, 12)} />
						{/* Close button */}
						<textbutton
							Size={new UDim2(0, 32, 0, 32)}
							Position={new UDim2(1, -8, 0, 8)}
							AnchorPoint={new Vector2(1, 0)}
							BackgroundColor3={Color3.fromRGB(60, 40, 40)}
							BackgroundTransparency={0.3}
							TextColor3={Color3.fromRGB(255, 255, 255)}
							TextScaled={true}
							Font={Enum.Font.GothamBold}
							Text="X"
							ZIndex={20}
							Event={{
								Activated: () => gameStore.setActiveOverlay("none"),
							}}
						>
							<uicorner CornerRadius={new UDim(1, 0)} />
						</textbutton>
						{/* Balance */}
						<textlabel
							Size={new UDim2(0.5, -48, 0, 28)}
							Position={new UDim2(0, 12, 0, 12)}
							BackgroundTransparency={1}
							TextColor3={Color3.fromRGB(255, 200, 80)}
							TextScaled={true}
							Font={Enum.Font.GothamBold}
							Text={t(L_SHOP_BALANCE).gsub("%%d", tostring(shopBalance))[0]}
							TextXAlignment={Enum.TextXAlignment.Left}
							ZIndex={19}
						/>
						{/* Tab buttons */}
						<frame
							Size={new UDim2(0, 180, 0, 28)}
							Position={new UDim2(1, -44, 0, 12)}
							AnchorPoint={new Vector2(1, 0)}
							BackgroundTransparency={1}
							ZIndex={19}
						>
							<uilistlayout
								FillDirection={Enum.FillDirection.Horizontal}
								Padding={new UDim(0, 4)}
								HorizontalAlignment={Enum.HorizontalAlignment.Right}
							/>
							<textbutton
								key="tab_vehicles"
								Size={new UDim2(0, 80, 1, 0)}
								BackgroundColor3={
									tab === "vehicles"
										? Color3.fromRGB(80, 60, 120)
										: Color3.fromRGB(40, 40, 60)
								}
								TextColor3={Color3.fromRGB(255, 255, 255)}
								TextScaled={true}
								Font={Enum.Font.GothamBold}
								Text={t(L_VEHICLE_TAB)}
								ZIndex={19}
								Event={{ Activated: () => setTab("vehicles") }}
							>
								<uicorner CornerRadius={new UDim(0, 6)} />
							</textbutton>
							<textbutton
								key="tab_cosmetics"
								Size={new UDim2(0, 90, 1, 0)}
								BackgroundColor3={
									tab === "cosmetics"
										? Color3.fromRGB(80, 60, 120)
										: Color3.fromRGB(40, 40, 60)
								}
								TextColor3={Color3.fromRGB(255, 255, 255)}
								TextScaled={true}
								Font={Enum.Font.GothamBold}
								Text={t(L_SHOP_TAB_ACCESSORY)}
								ZIndex={19}
								Event={{ Activated: () => setTab("cosmetics") }}
							>
								<uicorner CornerRadius={new UDim(0, 6)} />
							</textbutton>
						</frame>
						{/* Content area */}
						<scrollingframe
							Size={new UDim2(1, -12, 1, -52)}
							Position={new UDim2(0, 6, 0, 44)}
							BackgroundTransparency={1}
							BorderSizePixel={0}
							CanvasSize={new UDim2(0, 0, 0, 0)}
							AutomaticCanvasSize={Enum.AutomaticSize.Y}
							ScrollBarThickness={6}
							ScrollBarImageColor3={Color3.fromRGB(100, 100, 150)}
							ZIndex={19}
						>
							<uigridlayout
								CellSize={
									tab === "vehicles"
										? new UDim2(0, 140, 0, 84)
										: new UDim2(0, 128, 0, 96)
								}
								CellPadding={
									tab === "vehicles"
										? new UDim2(0, 8, 0, 12)
										: new UDim2(0, 6, 0, 6)
								}
								HorizontalAlignment={Enum.HorizontalAlignment.Center}
								SortOrder={Enum.SortOrder.LayoutOrder}
							/>
							{tab === "cosmetics"
								? shopItems.map((item, i) => (
										<ShopCard
											key={item.id}
											item={item}
											balance={shopBalance}
											level={level}
											order={i}
										/>
									))
								: vehicleItems.map((v, i) => (
										<VehicleCard
											key={v.id}
											vehicle={v}
											balance={shopBalance}
											level={level}
											order={i}
										/>
									))}
						</scrollingframe>
					</frame>
				</>
			) : (
				undefined!
			)}
		</>
	);
}
