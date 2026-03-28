import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { t } from "shared/localization";
import { L_ONI_REVEAL } from "shared/localization/keys";
import { GameStoreState } from "shared/store/game-store";

export function CountdownOverlay() {
	const countdownSeconds = useSelector(
		(state: GameStoreState) => state.countdownSeconds,
	);
	const oniRevealName = useSelector(
		(state: GameStoreState) => state.oniRevealName,
	);

	// Oni reveal takes priority over countdown numbers
	if (oniRevealName !== undefined) {
		return (
			<frame
				key="OniReveal"
				Size={new UDim2(0.6, 0, 0.25, 0)}
				Position={new UDim2(0.2, 0, 0.3, 0)}
				BackgroundTransparency={1}
			>
				<textlabel
					Size={new UDim2(1, 0, 0.4, 0)}
					Position={new UDim2(0, 0, 0, 0)}
					BackgroundTransparency={1}
					TextColor3={Color3.fromRGB(255, 200, 100)}
					TextStrokeColor3={Color3.fromRGB(0, 0, 0)}
					TextStrokeTransparency={0.3}
					TextScaled={true}
					Font={Enum.Font.GothamBold}
					Text={t(L_ONI_REVEAL)}
				/>
				<textlabel
					Size={new UDim2(1, 0, 0.6, 0)}
					Position={new UDim2(0, 0, 0.4, 0)}
					BackgroundTransparency={1}
					TextColor3={Color3.fromRGB(220, 80, 80)}
					TextStrokeColor3={Color3.fromRGB(0, 0, 0)}
					TextStrokeTransparency={0.2}
					TextScaled={true}
					Font={Enum.Font.GothamBlack}
					Text={oniRevealName.upper()}
				/>
			</frame>
		);
	}

	if (countdownSeconds <= 0) {
		return undefined;
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
