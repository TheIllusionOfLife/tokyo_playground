import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { GameStoreState } from "shared/store/game-store";

export function RewardPopup() {
	const showReward = useSelector(
		(state: GameStoreState) => state.showRewardAnimation,
	);
	const breakdown = useSelector(
		(state: GameStoreState) => state.rewardBreakdown,
	);

	if (!showReward || !breakdown) {
		return undefined!;
	}

	return (
		<frame
			key="RewardPopup"
			Size={new UDim2(0.3, 0, 0.25, 0)}
			Position={new UDim2(0.35, 0, 0.3, 0)}
			BackgroundColor3={Color3.fromRGB(20, 20, 40)}
			BackgroundTransparency={0.15}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 10)} />
			<uilistlayout
				SortOrder={Enum.SortOrder.LayoutOrder}
				Padding={new UDim(0, 4)}
				HorizontalAlignment={Enum.HorizontalAlignment.Center}
			/>
			<textlabel
				key="Title"
				Size={new UDim2(0.9, 0, 0.2, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 220, 100)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text="REWARDS"
				LayoutOrder={0}
			/>
			<RewardLine label="Base" value={breakdown.baseReward} order={1} />
			<RewardLine label="Win Bonus" value={breakdown.winBonus} order={2} />
			<RewardLine label="Role Bonus" value={breakdown.roleBonus} order={3} />
			<textlabel
				key="Total"
				Size={new UDim2(0.9, 0, 0.2, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(100, 255, 100)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={`TOTAL  +${breakdown.totalPoints}`}
				LayoutOrder={4}
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
			Size={new UDim2(0.9, 0, 0.15, 0)}
			BackgroundTransparency={1}
			TextColor3={Color3.fromRGB(200, 200, 200)}
			TextScaled={true}
			Font={Enum.Font.Gotham}
			Text={`${props.label}  +${props.value}`}
			LayoutOrder={props.order}
		/>
	);
}
