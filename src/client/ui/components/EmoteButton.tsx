import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { clientEvents } from "client/network";
import { t } from "shared/localization";
import { L_EMOTE_TRIGGER } from "shared/localization/keys";
import { GameStoreState } from "shared/store/game-store";
import { ItemCategory, MatchPhase } from "shared/types";

export function EmoteButton() {
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);
	const shopItems = useSelector((state: GameStoreState) => state.shopItems);

	// Only show in lobby
	if (matchPhase !== MatchPhase.WaitingForPlayers) {
		return undefined!;
	}

	// Only show if player has an emote equipped
	const hasEquippedEmote = shopItems.some(
		(item) => item.category === ItemCategory.Emote && item.equipped,
	);
	if (!hasEquippedEmote) {
		return undefined!;
	}

	return (
		<textbutton
			key="EmoteButton"
			Size={new UDim2(0.1, 0, 0.06, 0)}
			Position={new UDim2(0.82, 0, 0.75, 0)}
			BackgroundColor3={Color3.fromRGB(180, 80, 220)}
			BackgroundTransparency={0.1}
			BorderSizePixel={0}
			TextColor3={Color3.fromRGB(255, 255, 255)}
			TextScaled={true}
			Font={Enum.Font.GothamBold}
			Text={t(L_EMOTE_TRIGGER)}
			Event={{
				Activated: () => {
					clientEvents.requestPlayEmote.fire();
				},
			}}
		>
			<uicorner CornerRadius={new UDim(0, 8)} />
		</textbutton>
	);
}
