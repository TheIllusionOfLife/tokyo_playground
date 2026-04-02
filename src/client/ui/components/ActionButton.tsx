import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { clientEvents } from "client/network";
import { t } from "shared/localization";
import { L_ACTION_SPIRIT_WAVE } from "shared/localization/keys";
import { GameStoreState } from "shared/store/game-store";
import { MatchPhase, MinigameId, PlayerRole } from "shared/types";

export function ActionButton() {
	const role = useSelector((state: GameStoreState) => state.role);
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);
	const activeMinigameId = useSelector(
		(state: GameStoreState) => state.activeMinigameId,
	);
	const localTagged = useSelector((state: GameStoreState) => state.localTagged);
	const spiritCharges = useSelector(
		(state: GameStoreState) => state.spiritCharges,
	);

	if (matchPhase !== MatchPhase.InProgress) {
		return undefined!;
	}

	// Hider spirit wave button (Scramble, tagged, has charges)
	const canShowSpiritWave =
		activeMinigameId === MinigameId.ShibuyaScramble &&
		role === PlayerRole.Hider &&
		localTagged &&
		spiritCharges > 0;

	if (!canShowSpiritWave) {
		return undefined!;
	}

	return (
		<textbutton
			key="ActionButton"
			Size={new UDim2(0.15, 0, 0.08, 0)}
			Position={new UDim2(0.82, 0, 0.85, 0)}
			BackgroundColor3={Color3.fromRGB(140, 90, 220)}
			BackgroundTransparency={0.1}
			BorderSizePixel={0}
			TextColor3={Color3.fromRGB(255, 255, 255)}
			TextScaled={true}
			Font={Enum.Font.GothamBold}
			Text={t(L_ACTION_SPIRIT_WAVE)}
			Event={{
				Activated: () => {
					clientEvents.requestSpiritWave.fire();
				},
			}}
		>
			<uicorner CornerRadius={new UDim(0, 10)} />
		</textbutton>
	);
}
