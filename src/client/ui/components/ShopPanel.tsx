import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { clientEvents } from "client/network";
import { GameStoreState } from "shared/store/game-store";
import { ShopItemData } from "shared/types";

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
		buttonText = "UNEQUIP";
		buttonColor = Color3.fromRGB(80, 160, 200);
		active = true;
	} else if (item.owned) {
		buttonText = "EQUIP";
		buttonColor = Color3.fromRGB(80, 200, 180);
		active = true;
	} else if (!levelMet) {
		buttonText = `Lv.${item.levelRequired}`;
		buttonColor = Color3.fromRGB(80, 50, 50);
		active = false;
	} else if (!canAfford) {
		buttonText = "Need pts";
		buttonColor = Color3.fromRGB(80, 50, 50);
		active = false;
	} else {
		buttonText = "BUY";
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
	const [open, setOpen] = React.useState(false);
	const shopItems = useSelector((state: GameStoreState) => state.shopItems);
	const shopBalance = useSelector((state: GameStoreState) => state.shopBalance);
	const level = useSelector((state: GameStoreState) => state.playgroundLevel);

	return (
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
				Text="$ Shop"
				Event={{
					Activated: () => setOpen(!open),
				}}
			>
				<uipadding
					PaddingLeft={new UDim(0, 8)}
					PaddingRight={new UDim(0, 8)}
				/>
			</textbutton>
			{open ? (
				<frame
					Size={new UDim2(0, 420, 0, 260)}
					Position={new UDim2(1, 0, 1, 4)}
					AnchorPoint={new Vector2(1, 0)}
					BackgroundColor3={Color3.fromRGB(20, 20, 40)}
					BackgroundTransparency={0.1}
					BorderSizePixel={0}
					ZIndex={11}
				>
					<uicorner CornerRadius={new UDim(0, 8)} />
					<textlabel
						Size={new UDim2(1, 0, 0, 24)}
						BackgroundTransparency={1}
						TextColor3={Color3.fromRGB(255, 200, 80)}
						TextScaled={true}
						Font={Enum.Font.GothamBold}
						Text={`Balance: ${shopBalance} pts`}
					/>
					<scrollingframe
						Size={new UDim2(1, -8, 1, -32)}
						Position={new UDim2(0, 4, 0, 28)}
						BackgroundTransparency={1}
						BorderSizePixel={0}
						CanvasSize={new UDim2(0, 0, 0, 0)}
						AutomaticCanvasSize={Enum.AutomaticSize.Y}
						ScrollBarThickness={6}
						ScrollBarImageColor3={Color3.fromRGB(100, 100, 150)}
					>
						<uigridlayout
							CellSize={new UDim2(0, 128, 0, 96)}
							CellPadding={new UDim2(0, 4, 0, 4)}
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
			) : (
				undefined!
			)}
		</frame>
	);
}
