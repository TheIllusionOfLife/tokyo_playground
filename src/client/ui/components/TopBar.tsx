import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { t } from "shared/localization";
import {
	L_PHASE_GET_READY,
	L_PHASE_IN_PROGRESS,
	L_PHASE_PREPARING,
	L_PHASE_RESULTS,
	L_PHASE_ROUND_OVER,
	L_PHASE_WAITING,
} from "shared/localization/keys";
import { GameStoreState } from "shared/store/game-store";
import { MatchPhase } from "shared/types";

const PHASE_LABELS: Record<string, () => string> = {
	[MatchPhase.WaitingForPlayers]: () => t(L_PHASE_WAITING),
	[MatchPhase.Countdown]: () => t(L_PHASE_GET_READY),
	[MatchPhase.Preparing]: () => t(L_PHASE_PREPARING),
	[MatchPhase.InProgress]: () => t(L_PHASE_IN_PROGRESS),
	[MatchPhase.RoundOver]: () => t(L_PHASE_ROUND_OVER),
	[MatchPhase.Rewarding]: () => t(L_PHASE_RESULTS),
};

function formatTime(seconds: number): string {
	const clamped = math.max(0, seconds);
	const mins = math.floor(clamped / 60);
	const secs = math.floor(clamped % 60);
	return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function TopBar() {
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);
	const timeRemaining = useSelector(
		(state: GameStoreState) => state.timeRemaining,
	);

	// Hide in lobby — QueueStatusCard handles queue info separately
	if (matchPhase === MatchPhase.WaitingForPlayers) return undefined!;

	const isInProgress = matchPhase === MatchPhase.InProgress;
	const phaseText = PHASE_LABELS[matchPhase]?.() ?? matchPhase;

	// InProgress: show only the timer number, 2x size, centered
	if (isInProgress) {
		return (
			<frame
				key="TopBar"
				Size={new UDim2(0.15, 0, 0.06, 0)}
				Position={new UDim2(0.5, 0, 0, 0)}
				AnchorPoint={new Vector2(0.5, 0)}
				BackgroundColor3={Color3.fromRGB(0, 0, 0)}
				BackgroundTransparency={0.4}
				BorderSizePixel={0}
			>
				<uicorner CornerRadius={new UDim(0, 8)} />
				<textlabel
					key="Timer"
					Size={new UDim2(1, 0, 1, 0)}
					BackgroundTransparency={1}
					TextColor3={Color3.fromRGB(255, 220, 100)}
					TextScaled={true}
					Font={Enum.Font.GothamBold}
					Text={formatTime(timeRemaining)}
				/>
			</frame>
		);
	}

	// Other phases: show phase text label
	return (
		<frame
			key="TopBar"
			Size={new UDim2(0.4, 0, 0.06, 0)}
			Position={new UDim2(0.3, 0, 0.02, 0)}
			BackgroundColor3={Color3.fromRGB(0, 0, 0)}
			BackgroundTransparency={0.4}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 8)} />
			<textlabel
				key="PhaseText"
				Size={new UDim2(1, 0, 1, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={phaseText}
			/>
		</frame>
	);
}
