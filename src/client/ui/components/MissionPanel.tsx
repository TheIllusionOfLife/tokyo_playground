import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { clientEvents } from "client/network";
import { GameStoreState } from "shared/store/game-store";
import { MissionProgressData } from "shared/types";

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
							: Color3.fromRGB(70, 70, 70)
				}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={
					mission.rewardCollected
						? "Claimed"
						: canClaim
							? `+${mission.pointsReward}`
							: "..."
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
	const [open, setOpen] = React.useState(false);
	const missions = useSelector((state: GameStoreState) => state.missions);

	return (
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
				Text="★ Missions"
				Event={{
					Activated: () => setOpen(!open),
				}}
			>
				<uipadding PaddingLeft={new UDim(0, 8)} PaddingRight={new UDim(0, 8)} />
			</textbutton>
			{open ? (
				<frame
					Size={new UDim2(0, 290, 0, 205)}
					Position={new UDim2(1, 0, 1, 4)}
					AnchorPoint={new Vector2(1, 0)}
					BackgroundColor3={Color3.fromRGB(20, 20, 40)}
					BackgroundTransparency={0.1}
					BorderSizePixel={0}
					ZIndex={11}
				>
					<uicorner CornerRadius={new UDim(0, 8)} />
					<uilistlayout
						FillDirection={Enum.FillDirection.Vertical}
						Padding={new UDim(0, 4)}
						HorizontalAlignment={Enum.HorizontalAlignment.Center}
					/>
					<uipadding
						PaddingLeft={new UDim(0, 4)}
						PaddingRight={new UDim(0, 4)}
						PaddingTop={new UDim(0, 4)}
						PaddingBottom={new UDim(0, 4)}
					/>
					{missions.map((mission) => (
						<MissionRow key={mission.id} mission={mission} />
					))}
				</frame>
			) : (
				undefined!
			)}
		</frame>
	);
}
