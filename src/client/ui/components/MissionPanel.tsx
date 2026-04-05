import React, { useState } from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { clientEvents } from "client/network";
import { ALL_POI_ZONES } from "shared/constants";
import { t, tMission } from "shared/localization";
import {
	L_CLAIMED,
	L_DAILY_MISSIONS,
	L_MISSIONS,
} from "shared/localization/keys";
import { GameStoreState, gameStore } from "shared/store/game-store";
import { MatchPhase, MissionProgressData } from "shared/types";

type MissionTab = "missions" | "poi";

function MissionRow({
	mission,
	layoutOrder,
}: {
	mission: MissionProgressData;
	layoutOrder?: number;
}) {
	const canClaim =
		mission.progress >= mission.target && !mission.rewardCollected;
	const fillRatio = math.min(mission.progress / math.max(mission.target, 1), 1);

	return (
		<frame
			key={mission.id}
			LayoutOrder={layoutOrder ?? 0}
			Size={new UDim2(1, -8, 0, 50)}
			BackgroundColor3={Color3.fromRGB(35, 35, 50)}
			BackgroundTransparency={0.2}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 4)} />
			{/* Mission label with inline progress */}
			<textlabel
				Size={new UDim2(0.65, 0, 0.58, 0)}
				Position={new UDim2(0.02, 0, 0.04, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(230, 230, 230)}
				TextScaled={true}
				Font={Enum.Font.Gotham}
				Text={`${tMission(mission.id)}  ${mission.progress}/${mission.target}`}
				TextXAlignment={Enum.TextXAlignment.Left}
			/>
			{/* Progress bar */}
			<frame
				Size={new UDim2(0.65, 0, 0.1, 0)}
				Position={new UDim2(0.02, 0, 0.72, 0)}
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
			{/* Points button: always shows pts, gray when in-progress, green when claimable */}
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
					mission.rewardCollected
						? Color3.fromRGB(120, 120, 140)
						: canClaim
							? Color3.fromRGB(255, 255, 255)
							: Color3.fromRGB(100, 100, 120)
				}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={
					mission.rewardCollected ? t(L_CLAIMED) : `+${mission.pointsReward}`
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

function PoiRow({
	zoneName,
	discovered,
	claimed,
	layoutOrder,
}: {
	zoneName: string;
	discovered: boolean;
	claimed: boolean;
	layoutOrder: number;
}) {
	const zoneKey = `zone_${zoneName}`;
	const localized = t(zoneKey);
	const displayName = localized === zoneKey ? zoneName : localized;
	const canClaim = discovered && !claimed;

	return (
		<frame
			key={zoneName}
			LayoutOrder={layoutOrder}
			Size={new UDim2(1, -8, 0, 36)}
			BackgroundColor3={Color3.fromRGB(35, 35, 50)}
			BackgroundTransparency={0.2}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 4)} />
			{/* Status icon */}
			<textlabel
				Size={new UDim2(0, 20, 1, 0)}
				Position={new UDim2(0, 4, 0, 0)}
				BackgroundTransparency={1}
				TextColor3={
					claimed
						? Color3.fromRGB(255, 215, 0)
						: discovered
							? Color3.fromRGB(80, 200, 120)
							: Color3.fromRGB(100, 100, 120)
				}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={claimed ? "\u{2B50}" : discovered ? "\u{2714}" : "\u{1F512}"}
			/>
			{/* Zone name */}
			<textlabel
				Size={new UDim2(0.5, 0, 1, 0)}
				Position={new UDim2(0, 28, 0, 0)}
				BackgroundTransparency={1}
				TextColor3={
					discovered
						? Color3.fromRGB(230, 230, 230)
						: Color3.fromRGB(120, 120, 140)
				}
				TextScaled={true}
				Font={Enum.Font.Gotham}
				Text={displayName}
				TextXAlignment={Enum.TextXAlignment.Left}
			/>
			{/* Claim button */}
			<textbutton
				Size={new UDim2(0.28, 0, 0.7, 0)}
				Position={new UDim2(0.7, 0, 0.15, 0)}
				BackgroundColor3={
					claimed
						? Color3.fromRGB(60, 60, 60)
						: canClaim
							? Color3.fromRGB(80, 200, 120)
							: Color3.fromRGB(50, 50, 65)
				}
				TextColor3={
					claimed
						? Color3.fromRGB(120, 120, 140)
						: canClaim
							? Color3.fromRGB(255, 255, 255)
							: Color3.fromRGB(100, 100, 120)
				}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={
					claimed
						? t("poi_claimed")
						: canClaim
							? t("poi_claim")
							: t("poi_undiscovered")
				}
				Active={canClaim}
				Event={{
					Activated: () => {
						if (canClaim) {
							clientEvents.claimPoiReward.fire(zoneName);
						}
					},
				}}
			>
				<uicorner CornerRadius={new UDim(0, 4)} />
			</textbutton>
		</frame>
	);
}

