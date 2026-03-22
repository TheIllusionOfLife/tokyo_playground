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

	const playerRank = raceState?.playerRank ?? 1;
	const nextThreshold = raceState?.nextThreshold ?? 0;

	return (
		<>
			{/* Rank badge - top right */}
			<frame
				key="RankBadge"
				Size={new UDim2(0, 50, 0, 30)}
				Position={new UDim2(1, -10, 0.02, 0)}
				AnchorPoint={new Vector2(1, 0)}
				BackgroundColor3={Color3.fromRGB(30, 30, 70)}
				BackgroundTransparency={0.2}
				BorderSizePixel={0}
			>
				<uicorner CornerRadius={new UDim(0, 8)} />
				<textlabel
					Size={new UDim2(1, 0, 1, 0)}
					BackgroundTransparency={1}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					Font={Enum.Font.GothamBold}
					Text={`#${playerRank}`}
				/>
			</frame>

			{/* Points + evolution dots + next level - below skills badge */}
			<frame
				key="PointsInfo"
				Size={new UDim2(0, 100, 0, 55)}
				Position={new UDim2(1, -10, 0.12, 0)}
				AnchorPoint={new Vector2(1, 0)}
				BackgroundColor3={Color3.fromRGB(15, 15, 30)}
				BackgroundTransparency={0.2}
				BorderSizePixel={0}
			>
				<uicorner CornerRadius={new UDim(0, 8)} />
				<uilistlayout
					SortOrder={Enum.SortOrder.LayoutOrder}
					FillDirection={Enum.FillDirection.Vertical}
					Padding={new UDim(0, 2)}
					HorizontalAlignment={Enum.HorizontalAlignment.Center}
					VerticalAlignment={Enum.VerticalAlignment.Center}
				/>
				<uipadding
					PaddingTop={new UDim(0, 4)}
					PaddingBottom={new UDim(0, 4)}
					PaddingLeft={new UDim(0, 6)}
					PaddingRight={new UDim(0, 6)}
				/>
				{/* Points */}
				<textlabel
					key="Points"
					LayoutOrder={1}
					Size={new UDim2(1, 0, 0, 16)}
					BackgroundTransparency={1}
					Text={`${itemCount} pts`}
					TextColor3={Color3.fromRGB(255, 220, 80)}
					TextScaled={true}
					Font={Enum.Font.GothamBold}
				/>
				{/* Evolution dots */}
				<frame
					key="EvolutionDots"
					LayoutOrder={2}
					Size={new UDim2(0, 80, 0, 12)}
					BackgroundTransparency={1}
				>
					<uilistlayout
						SortOrder={Enum.SortOrder.LayoutOrder}
						FillDirection={Enum.FillDirection.Horizontal}
						Padding={new UDim(0, 6)}
						HorizontalAlignment={Enum.HorizontalAlignment.Center}
						VerticalAlignment={Enum.VerticalAlignment.Center}
					/>
					{[1, 2, 3, 4].map((level) => (
						<frame
							key={`dot-${level}`}
							LayoutOrder={level}
							Size={new UDim2(0, 10, 0, 10)}
							BackgroundColor3={evolutionLevel >= level ? DOT_ON : DOT_OFF}
							BorderSizePixel={0}
						>
							<uicorner CornerRadius={new UDim(1, 0)} />
						</frame>
					))}
				</frame>
				{/* Next threshold */}
				{nextThreshold > 0 && (
					<textlabel
						key="NextLevel"
						LayoutOrder={3}
						Size={new UDim2(1, 0, 0, 14)}
						BackgroundTransparency={1}
						Text={`Next: ${nextThreshold}`}
						TextColor3={Color3.fromRGB(180, 180, 200)}
						TextScaled={true}
						Font={Enum.Font.Gotham}
					/>
				)}
			</frame>
		</>
	);
}
