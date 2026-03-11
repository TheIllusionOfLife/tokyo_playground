import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { GameStoreState } from "shared/store/game-store";
import { MatchPhase } from "shared/types";

const PHASE_LABELS: Record<string, string> = {
	[MatchPhase.WaitingForPlayers]: "Waiting for Players",
	[MatchPhase.Countdown]: "Get Ready!",
	[MatchPhase.Preparing]: "Preparing...",
	[MatchPhase.InProgress]: "In Progress",
	[MatchPhase.RoundOver]: "Round Over",
	[MatchPhase.Rewarding]: "Results",
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

	const showTimer = matchPhase === MatchPhase.InProgress;
	const phaseText = PHASE_LABELS[matchPhase] ?? matchPhase;

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
				Size={showTimer ? new UDim2(0.6, 0, 1, 0) : new UDim2(1, 0, 1, 0)}
				Position={new UDim2(0, 0, 0, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={phaseText}
			/>
			{showTimer && (
				<textlabel
					key="Timer"
					Size={new UDim2(0.4, 0, 1, 0)}
					Position={new UDim2(0.6, 0, 0, 0)}
					BackgroundTransparency={1}
					TextColor3={Color3.fromRGB(255, 220, 100)}
					TextScaled={true}
					Font={Enum.Font.GothamBold}
					Text={formatTime(timeRemaining)}
				/>
			)}
		</frame>
	);
}
