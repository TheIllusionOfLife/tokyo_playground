import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { clientEvents } from "client/network";
import { GameStoreState } from "shared/store/game-store";
import { MatchPhase } from "shared/types";

export function HachiToggleButton() {
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);
	const costumed = useSelector((state: GameStoreState) => state.hachiCostumed);

	// Only show in lobby (not during minigames)
	if (matchPhase !== MatchPhase.WaitingForPlayers) {
		return undefined!;
	}

	const buttonColor = costumed
		? Color3.fromRGB(220, 100, 60)
		: Color3.fromRGB(60, 160, 220);
	const buttonText = costumed ? "Dismount" : "Ride Hachi";

	return (
		<textbutton
			key="HachiToggleButton"
			Size={new UDim2(0.12, 0, 0.06, 0)}
			Position={new UDim2(0.44, 0, 0.88, 0)}
			AnchorPoint={new Vector2(0.5, 0.5)}
			BackgroundColor3={buttonColor}
			BackgroundTransparency={0.1}
			BorderSizePixel={0}
			TextColor3={Color3.fromRGB(255, 255, 255)}
			TextScaled={true}
			Font={Enum.Font.GothamBold}
			Text={buttonText}
			Event={{
				Activated: () => {
					clientEvents.hachiToggleCostume.fire(!costumed);
				},
			}}
		>
			<uicorner CornerRadius={new UDim(0, 8)} />
			<uipadding
				PaddingTop={new UDim(0.1, 0)}
				PaddingBottom={new UDim(0.1, 0)}
			/>
		</textbutton>
	);
}
