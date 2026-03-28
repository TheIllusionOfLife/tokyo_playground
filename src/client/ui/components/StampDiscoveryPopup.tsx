import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { t } from "shared/localization";
import { L_STAMP_DISCOVERED } from "shared/localization/keys";
import { GameStoreState } from "shared/store/game-store";

/**
 * Slides in from the right when a stamp is discovered.
 * Auto-dismissed by StampRallyController after STAMP_CARD_DISPLAY_DURATION.
 */
export function StampDiscoveryPopup() {
	const popup = useSelector(
		(state: GameStoreState) => state.stampDiscoveryPopup,
	);

	if (!popup) return undefined;

	return (
		<frame
			key="StampDiscoveryPopup"
			Size={new UDim2(0.25, 0, 0.08, 0)}
			Position={new UDim2(0.73, 0, 0.12, 0)}
			BackgroundColor3={Color3.fromRGB(30, 30, 50)}
			BackgroundTransparency={0.15}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 6)} />
			<uistroke Color={Color3.fromRGB(255, 220, 100)} Thickness={2} />
			<textlabel
				Size={new UDim2(0.15, 0, 0.8, 0)}
				Position={new UDim2(0.03, 0, 0.1, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 200, 80)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text="&#x2B50;"
			/>
			<textlabel
				Size={new UDim2(0.75, 0, 0.45, 0)}
				Position={new UDim2(0.2, 0, 0.05, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 220, 100)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={t(L_STAMP_DISCOVERED)}
				TextXAlignment={Enum.TextXAlignment.Left}
			/>
			<textlabel
				Size={new UDim2(0.75, 0, 0.4, 0)}
				Position={new UDim2(0.2, 0, 0.52, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(200, 200, 220)}
				TextScaled={true}
				Font={Enum.Font.Gotham}
				Text={popup.displayName}
				TextXAlignment={Enum.TextXAlignment.Left}
			/>
		</frame>
	);
}
