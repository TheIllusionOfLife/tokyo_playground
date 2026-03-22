import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { GameStoreState } from "shared/store/game-store";
import { MatchPhase, MinigameId } from "shared/types";
import { formatQueueStatusDetail } from "shared/utils/queueStatus";

const MINIGAME_LABELS: Record<MinigameId, string> = {
	[MinigameId.CanKick]: "Can Kick",
	[MinigameId.ShibuyaScramble]: "Shibuya Scramble",
	[MinigameId.HachiRide]: "Hachi Ride",
};

export function QueueStatusCard() {
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);
	const queueStatus = useSelector((state: GameStoreState) => state.queueStatus);

	if (matchPhase !== MatchPhase.WaitingForPlayers || !queueStatus) {
		return undefined!;
	}

	return (
		<frame
			key="QueueStatusCard"
			Size={new UDim2(0, 200, 0, 60)}
			Position={new UDim2(0.5, -100, 0.1, 0)}
			BackgroundColor3={Color3.fromRGB(14, 20, 34)}
			BackgroundTransparency={0.15}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 10)} />
			<textlabel
				Size={new UDim2(1, -16, 0, 22)}
				Position={new UDim2(0, 8, 0, 8)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 230, 120)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text="Next Featured Game"
			/>
			<textlabel
				Size={new UDim2(1, -16, 0, 24)}
				Position={new UDim2(0, 8, 0, 30)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={MINIGAME_LABELS[queueStatus.featuredMinigameId]}
			/>
			<textlabel
				Size={new UDim2(1, -16, 0, 16)}
				Position={new UDim2(0, 8, 0, 56)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(180, 200, 255)}
				TextScaled={true}
				Font={Enum.Font.Gotham}
				Text={formatQueueStatusDetail(queueStatus)}
			/>
		</frame>
	);
}
