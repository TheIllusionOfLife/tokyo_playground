import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { GameStoreState } from "shared/store/game-store";
import { MatchPhase, MinigameId } from "shared/types";

const DOT_ON = Color3.fromRGB(255, 200, 50);
const DOT_OFF = Color3.fromRGB(60, 60, 60);

export function HachiHud() {
	const matchPhase = useSelector((s: GameStoreState) => s.matchPhase);
	const activeMinigameId = useSelector(
		(s: GameStoreState) => s.activeMinigameId,
	);
	const itemCount = useSelector((s: GameStoreState) => s.hachiItemCount);
	const evolutionLevel = useSelector(
		(s: GameStoreState) => s.hachiEvolutionLevel,
	);
	const raceState = useSelector((s: GameStoreState) => s.hachiRaceState);

	if (
		activeMinigameId !== MinigameId.HachiRide ||
		matchPhase !== MatchPhase.InProgress
	) {
		return undefined!;
	}

	return (
		<frame
			key="HachiHud"
			Size={new UDim2(0, 240, 0, 112)}
			Position={new UDim2(0.5, -100, 0.09, 4)}
			BackgroundColor3={Color3.fromRGB(15, 15, 30)}
			BackgroundTransparency={0.2}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 8)} />
			<uilistlayout
				SortOrder={Enum.SortOrder.LayoutOrder}
				FillDirection={Enum.FillDirection.Vertical}
				Padding={new UDim(0, 4)}
				HorizontalAlignment={Enum.HorizontalAlignment.Center}
				VerticalAlignment={Enum.VerticalAlignment.Center}
			/>
			<uipadding
				PaddingTop={new UDim(0, 6)}
				PaddingBottom={new UDim(0, 6)}
				PaddingLeft={new UDim(0, 8)}
				PaddingRight={new UDim(0, 8)}
			/>
			<textlabel
				key="ItemCount"
				LayoutOrder={1}
				Size={new UDim2(1, 0, 0, 28)}
				BackgroundTransparency={1}
				Text={`Points: ${itemCount}`}
				TextColor3={Color3.fromRGB(255, 220, 80)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
			/>
			<frame
				key="EvolutionDots"
				LayoutOrder={2}
				Size={new UDim2(0, 120, 0, 16)}
				BackgroundTransparency={1}
			>
				<uilistlayout
					SortOrder={Enum.SortOrder.LayoutOrder}
					FillDirection={Enum.FillDirection.Horizontal}
					Padding={new UDim(0, 8)}
					HorizontalAlignment={Enum.HorizontalAlignment.Center}
					VerticalAlignment={Enum.VerticalAlignment.Center}
				/>
				{[1, 2, 3, 4].map((level) => (
					<frame
						key={`dot-${level}`}
						LayoutOrder={level}
						Size={new UDim2(0, 14, 0, 14)}
						BackgroundColor3={evolutionLevel >= level ? DOT_ON : DOT_OFF}
						BorderSizePixel={0}
					>
						<uicorner CornerRadius={new UDim(1, 0)} />
					</frame>
				))}
			</frame>
			{raceState ? (
				<textlabel
					key="RaceState"
					LayoutOrder={3}
					Size={new UDim2(1, 0, 0, 18)}
					BackgroundTransparency={1}
					TextColor3={Color3.fromRGB(210, 230, 255)}
					TextScaled={true}
					Font={Enum.Font.Gotham}
					Text={`Rank #${raceState.playerRank} • Leader ${raceState.leaderName} (${raceState.leaderScore})`}
				/>
			) : (
				undefined!
			)}
			{raceState ? (
				<textlabel
					key="HotspotState"
					LayoutOrder={4}
					Size={new UDim2(1, 0, 0, 18)}
					BackgroundTransparency={1}
					TextColor3={Color3.fromRGB(255, 196, 92)}
					TextScaled={true}
					Font={Enum.Font.Gotham}
					Text={`Hotspot: ${raceState.hotspotLabel} (${raceState.hotspotTimeLeft}s) • Next evo ${raceState.nextThreshold}`}
				/>
			) : (
				undefined!
			)}
		</frame>
	);
}
