import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { GameStoreState } from "shared/store/game-store";

export function HintText() {
	const hintText = useSelector((state: GameStoreState) => state.hintText);

	if (hintText === "") {
		return undefined!;
	}

	return (
		<textlabel
			key="HintText"
			Size={new UDim2(0.5, 0, 0.04, 0)}
			Position={new UDim2(0.25, 0, 0.88, 0)}
			BackgroundColor3={Color3.fromRGB(0, 0, 0)}
			BackgroundTransparency={0.5}
			BorderSizePixel={0}
			TextColor3={Color3.fromRGB(255, 255, 200)}
			TextScaled={true}
			Font={Enum.Font.GothamMedium}
			Text={hintText}
		>
			<uicorner CornerRadius={new UDim(0, 6)} />
		</textlabel>
	);
}
