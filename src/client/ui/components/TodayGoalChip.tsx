import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { clientEvents } from "client/network";
import { GameStoreState } from "shared/store/game-store";
import { MatchPhase, MinigameId } from "shared/types";

export function TodayGoalChip() {
	const missions = useSelector((state: GameStoreState) => state.missions);
	const claimReady = useSelector(
		(state: GameStoreState) => state.missionClaimReady,
	);
	const activeOverlay = useSelector(
		(state: GameStoreState) => state.activeOverlay,
	);
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);
	const activeMinigameId = useSelector(
		(state: GameStoreState) => state.activeMinigameId,
	);

	const nextMission = missions.find(
		(mission) => !mission.rewardCollected && mission.progress < mission.target,
	);

	// Hide chip when an overlay is open (claim toast stays visible always)
	const overlayOpen = activeOverlay !== "none";
	const inProgress = matchPhase === MatchPhase.InProgress;
	// Hide goal chip during HachiRide (irrelevant mission info)
	const isHachiRide = activeMinigameId === MinigameId.HachiRide;

	return (
		<>
			{nextMission && !overlayOpen && !(inProgress && isHachiRide) ? (
				inProgress ? (
					// Minimized compact chip during gameplay
					<frame
						key="TodayGoalChip"
						Size={new UDim2(0, 180, 0, 28)}
						Position={new UDim2(0, 14, 0, 62)}
						BackgroundColor3={Color3.fromRGB(24, 34, 48)}
						BackgroundTransparency={0.4}
						BorderSizePixel={0}
					>
						<uicorner CornerRadius={new UDim(0, 8)} />
						<textlabel
							Size={new UDim2(1, -12, 1, 0)}
							Position={new UDim2(0, 6, 0, 0)}
							BackgroundTransparency={1}
							TextColor3={Color3.fromRGB(240, 240, 255)}
							TextScaled={true}
							Font={Enum.Font.Gotham}
							Text={`Goal: ${nextMission.label} ${nextMission.progress}/${nextMission.target}`}
							TextXAlignment={Enum.TextXAlignment.Left}
						/>
					</frame>
				) : (
					// Full chip in lobby (compact)
					<frame
						key="TodayGoalChip"
						Size={new UDim2(0, 220, 0, 44)}
						Position={new UDim2(0, 14, 0, 52)}
						BackgroundColor3={Color3.fromRGB(24, 34, 48)}
						BackgroundTransparency={0.12}
						BorderSizePixel={0}
					>
						<uicorner CornerRadius={new UDim(0, 10)} />
						<textlabel
							Size={new UDim2(1, -18, 0, 18)}
							Position={new UDim2(0, 9, 0, 6)}
							BackgroundTransparency={1}
							TextColor3={Color3.fromRGB(255, 229, 126)}
							TextScaled={true}
							Font={Enum.Font.GothamBold}
							Text="Today's Goal"
							TextXAlignment={Enum.TextXAlignment.Left}
						/>
						<textlabel
							Size={new UDim2(1, -18, 0, 16)}
							Position={new UDim2(0, 9, 0, 24)}
							BackgroundTransparency={1}
							TextColor3={Color3.fromRGB(240, 240, 255)}
							TextScaled={true}
							Font={Enum.Font.Gotham}
							Text={`${nextMission.label} (${nextMission.progress}/${nextMission.target})`}
							TextXAlignment={Enum.TextXAlignment.Left}
						/>
					</frame>
				)
			) : (
				undefined!
			)}
			{claimReady ? (
				<textbutton
					key="MissionClaimToast"
					Size={new UDim2(0, 250, 0, 46)}
					Position={new UDim2(0.5, -125, 0.78, 0)}
					BackgroundColor3={Color3.fromRGB(48, 126, 76)}
					BorderSizePixel={0}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					Font={Enum.Font.GothamBold}
					Text={`Mission Ready! Claim +${claimReady.pointsReward}`}
					ZIndex={22}
					Event={{
						Activated: () => {
							clientEvents.collectMissionReward.fire(claimReady.id);
						},
					}}
				>
					<uicorner CornerRadius={new UDim(0, 10)} />
				</textbutton>
			) : (
				undefined!
			)}
		</>
	);
}
