import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { GameStoreState } from "shared/store/game-store";

export function RoundIntroOverlay() {
	const intro = useSelector((state: GameStoreState) => state.roundIntro);

	if (!intro) {
		return undefined!;
	}

	return (
		<frame
			key="RoundIntroOverlay"
			Size={new UDim2(0.5, 0, 0.18, 0)}
			Position={new UDim2(0.25, 0, 0.16, 0)}
			BackgroundColor3={Color3.fromRGB(10, 12, 24)}
			BackgroundTransparency={0.1}
			BorderSizePixel={0}
			ZIndex={20}
		>
			<uicorner CornerRadius={new UDim(0, 12)} />
			<textlabel
				Size={new UDim2(1, -24, 0.45, 0)}
				Position={new UDim2(0, 12, 0, 10)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 220, 120)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={intro.title}
				ZIndex={21}
			/>
			<textlabel
				Size={new UDim2(1, -24, 0.45, 0)}
				Position={new UDim2(0, 12, 0.46, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(240, 240, 255)}
				TextScaled={true}
				Font={Enum.Font.Gotham}
				Text={intro.subtitle}
				ZIndex={21}
			/>
		</frame>
	);
}
