import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { GameStoreState } from "shared/store/game-store";

export function CountdownOverlay() {
	const countdownSeconds = useSelector(
		(state: GameStoreState) => state.countdownSeconds,
	);

	if (countdownSeconds <= 0) {
		return undefined!;
	}

	return (
		<textlabel
			key="CountdownOverlay"
			Size={new UDim2(0.2, 0, 0.15, 0)}
			Position={new UDim2(0.4, 0, 0.35, 0)}
			BackgroundTransparency={1}
			TextColor3={Color3.fromRGB(255, 255, 255)}
			TextStrokeColor3={Color3.fromRGB(0, 0, 0)}
			TextStrokeTransparency={0.3}
			TextScaled={true}
			Font={Enum.Font.GothamBold}
			Text={tostring(countdownSeconds)}
		/>
	);
}
