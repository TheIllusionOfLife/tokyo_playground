import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { clientEvents } from "client/network";
import { t } from "shared/localization";
import {
	L_ACTION_CATCH,
	L_ACTION_KICK,
	L_ACTION_RATTLE,
	L_ACTION_SPIRIT_WAVE,
} from "shared/localization/keys";
import { GameStoreState } from "shared/store/game-store";
import { MatchPhase, MinigameId, PlayerRole } from "shared/types";

export function ActionButton() {
	const role = useSelector((state: GameStoreState) => state.role);
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);
	const activeMinigameId = useSelector(
		(state: GameStoreState) => state.activeMinigameId,
	);
	const localCaught = useSelector((state: GameStoreState) => state.localCaught);
	const localTagged = useSelector((state: GameStoreState) => state.localTagged);
	const spiritCharges = useSelector(
		(state: GameStoreState) => state.spiritCharges,
	);

	if (matchPhase !== MatchPhase.InProgress) {
		return undefined!;
	}

	const canShowRoleAction =
		role === PlayerRole.Oni ||
		(role === PlayerRole.Hider &&
			(activeMinigameId !== MinigameId.CanKick || !localCaught) &&
			(activeMinigameId !== MinigameId.ShibuyaScramble || !localTagged));
	const canShowCanRattle =
		activeMinigameId === MinigameId.CanKick &&
		role === PlayerRole.Hider &&
		localCaught;
	const canShowSpiritWave =
		activeMinigameId === MinigameId.ShibuyaScramble &&
		role === PlayerRole.Hider &&
		localTagged &&
		spiritCharges > 0;

	if (!canShowRoleAction && !canShowCanRattle && !canShowSpiritWave) {
		return undefined!;
	}

	const isOni = role === PlayerRole.Oni;
	const buttonColor = canShowSpiritWave
		? Color3.fromRGB(140, 90, 220)
		: canShowCanRattle
			? Color3.fromRGB(220, 170, 60)
			: isOni
				? Color3.fromRGB(220, 50, 50)
				: Color3.fromRGB(50, 130, 220);
	const buttonText = canShowSpiritWave
		? t(L_ACTION_SPIRIT_WAVE)
		: canShowCanRattle
			? t(L_ACTION_RATTLE)
			: isOni
				? t(L_ACTION_CATCH)
				: t(L_ACTION_KICK);

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
					if (canShowSpiritWave) {
						clientEvents.requestSpiritWave.fire();
					} else if (isOni) {
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
