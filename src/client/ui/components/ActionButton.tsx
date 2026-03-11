import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { GlobalEvents } from "shared/network";
import { GameStoreState } from "shared/store/game-store";
import { MatchPhase, PlayerRole } from "shared/types";

const clientEvents = GlobalEvents.createClient({});

export function ActionButton() {
	const role = useSelector((state: GameStoreState) => state.role);
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);

	if (
		matchPhase !== MatchPhase.InProgress ||
		(role !== PlayerRole.Oni && role !== PlayerRole.Hider)
	) {
		return undefined!;
	}

	const isOni = role === PlayerRole.Oni;
	const buttonColor = isOni
		? Color3.fromRGB(220, 50, 50)
		: Color3.fromRGB(50, 130, 220);
	const buttonText = isOni ? "CATCH!" : "KICK!";

	return (
		<textbutton
			key="ActionButton"
			Size={new UDim2(0.15, 0, 0.08, 0)}
			Position={new UDim2(0.82, 0, 0.85, 0)}
			BackgroundColor3={buttonColor}
			BackgroundTransparency={0.1}
			BorderSizePixel={0}
			TextColor3={Color3.fromRGB(255, 255, 255)}
			TextScaled={true}
			Font={Enum.Font.GothamBold}
			Text={buttonText}
			Event={{
				Activated: () => {
					if (isOni) {
						clientEvents.requestCatch.fire();
					} else {
						clientEvents.requestKickCan.fire();
					}
				},
			}}
		>
			<uicorner CornerRadius={new UDim(0, 10)} />
		</textbutton>
	);
}
