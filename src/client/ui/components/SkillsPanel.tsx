import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { HACHI_EVOLUTION_THRESHOLDS } from "shared/constants";
import { GameStoreState, gameStore } from "shared/store/game-store";
import { MatchPhase, MinigameId } from "shared/types";

const SKILLS = [
	{
		level: 0,
		name: "Jump",
		desc: "Press Space to jump",
		items: HACHI_EVOLUTION_THRESHOLDS[0],
	},
	{
		level: 1,
		name: "Double Jump",
		desc: "Press Space mid-air",
		items: HACHI_EVOLUTION_THRESHOLDS[1],
	},
	{
		level: 2,
		name: "Wall Run",
		desc: "Jump near walls",
		items: HACHI_EVOLUTION_THRESHOLDS[2],
	},
	{
		level: 3,
		name: "Big Hachi",
		desc: "Bigger and faster",
		items: HACHI_EVOLUTION_THRESHOLDS[3],
	},
	{
		level: 4,
		name: "Fluffy Hachi",
		desc: "Maximum cuteness",
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
	// useEffect keeps render pure (no store dispatch during render).
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
			Size={new UDim2(0, 100, 0, 30)}
			Position={new UDim2(1, -10, 0, 86)}
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
				Text="Skills"
				Event={{
					Activated: () => gameStore.setActiveOverlay(open ? "none" : "skills"),
				}}
			>
				<uipadding PaddingLeft={new UDim(0, 8)} PaddingRight={new UDim(0, 8)} />
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
									Text={skill.name}
									TextXAlignment={Enum.TextXAlignment.Left}
								/>
								<textlabel
									Size={new UDim2(0.45, 0, 0.45, 0)}
									Position={new UDim2(0.18, 0, 0.55, 0)}
									BackgroundTransparency={1}
									TextColor3={Color3.fromRGB(180, 180, 200)}
									TextScaled={true}
									Font={Enum.Font.Gotham}
									Text={skill.desc}
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
									Text={unlocked ? "Unlocked" : `${skill.items} pts`}
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
