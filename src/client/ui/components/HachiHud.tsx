import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { HACHI_EVOLUTION_THRESHOLDS } from "shared/constants";
import { GameStoreState } from "shared/store/game-store";
import { MatchPhase, MinigameId } from "shared/types";

const BAR_BG = Color3.fromRGB(40, 40, 60);
const BAR_FILL = Color3.fromRGB(255, 200, 50);
const BAR_MAX = Color3.fromRGB(80, 200, 120);

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
	const maxLevel = HACHI_EVOLUTION_THRESHOLDS.size() - 1;
	const isMaxLevel = evolutionLevel >= maxLevel;

	// Compute progress ratio within current level toward next level
	const currentLevelThreshold = HACHI_EVOLUTION_THRESHOLDS[evolutionLevel] ?? 0;
	const nextLevelThreshold =
		HACHI_EVOLUTION_THRESHOLDS[evolutionLevel + 1] ?? currentLevelThreshold;
	const levelRange = nextLevelThreshold - currentLevelThreshold;
	const progressRatio = isMaxLevel
		? 1
		: levelRange > 0
			? math.clamp((itemCount - currentLevelThreshold) / levelRange, 0, 1)
			: 0;

	return (
		<>
			{/* Rank badge - top right */}
			<frame
				key="RankBadge"
				Size={new UDim2(0, 50, 0, 30)}
				Position={new UDim2(1, -10, 0, 0)}
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

			{/* Points + speed-meter progress bar */}
			<frame
				key="PointsInfo"
				Size={new UDim2(0, 100, 0, 50)}
				Position={new UDim2(1, -10, 0.15, 0)}
				AnchorPoint={new Vector2(1, 0)}
				BackgroundColor3={Color3.fromRGB(15, 15, 30)}
				BackgroundTransparency={0.2}
				BorderSizePixel={0}
			>
				<uicorner CornerRadius={new UDim(0, 8)} />
				<uipadding
					PaddingTop={new UDim(0, 4)}
					PaddingBottom={new UDim(0, 4)}
					PaddingLeft={new UDim(0, 6)}
					PaddingRight={new UDim(0, 6)}
				/>
				{/* Points text */}
				<textlabel
					key="Points"
					Size={new UDim2(1, 0, 0, 14)}
					Position={new UDim2(0, 0, 0, 0)}
					BackgroundTransparency={1}
					Text={`${itemCount} pts`}
					TextColor3={Color3.fromRGB(255, 220, 80)}
					TextScaled={true}
					Font={Enum.Font.GothamBold}
				/>
				{/* Speed-meter progress bar */}
				<frame
					key="ProgressBar"
					Size={new UDim2(1, 0, 0, 8)}
					Position={new UDim2(0, 0, 0, 18)}
					BackgroundColor3={BAR_BG}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(0, 4)} />
					<frame
						Size={new UDim2(progressRatio, 0, 1, 0)}
						BackgroundColor3={isMaxLevel ? BAR_MAX : BAR_FILL}
						BorderSizePixel={0}
					>
						<uicorner CornerRadius={new UDim(0, 4)} />
					</frame>
				</frame>
				{/* Level + next threshold */}
				<textlabel
					key="LevelInfo"
					Size={new UDim2(1, 0, 0, 12)}
					Position={new UDim2(0, 0, 0, 30)}
					BackgroundTransparency={1}
					Text={
						isMaxLevel
							? `Lv.${evolutionLevel} MAX`
							: `Lv.${evolutionLevel} → ${nextThreshold}`
					}
					TextColor3={Color3.fromRGB(180, 180, 200)}
					TextScaled={true}
					Font={Enum.Font.Gotham}
				/>
			</frame>
		</>
	);
}
