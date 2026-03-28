import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { clientEvents } from "client/network";
import { GameStoreState, gameStore } from "shared/store/game-store";
import { MatchPhase, MinigameId, MissionProgressData } from "shared/types";

function MissionRow({ mission }: { mission: MissionProgressData }) {
	const canClaim =
		mission.progress >= mission.target && !mission.rewardCollected;
	const fillRatio = math.min(mission.progress / math.max(mission.target, 1), 1);

	return (
		<frame
			key={mission.id}
			Size={new UDim2(1, -8, 0, 58)}
			BackgroundColor3={Color3.fromRGB(35, 35, 50)}
			BackgroundTransparency={0.2}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 4)} />
			<textlabel
				Size={new UDim2(0.65, 0, 0.52, 0)}
				Position={new UDim2(0.02, 0, 0.04, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(230, 230, 230)}
				TextScaled={true}
				Font={Enum.Font.Gotham}
				Text={mission.label}
				TextXAlignment={Enum.TextXAlignment.Left}
			/>
			<textlabel
				Size={new UDim2(0.65, 0, 0.28, 0)}
				Position={new UDim2(0.02, 0, 0.58, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(160, 160, 180)}
				TextScaled={true}
				Font={Enum.Font.Gotham}
				Text={`${mission.progress} / ${mission.target}`}
				TextXAlignment={Enum.TextXAlignment.Left}
			/>
			<frame
				Size={new UDim2(0.65, 0, 0.1, 0)}
				Position={new UDim2(0.02, 0, 0.88, 0)}
				BackgroundColor3={Color3.fromRGB(40, 40, 60)}
				BorderSizePixel={0}
			>
				<uicorner CornerRadius={new UDim(0, 2)} />
				<frame
					Size={new UDim2(fillRatio, 0, 1, 0)}
					BackgroundColor3={Color3.fromRGB(80, 200, 120)}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(0, 2)} />
				</frame>
			</frame>
			<textbutton
				Size={new UDim2(0.28, 0, 0.68, 0)}
				Position={new UDim2(0.7, 0, 0.16, 0)}
				BackgroundColor3={
					mission.rewardCollected
						? Color3.fromRGB(60, 60, 60)
						: canClaim
							? Color3.fromRGB(80, 200, 120)
							: Color3.fromRGB(50, 50, 65)
				}
				TextColor3={
					canClaim
						? Color3.fromRGB(255, 255, 255)
						: Color3.fromRGB(120, 120, 140)
				}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={
					mission.rewardCollected
						? "Claimed"
						: canClaim
							? `+${mission.pointsReward}`
							: `${mission.progress}/${mission.target}`
				}
				Active={canClaim}
				Event={{
					Activated: () => {
						if (canClaim) {
							clientEvents.collectMissionReward.fire(mission.id);
						}
					},
				}}
			>
				<uicorner CornerRadius={new UDim(0, 4)} />
			</textbutton>
		</frame>
	);
}

export function MissionPanel() {
	const activeOverlay = useSelector(
		(state: GameStoreState) => state.activeOverlay,
	);
	const open = activeOverlay === "missions";
	const missions = useSelector((state: GameStoreState) => state.missions);
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);
	const activeMinigameId = useSelector(
		(state: GameStoreState) => state.activeMinigameId,
	);

	// Hide during HachiRide InProgress (overlaps with rank/skills/points)
	if (
		activeMinigameId === MinigameId.HachiRide &&
		matchPhase === MatchPhase.InProgress
	) {
		return undefined!;
	}

	return (
		<>
			{/* Toggle button (top-right) */}
			<frame
				key="MissionPanel"
				Size={new UDim2(0, 100, 0, 30)}
				Position={new UDim2(1, -10, 0, 10)}
				AnchorPoint={new Vector2(1, 0)}
				BackgroundColor3={Color3.fromRGB(30, 30, 70)}
				BackgroundTransparency={0.3}
				BorderSizePixel={0}
				ZIndex={10}
			>
				<uicorner CornerRadius={new UDim(0, 15)} />
				<textbutton
					Size={new UDim2(1, 0, 1, 0)}
					BackgroundTransparency={1}
					TextColor3={Color3.fromRGB(255, 255, 150)}
					TextScaled={true}
					Font={Enum.Font.GothamBold}
					Text="Missions"
					Event={{
						Activated: () =>
							gameStore.setActiveOverlay(open ? "none" : "missions"),
					}}
				>
					<uipadding
						PaddingLeft={new UDim(0, 8)}
						PaddingRight={new UDim(0, 8)}
					/>
				</textbutton>
			</frame>
			{/* Centered overlay when open */}
			{open ? (
				<frame
					key="MissionOverlay"
					Size={new UDim2(0, 320, 0, 240)}
					Position={new UDim2(0.5, 0, 0.5, 0)}
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundColor3={Color3.fromRGB(20, 20, 40)}
					BackgroundTransparency={0.05}
					BorderSizePixel={0}
					ZIndex={19}
				>
					<uicorner CornerRadius={new UDim(0, 12)} />
					<textbutton
						Size={new UDim2(0, 32, 0, 32)}
						Position={new UDim2(1, -8, 0, 8)}
						AnchorPoint={new Vector2(1, 0)}
						BackgroundColor3={Color3.fromRGB(60, 40, 40)}
						BackgroundTransparency={0.3}
						TextColor3={Color3.fromRGB(255, 255, 255)}
						TextScaled={true}
						Font={Enum.Font.GothamBold}
						Text="X"
						ZIndex={20}
						Event={{
							Activated: () => gameStore.setActiveOverlay("none"),
						}}
					>
						<uicorner CornerRadius={new UDim(1, 0)} />
					</textbutton>
					<textlabel
						Size={new UDim2(1, -48, 0, 24)}
						Position={new UDim2(0, 12, 0, 12)}
						BackgroundTransparency={1}
						TextColor3={Color3.fromRGB(255, 255, 150)}
						TextScaled={true}
						Font={Enum.Font.GothamBold}
						Text="Daily Missions"
						TextXAlignment={Enum.TextXAlignment.Left}
						ZIndex={19}
					/>
					<frame
						Size={new UDim2(1, -24, 1, -48)}
						Position={new UDim2(0, 12, 0, 40)}
						BackgroundTransparency={1}
						BorderSizePixel={0}
						ZIndex={19}
					>
						<uilistlayout
							FillDirection={Enum.FillDirection.Vertical}
							Padding={new UDim(0, 4)}
							HorizontalAlignment={Enum.HorizontalAlignment.Center}
						/>
						{missions.map((mission) => (
							<MissionRow key={mission.id} mission={mission} />
						))}
					</frame>
				</frame>
			) : (
				undefined!
			)}
		</>
	);
}