function TabButton({
	label,
	active,
	layoutOrder,
	onActivated,
}: {
	label: string;
	active: boolean;
	layoutOrder: number;
	onActivated: () => void;
}) {
	return (
		<textbutton
			LayoutOrder={layoutOrder}
			Size={new UDim2(0.48, 0, 1, 0)}
			BackgroundColor3={
				active ? Color3.fromRGB(60, 60, 100) : Color3.fromRGB(30, 30, 50)
			}
			BackgroundTransparency={active ? 0.1 : 0.4}
			BorderSizePixel={0}
			TextColor3={
				active ? Color3.fromRGB(255, 255, 200) : Color3.fromRGB(150, 150, 170)
			}
			TextScaled={true}
			Font={active ? Enum.Font.GothamBold : Enum.Font.Gotham}
			Text={label}
			Event={{ Activated: onActivated }}
		>
			<uicorner CornerRadius={new UDim(0, 6)} />
		</textbutton>
	);
}

export function MissionPanel() {
	const activeOverlay = useSelector(
		(state: GameStoreState) => state.activeOverlay,
	);
	const open = activeOverlay === "missions";
	const missions = useSelector((state: GameStoreState) => state.missions);
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);
	const claimReady = useSelector(
		(state: GameStoreState) => state.missionClaimReady,
	);
	const discoveredPoi = useSelector(
		(state: GameStoreState) => state.discoveredPoi,
	);
	const poiClaimedRewards = useSelector(
		(state: GameStoreState) => state.poiClaimedRewards,
	);
	const [activeTab, setActiveTab] = useState<MissionTab>("missions");

	const isGameplayPhase =
		matchPhase === MatchPhase.Countdown ||
		matchPhase === MatchPhase.Preparing ||
		matchPhase === MatchPhase.InProgress ||
		matchPhase === MatchPhase.RoundOver ||
		matchPhase === MatchPhase.Rewarding;

	// During gameplay, only show the claim toast (not the full panel/button)
	if (isGameplayPhase) {
		return (
			<>
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

	return (
		<>
			{/* Toggle button removed — now handled by ActionBar */}
			{/* Centered overlay when open */}
			{open ? (
				<frame
					key="MissionOverlay"
					Size={new UDim2(0.55, 0, 1, -10)}
					Position={new UDim2(0.5, 0, 0.5, 0)}
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundColor3={Color3.fromRGB(20, 20, 40)}
					BackgroundTransparency={0.05}
					BorderSizePixel={0}
					ZIndex={19}
				>
					<uicorner CornerRadius={new UDim(0, 12)} />
					{/* Close button */}
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
					{/* Tab bar */}
					<frame
						key="TabBar"
						Size={new UDim2(0.7, -40, 0, 28)}
						Position={new UDim2(0.5, -20, 0, 10)}
						AnchorPoint={new Vector2(0.5, 0)}
						BackgroundTransparency={1}
						BorderSizePixel={0}
						ZIndex={19}
					>
						<uilistlayout
							FillDirection={Enum.FillDirection.Horizontal}
							Padding={new UDim(0, 6)}
							HorizontalAlignment={Enum.HorizontalAlignment.Center}
						/>
						<TabButton
							label={t(L_DAILY_MISSIONS)}
							active={activeTab === "missions"}
							layoutOrder={0}
							onActivated={() => setActiveTab("missions")}
						/>
						<TabButton
							label={t("poi_header")}
							active={activeTab === "poi"}
							layoutOrder={1}
							onActivated={() => setActiveTab("poi")}
						/>
					</frame>
					{/* Tab content */}
					<scrollingframe
						Size={new UDim2(1, -24, 1, -52)}
						Position={new UDim2(0, 12, 0, 46)}
						BackgroundTransparency={1}
						BorderSizePixel={0}
						ScrollBarThickness={4}
						ScrollBarImageColor3={Color3.fromRGB(100, 100, 120)}
						CanvasSize={new UDim2(0, 0, 0, 0)}
						AutomaticCanvasSize={Enum.AutomaticSize.Y}
						ZIndex={19}
					>
						<uilistlayout
							FillDirection={Enum.FillDirection.Vertical}
							Padding={new UDim(0, 4)}
							HorizontalAlignment={Enum.HorizontalAlignment.Center}
						/>
						{activeTab === "missions"
							? missions.map((mission, i) => (
									<MissionRow
										key={mission.id}
										mission={mission}
										layoutOrder={i}
									/>
								))
							: ALL_POI_ZONES.map((zoneName, i) => (
									<PoiRow
										key={zoneName}
										zoneName={zoneName}
										discovered={discoveredPoi.includes(zoneName)}
										claimed={poiClaimedRewards.includes(zoneName)}
										layoutOrder={i}
									/>
								))}
					</scrollingframe>
				</frame>
			) : (
				undefined!
			)}
			{/* Mission claim toast */}
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
