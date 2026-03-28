import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { clientEvents } from "client/network";
import { GameStoreState } from "shared/store/game-store";
import { MatchPhase, MinigameId } from "shared/types";

export function HachiToggleButton() {
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);
	const costumed = useSelector((state: GameStoreState) => state.hachiCostumed);
	const activeMinigameId = useSelector(
		(state: GameStoreState) => state.activeMinigameId,
	);

	// Only show in lobby (not during minigames)
	if (matchPhase !== MatchPhase.WaitingForPlayers) return undefined!;
	// Hide during HachiRide minigame (costume is auto-managed)
	if (activeMinigameId === MinigameId.HachiRide) return undefined!;

	const buttonColor = costumed
		? Color3.fromRGB(220, 100, 60)
		: Color3.fromRGB(60, 160, 220);
	const buttonText = costumed ? "Dismount" : "Ride Hachi";

	return (
		<frame
			key="HachiToggleButton"
			Size={new UDim2(0, 100, 0, 30)}
			Position={new UDim2(1, -10, 0, 86)}
			AnchorPoint={new Vector2(1, 0)}
			BackgroundColor3={buttonColor}
			BackgroundTransparency={0.3}
			BorderSizePixel={0}
			ZIndex={10}
		>
			<uicorner CornerRadius={new UDim(0, 15)} />
			<textbutton
				Size={new UDim2(1, 0, 1, 0)}
				BackgroundTransparency={1}
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
				<uipadding PaddingLeft={new UDim(0, 8)} PaddingRight={new UDim(0, 8)} />
			</textbutton>
		</frame>
	);
}
