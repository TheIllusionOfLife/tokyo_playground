import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { clientEvents } from "client/network";
import { t } from "shared/localization";
import {
	L_SHOP,
	L_SHOP_BALANCE,
	L_SHOP_BUY,
	L_SHOP_EQUIP,
	L_SHOP_NEED_PTS,
	L_SHOP_UNEQUIP,
} from "shared/localization/keys";
import { GameStoreState, gameStore } from "shared/store/game-store";
import { MatchPhase, MinigameId, ShopItemData } from "shared/types";

function ShopCard({
	item,
	balance,
	level,
}: {
	item: ShopItemData;
	balance: number;
	level: number;
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
				Size={new UDim2(1, -8, 0, 18)}
				Position={new UDim2(0, 4, 0, 32)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(150, 150, 200)}
				TextScaled={true}
				Font={Enum.Font.Gotham}
				Text={`${item.category} • ${item.price}pts`}
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
		</frame>
	);
}

export function ShopPanel() {
	const activeOverlay = useSelector(
		(state: GameStoreState) => state.activeOverlay,
	);
	const open = activeOverlay === "shop";
	const shopItems = useSelector((state: GameStoreState) => state.shopItems);
	const shopBalance = useSelector((state: GameStoreState) => state.shopBalance);
	const level = useSelector((state: GameStoreState) => state.playgroundLevel);
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);
	const activeMinigameId = useSelector(
		(state: GameStoreState) => state.activeMinigameId,
	);

	// Hide during HachiRide InProgress (overlaps with rank/skills/points)
	const hideButton =
		activeMinigameId === MinigameId.HachiRide &&
		matchPhase === MatchPhase.InProgress;

	return (
		<>
			{/* Toggle button (top-right, above missions) */}
			{!hideButton && (
				<frame
					key="ShopPanel"
					Size={new UDim2(0, 100, 0, 30)}
					Position={new UDim2(1, -10, 0, 48)}
					AnchorPoint={new Vector2(1, 0)}
					BackgroundColor3={Color3.fromRGB(70, 45, 25)}
					BackgroundTransparency={0.3}
					BorderSizePixel={0}
					ZIndex={10}
				>
					<uicorner CornerRadius={new UDim(0, 15)} />
					<textbutton
						Size={new UDim2(1, 0, 1, 0)}
						BackgroundTransparency={1}
						TextColor3={Color3.fromRGB(255, 210, 100)}
						TextScaled={true}
						Font={Enum.Font.GothamBold}
						Text={t(L_SHOP)}
						Event={{
							Activated: () =>
								gameStore.setActiveOverlay(open ? "none" : "shop"),
						}}
					>
						<uipadding
							PaddingLeft={new UDim(0, 8)}
							PaddingRight={new UDim(0, 8)}
						/>
					</textbutton>
				</frame>
			)}
			{/* Full-screen overlay when open */}
			{open ? (
				<>
					{/* Centered shop card */}
					<frame
						key="ShopOverlay"
						Size={new UDim2(0.75, 0, 0.65, 0)}
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
						<textlabel
							Size={new UDim2(1, -48, 0, 28)}
							Position={new UDim2(0, 12, 0, 12)}
							BackgroundTransparency={1}
							TextColor3={Color3.fromRGB(255, 200, 80)}
							TextScaled={true}
							Font={Enum.Font.GothamBold}
							Text={t(L_SHOP_BALANCE).gsub("%%d", tostring(shopBalance))[0]}
							TextXAlignment={Enum.TextXAlignment.Left}
							ZIndex={19}
						/>
						<scrollingframe
							Size={new UDim2(1, -24, 1, -52)}
							Position={new UDim2(0, 12, 0, 44)}
							BackgroundTransparency={1}
							BorderSizePixel={0}
							CanvasSize={new UDim2(0, 0, 0, 0)}
							AutomaticCanvasSize={Enum.AutomaticSize.Y}
							ScrollBarThickness={6}
							ScrollBarImageColor3={Color3.fromRGB(100, 100, 150)}
							ZIndex={19}
						>
							<uigridlayout
								CellSize={new UDim2(0, 128, 0, 96)}
								CellPadding={new UDim2(0, 6, 0, 6)}
							/>
							{shopItems.map((item) => (
								<ShopCard
									key={item.id}
									item={item}
									balance={shopBalance}
									level={level}
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
