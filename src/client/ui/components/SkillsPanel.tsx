import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { HACHI_EVOLUTION_THRESHOLDS } from "shared/constants";
import { t } from "shared/localization";
import {
	L_SKILL_BIG_HACHI,
	L_SKILL_BIG_HACHI_DESC,
	L_SKILL_DOUBLE_JUMP,
	L_SKILL_DOUBLE_JUMP_DESC,
	L_SKILL_FLUFFY_HACHI,
	L_SKILL_FLUFFY_HACHI_DESC,
	L_SKILL_JUMP,
	L_SKILL_JUMP_DESC,
	L_SKILL_PTS_FMT,
	L_SKILL_UNLOCKED,
	L_SKILL_WALL_RUN,
	L_SKILL_WALL_RUN_DESC,
} from "shared/localization/keys";
import { GameStoreState, gameStore } from "shared/store/game-store";
import { MatchPhase, MinigameId } from "shared/types";

const SKILLS = [
	{
		level: 0,
		nameKey: L_SKILL_JUMP,
		descKey: L_SKILL_JUMP_DESC,
		items: HACHI_EVOLUTION_THRESHOLDS[0],
	},
	{
		level: 1,
		nameKey: L_SKILL_DOUBLE_JUMP,
		descKey: L_SKILL_DOUBLE_JUMP_DESC,
		items: HACHI_EVOLUTION_THRESHOLDS[1],
	},
	{
		level: 2,
		nameKey: L_SKILL_WALL_RUN,
		descKey: L_SKILL_WALL_RUN_DESC,
		items: HACHI_EVOLUTION_THRESHOLDS[2],
	},
	{
		level: 3,
		nameKey: L_SKILL_BIG_HACHI,
		descKey: L_SKILL_BIG_HACHI_DESC,
		items: HACHI_EVOLUTION_THRESHOLDS[3],
	},
	{
		level: 4,
		nameKey: L_SKILL_FLUFFY_HACHI,
		descKey: L_SKILL_FLUFFY_HACHI_DESC,
		items: HACHI_EVOLUTION_THRESHOLDS[4],
	},
];

const UNLOCKED_COLOR = Color3.fromRGB(80, 200, 120);
const LOCKED_COLOR = Color3.fromRGB(60, 60, 70);
const CURRENT_COLOR = Color3.fromRGB(255, 200, 50);

export function SkillsPanel() {
	const activeOverlay = useSelector((s: GameStoreState) => s.activeOverlay);
	const open = activeOverlay === "skills";
	const matchPhase = useSelector((s: GameStoreState) => s.matchPhase);
	const activeMinigameId = useSelector(
		(s: GameStoreState) => s.activeMinigameId,
	);
	const evolutionLevel = useSelector(
		(s: GameStoreState) => s.hachiEvolutionLevel,
	);

	// Only show during Hachi Ride
	const visible =
		activeMinigameId === MinigameId.HachiRide &&
		matchPhase === MatchPhase.InProgress;

	// Reset stale overlay when panel becomes invisible so
	// TodayGoalChip/FeaturedUnlockBanner don't stay suppressed.
	React.useEffect(() => {
		if (!visible && activeOverlay === "skills") {
			gameStore.setActiveOverlay("none");
		}
	}, [visible, activeOverlay]);

	if (!visible) {
		return undefined!;
	}

	return (
		<frame
			key="SkillsPanel"
			Size={new UDim2(0, 50, 0, 30)}
			Position={new UDim2(1, -10, 0.08, 0)}
			AnchorPoint={new Vector2(1, 0)}
			BackgroundColor3={Color3.fromRGB(50, 30, 70)}
			BackgroundTransparency={0.3}
			BorderSizePixel={0}
			ZIndex={10}
		>
			<uicorner CornerRadius={new UDim(0, 15)} />
			<textbutton
				Size={new UDim2(1, 0, 1, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(200, 150, 255)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={`★${evolutionLevel}`}
				Event={{
					Activated: () => gameStore.setActiveOverlay(open ? "none" : "skills"),
				}}
			>
				<uipadding PaddingLeft={new UDim(0, 4)} PaddingRight={new UDim(0, 4)} />
			</textbutton>
			{open ? (
				<frame
					Size={new UDim2(0, 240, 0, 220)}
					Position={new UDim2(1, 0, 1, 4)}
					AnchorPoint={new Vector2(1, 0)}
					BackgroundColor3={Color3.fromRGB(20, 15, 30)}
					BackgroundTransparency={0.1}
					BorderSizePixel={0}
					ZIndex={11}
				>
					<uicorner CornerRadius={new UDim(0, 8)} />
					<uilistlayout
						FillDirection={Enum.FillDirection.Vertical}
						Padding={new UDim(0, 3)}
						HorizontalAlignment={Enum.HorizontalAlignment.Center}
					/>
					<uipadding
						PaddingLeft={new UDim(0, 6)}
						PaddingRight={new UDim(0, 6)}
						PaddingTop={new UDim(0, 6)}
						PaddingBottom={new UDim(0, 6)}
					/>
					{SKILLS.map((skill) => {
						const unlocked = evolutionLevel >= skill.level;
						const isCurrent = evolutionLevel === skill.level;
						return (
							<frame
								key={`skill-${skill.level}`}
								LayoutOrder={skill.level}
								Size={new UDim2(1, 0, 0, 36)}
								BackgroundColor3={
									isCurrent
										? CURRENT_COLOR
										: unlocked
											? UNLOCKED_COLOR
											: LOCKED_COLOR
								}
								BackgroundTransparency={isCurrent ? 0.3 : 0.5}
								BorderSizePixel={0}
							>
								<uicorner CornerRadius={new UDim(0, 4)} />
								<textlabel
									Size={new UDim2(0.15, 0, 1, 0)}
									Position={new UDim2(0, 4, 0, 0)}
									BackgroundTransparency={1}
									TextColor3={Color3.fromRGB(255, 255, 255)}
									TextScaled={true}
									Font={Enum.Font.GothamBold}
									Text={`${skill.level}`}
								/>
								<textlabel
									Size={new UDim2(0.45, 0, 0.55, 0)}
									Position={new UDim2(0.18, 0, 0, 2)}
									BackgroundTransparency={1}
									TextColor3={Color3.fromRGB(255, 255, 255)}
									TextScaled={true}
									Font={Enum.Font.GothamBold}
									Text={t(skill.nameKey)}
									TextXAlignment={Enum.TextXAlignment.Left}
								/>
								<textlabel
									Size={new UDim2(0.45, 0, 0.45, 0)}
									Position={new UDim2(0.18, 0, 0.55, 0)}
									BackgroundTransparency={1}
									TextColor3={Color3.fromRGB(180, 180, 200)}
									TextScaled={true}
									Font={Enum.Font.Gotham}
									Text={t(skill.descKey)}
									TextXAlignment={Enum.TextXAlignment.Left}
								/>
								<textlabel
									Size={new UDim2(0.3, 0, 1, 0)}
									Position={new UDim2(0.7, 0, 0, 0)}
									BackgroundTransparency={1}
									TextColor3={
										unlocked
											? Color3.fromRGB(150, 255, 150)
											: Color3.fromRGB(150, 150, 150)
									}
									TextScaled={true}
									Font={Enum.Font.Gotham}
									Text={
										unlocked
											? t(L_SKILL_UNLOCKED)
											: t(L_SKILL_PTS_FMT).gsub("%%d", tostring(skill.items))[0]
									}
								/>
							</frame>
						);
					})}
				</frame>
			) : (
				undefined!
			)}
		</frame>
	);
}
