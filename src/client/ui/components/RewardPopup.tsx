import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { t } from "shared/localization";
import {
	L_REWARD_BASE,
	L_REWARD_ROLE_BONUS,
	L_REWARD_TOTAL,
	L_REWARD_WIN_BONUS,
	L_REWARDS,
} from "shared/localization/keys";
import { GameStoreState } from "shared/store/game-store";

export function RewardPopup() {
	const showReward = useSelector(
		(state: GameStoreState) => state.showRewardAnimation,
	);
	const breakdown = useSelector(
		(state: GameStoreState) => state.rewardBreakdown,
	);

	// Hide when no breakdown, or when all bonus lines are zero (Hachi Ride)
	if (!showReward || !breakdown) {
		return undefined!;
	}
	const hasAnyBonus =
		breakdown.baseReward > 0 ||
		breakdown.winBonus > 0 ||
		breakdown.roleBonus > 0;
	if (!hasAnyBonus) {
		return undefined!;
	}

	return (
		<frame
			key="RewardPopup"
			Size={new UDim2(0.5, 0, 0, 0)}
			AutomaticSize={Enum.AutomaticSize.Y}
			Position={new UDim2(0.25, 0, 0.2, 0)}
			BackgroundColor3={Color3.fromRGB(15, 15, 30)}
			BackgroundTransparency={0.05}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 12)} />
			<uistroke
				Color={Color3.fromRGB(80, 80, 120)}
				Thickness={2}
				Transparency={0.3}
			/>
			<uilistlayout
				SortOrder={Enum.SortOrder.LayoutOrder}
				Padding={new UDim(0, 6)}
				HorizontalAlignment={Enum.HorizontalAlignment.Center}
			/>
			<uipadding
				PaddingTop={new UDim(0, 14)}
				PaddingBottom={new UDim(0, 14)}
				PaddingLeft={new UDim(0, 8)}
				PaddingRight={new UDim(0, 8)}
			/>
			<textlabel
				key="Title"
				Size={new UDim2(0.9, 0, 0, 32)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 220, 100)}
				TextScaled={true}
				Font={Enum.Font.FredokaOne}
				Text={t(L_REWARDS)}
				LayoutOrder={0}
			/>
			<frame
				key="Divider"
				Size={new UDim2(0.8, 0, 0, 1)}
				BackgroundColor3={Color3.fromRGB(100, 100, 140)}
				BorderSizePixel={0}
				LayoutOrder={1}
			/>
			<RewardLine
				label={t(L_REWARD_BASE)}
				value={breakdown.baseReward}
				order={2}
			/>
			<RewardLine
				label={t(L_REWARD_WIN_BONUS)}
				value={breakdown.winBonus}
				order={3}
			/>
			<RewardLine
				label={t(L_REWARD_ROLE_BONUS)}
				value={breakdown.roleBonus}
				order={4}
			/>
			<frame
				key="Divider2"
				Size={new UDim2(0.8, 0, 0, 1)}
				BackgroundColor3={Color3.fromRGB(100, 100, 140)}
				BorderSizePixel={0}
				LayoutOrder={5}
			/>
			<textlabel
				key="Total"
				Size={new UDim2(0.9, 0, 0, 36)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(100, 255, 100)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={`${t(L_REWARD_TOTAL)}  +${breakdown.totalPoints}`}
				LayoutOrder={6}
			/>
		</frame>
	);
}

function RewardLine(props: { label: string; value: number; order: number }) {
	if (props.value === 0) {
		return undefined!;
	}

	return (
		<textlabel
			key={props.label}
			Size={new UDim2(0.9, 0, 0, 24)}
			BackgroundTransparency={1}
			TextColor3={Color3.fromRGB(200, 200, 200)}
			TextScaled={true}
			Font={Enum.Font.Gotham}
			Text={`${props.label}  +${props.value}`}
			LayoutOrder={props.order}
		/>
	);
}
