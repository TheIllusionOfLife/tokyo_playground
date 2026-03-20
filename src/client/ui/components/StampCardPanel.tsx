import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { STAMP_SET_DEFINITIONS } from "shared/constants";
import { GameStoreState, gameStore } from "shared/store/game-store";
import { StampSetId } from "shared/types";

function StampSetRow({
	setId,
	discovered,
}: {
	setId: StampSetId;
	discovered: string[];
}) {
	const setDef = STAMP_SET_DEFINITIONS[setId];
	if (!setDef || setDef.stampIds.size() === 0) return undefined;

	const count = setDef.stampIds.reduce(
		(acc, id) => acc + (discovered.includes(id) ? 1 : 0),
		0,
	);
	const total = setDef.stampIds.size();
	const fillRatio = total > 0 ? count / total : 0;
	const isComplete = count >= total;

	return (
		<frame
			key={setId}
			Size={new UDim2(1, -8, 0, 52)}
			BackgroundColor3={
				isComplete ? Color3.fromRGB(50, 50, 30) : Color3.fromRGB(35, 35, 50)
			}
			BackgroundTransparency={0.2}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 4)} />
			<textlabel
				Size={new UDim2(0.6, 0, 0.5, 0)}
				Position={new UDim2(0.03, 0, 0.05, 0)}
				BackgroundTransparency={1}
				TextColor3={
					isComplete
						? Color3.fromRGB(255, 220, 80)
						: Color3.fromRGB(230, 230, 230)
				}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={setDef.displayName}
				TextXAlignment={Enum.TextXAlignment.Left}
			/>
			<textlabel
				Size={new UDim2(0.3, 0, 0.5, 0)}
				Position={new UDim2(0.67, 0, 0.05, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(180, 180, 200)}
				TextScaled={true}
				Font={Enum.Font.Gotham}
				Text={`${count} / ${total}`}
				TextXAlignment={Enum.TextXAlignment.Right}
			/>
			<frame
				Size={new UDim2(0.94, 0, 0.12, 0)}
				Position={new UDim2(0.03, 0, 0.78, 0)}
				BackgroundColor3={Color3.fromRGB(40, 40, 60)}
				BorderSizePixel={0}
			>
				<uicorner CornerRadius={new UDim(0, 2)} />
				<frame
					Size={new UDim2(fillRatio, 0, 1, 0)}
					BackgroundColor3={
						isComplete
							? Color3.fromRGB(255, 200, 50)
							: Color3.fromRGB(120, 180, 255)
					}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(0, 2)} />
				</frame>
			</frame>
		</frame>
	);
}

export function StampCardPanel() {
	const visible = useSelector(
		(state: GameStoreState) => state.stampCardVisible,
	);
	const stampCard = useSelector((state: GameStoreState) => state.stampCard);

	if (!visible) return undefined;

	const setIds = [
		StampSetId.BackAlley,
		StampSetId.Rooftop,
		StampSetId.NightShibuya,
		StampSetId.ShrinePath,
		StampSetId.Station,
		StampSetId.GoldenMoments,
		StampSetId.Seasonal,
	];

	return (
		<frame
			key="StampCardPanel"
			Size={new UDim2(0.35, 0, 0.7, 0)}
			Position={new UDim2(0.325, 0, 0.15, 0)}
			BackgroundColor3={Color3.fromRGB(20, 20, 35)}
			BackgroundTransparency={0.1}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 8)} />
			<uistroke Color={Color3.fromRGB(100, 100, 140)} Thickness={1} />

			{/* Header */}
			<textlabel
				Size={new UDim2(0.7, 0, 0.07, 0)}
				Position={new UDim2(0.03, 0, 0.02, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 220, 120)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text="Stamp Rally"
				TextXAlignment={Enum.TextXAlignment.Left}
			/>

			{/* Total counter */}
			<textlabel
				Size={new UDim2(0.25, 0, 0.05, 0)}
				Position={new UDim2(0.72, 0, 0.03, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(180, 180, 200)}
				TextScaled={true}
				Font={Enum.Font.Gotham}
				Text={`${stampCard.discovered.size()} / ${stampCard.totalCount}`}
				TextXAlignment={Enum.TextXAlignment.Right}
			/>

			{/* Close button */}
			<textbutton
				Size={new UDim2(0.08, 0, 0.05, 0)}
				Position={new UDim2(0.9, 0, 0.02, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(200, 200, 200)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text="X"
				Event={{
					Activated: () => gameStore.setStampCardVisible(false),
				}}
			/>

			{/* Scrolling set list */}
			<scrollingframe
				Size={new UDim2(0.96, 0, 0.84, 0)}
				Position={new UDim2(0.02, 0, 0.1, 0)}
				BackgroundTransparency={1}
				BorderSizePixel={0}
				ScrollBarThickness={4}
				CanvasSize={new UDim2(0, 0, 0, setIds.size() * 58)}
				ScrollBarImageColor3={Color3.fromRGB(100, 100, 140)}
			>
				<uilistlayout
					Padding={new UDim(0, 6)}
					SortOrder={Enum.SortOrder.LayoutOrder}
				/>
				{setIds.map((setId) => (
					<StampSetRow
						key={setId}
						setId={setId}
						discovered={stampCard.discovered}
					/>
				))}
			</scrollingframe>
		</frame>
	);
}
