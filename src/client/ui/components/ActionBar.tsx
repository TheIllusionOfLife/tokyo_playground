import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { GuiService } from "@rbxts/services";
import {
	ALL_POI_ZONES,
	ICON_MISSIONS,
	ICON_RANKS,
	ICON_SHOP,
	ICON_SPIN,
} from "shared/constants";
import { t } from "shared/localization";
import {
	L_MISSIONS,
	L_RANKS,
	L_SHOP,
	L_SPIN_TOGGLE,
} from "shared/localization/keys";
import { GameStoreState, gameStore } from "shared/store/game-store";
import { MatchPhase } from "shared/types";

type OverlayId = "shop" | "missions" | "spin" | "leaderboard";

interface ActionBarItem {
	id: OverlayId;
	labelKey: string;
	iconAssetId: string;
	iconColor: Color3;
	order: number;
}

const ACTION_ITEMS: ActionBarItem[] = [
	{
		id: "missions",
		labelKey: L_MISSIONS,
		iconAssetId: ICON_MISSIONS,
		iconColor: Color3.fromRGB(255, 255, 150),
		order: 1,
	},
	{
		id: "shop",
		labelKey: L_SHOP,
		iconAssetId: ICON_SHOP,
		iconColor: Color3.fromRGB(255, 210, 100),
		order: 2,
	},
	{
		id: "spin",
		labelKey: L_SPIN_TOGGLE,
		iconAssetId: ICON_SPIN,
		iconColor: Color3.fromRGB(255, 200, 100),
		order: 3,
	},
	{
		id: "leaderboard",
		labelKey: L_RANKS,
		iconAssetId: ICON_RANKS,
		iconColor: Color3.fromRGB(150, 200, 255),
		order: 4,
	},
];

function ActionBarButton({
	item,
	isActive,
	showNotifDot,
}: {
	item: ActionBarItem;
	isActive: boolean;
	showNotifDot?: boolean;
}) {
	return (
		<frame
			key={item.id}
			Size={new UDim2(0, 50, 0, 50)}
			BackgroundTransparency={1}
			BorderSizePixel={0}
			LayoutOrder={item.order}
		>
			<textbutton
				Size={new UDim2(1, 0, 1, 0)}
				BackgroundTransparency={1}
				Text=""
				Event={{
					Activated: () =>
						gameStore.setActiveOverlay(isActive ? "none" : item.id),
				}}
			/>
			{/* Icon with stroke for readability on any background */}
			<imagelabel
				Size={new UDim2(0, 28, 0, 28)}
				Position={new UDim2(0.5, 0, 0, 2)}
				AnchorPoint={new Vector2(0.5, 0)}
				BackgroundTransparency={1}
				Image={item.iconAssetId}
				ImageColor3={isActive ? Color3.fromRGB(255, 255, 255) : item.iconColor}
				ScaleType={Enum.ScaleType.Fit}
			/>
			{/* Label (close to icon) */}
			<textlabel
				Size={new UDim2(1, 0, 0, 14)}
				Position={new UDim2(0, 0, 0, 32)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={t(item.labelKey)}
			>
				<uitextsizeconstraint MaxTextSize={11} />
				<uistroke
					Color={Color3.fromRGB(0, 0, 0)}
					Thickness={1.5}
					Transparency={0.3}
				/>
			</textlabel>
			{/* Notification dot (missions only) */}
			{showNotifDot ? (
				<frame
					key="NotifDot"
					Size={new UDim2(0, 8, 0, 8)}
					Position={new UDim2(1, -2, 0, 0)}
					AnchorPoint={new Vector2(1, 0)}
					BackgroundColor3={Color3.fromRGB(255, 80, 80)}
					BorderSizePixel={0}
					ZIndex={2}
				>
					<uicorner CornerRadius={new UDim(1, 0)} />
				</frame>
			) : (
				undefined!
			)}
		</frame>
	);
}

export function ActionBar() {
	const matchPhase = useSelector((s: GameStoreState) => s.matchPhase);
	const activeOverlay = useSelector((s: GameStoreState) => s.activeOverlay);
	const missions = useSelector((s: GameStoreState) => s.missions);
	const discoveredPoi = useSelector((s: GameStoreState) => s.discoveredPoi);
	const poiClaimedRewards = useSelector(
		(s: GameStoreState) => s.poiClaimedRewards,
	);

	// Hide during active gameplay (same logic as individual buttons)
	if (matchPhase !== MatchPhase.WaitingForPlayers) return undefined!;

	// Check if any missions or POI rewards are claimable (notification dot)
	const hasClaimableMission = missions.some(
		(m) => m.progress >= m.target && !m.rewardCollected,
	);
	const hasClaimablePoi = ALL_POI_ZONES.some(
		(z) => discoveredPoi.includes(z) && !poiClaimedRewards.includes(z),
	);
	const hasClaimable = hasClaimableMission || hasClaimablePoi;

	// Match right-edge offset with HachiToggleButton (in safe-area ScreenGui at -10px).
	// ScreenInsets.None ignores safe area, so add the inset manually.
	const [inset] = GuiService.GetGuiInset();
	const rightPad = 10 + inset.X;

	return (
		<screengui
			key="ActionBarGui"
			ResetOnSpawn={false}
			ScreenInsets={Enum.ScreenInsets.None}
			DisplayOrder={4}
			ZIndexBehavior={Enum.ZIndexBehavior.Sibling}
		>
			<frame
				key="ActionBarContainer"
				AutomaticSize={Enum.AutomaticSize.X}
				Size={new UDim2(0, 0, 0, 50)}
				Position={new UDim2(1, -rightPad, 0, 10)}
				AnchorPoint={new Vector2(1, 0)}
				BackgroundTransparency={1}
				BorderSizePixel={0}
			>
				<uilistlayout
					FillDirection={Enum.FillDirection.Horizontal}
					HorizontalAlignment={Enum.HorizontalAlignment.Right}
					VerticalAlignment={Enum.VerticalAlignment.Center}
					Padding={new UDim(0, 2)}
					SortOrder={Enum.SortOrder.LayoutOrder}
				/>
				{ACTION_ITEMS.map((item) => (
					<ActionBarButton
						key={item.id}
						item={item}
						isActive={activeOverlay === item.id}
						showNotifDot={item.id === "missions" && hasClaimable}
					/>
				))}
			</frame>
		</screengui>
	);
}
