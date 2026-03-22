import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { GameStoreState } from "shared/store/game-store";

export function PlayPointsDisplay() {
	const playPoints = useSelector((state: GameStoreState) => state.playPoints);
	const level = useSelector((state: GameStoreState) => state.playgroundLevel);

	return (
		<frame
			key="PlayPointsDisplay"
			Size={new UDim2(0.08, 0, 0.04, 0)}
			Position={new UDim2(0.01, 0, 0.02, 0)}
			BackgroundColor3={Color3.fromRGB(0, 0, 0)}
			BackgroundTransparency={0.5}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 6)} />
			<textlabel
				Size={new UDim2(1, 0, 1, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 220, 100)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={`Lv.${level}`}
			/>
		</frame>
	);
}
