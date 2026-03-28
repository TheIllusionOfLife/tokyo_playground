import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { t } from "shared/localization";
import { L_ROLE_SPECTATOR, L_SPECTATOR_TAP } from "shared/localization/keys";
import { GameStoreState } from "shared/store/game-store";

export function SpectatorOverlay() {
	const spectating = useSelector((state: GameStoreState) => state.spectating);
	const targetName = useSelector(
		(state: GameStoreState) => state.spectateTargetName,
	);

	if (!spectating) return undefined!;

	return (
		<frame
			key="SpectatorOverlay"
			Size={new UDim2(0.3, 0, 0.06, 0)}
			Position={new UDim2(0.5, 0, 0.92, 0)}
			AnchorPoint={new Vector2(0.5, 1)}
			BackgroundColor3={Color3.fromRGB(0, 0, 0)}
			BackgroundTransparency={0.5}
			BorderSizePixel={0}
			ZIndex={15}
		>
			<uicorner CornerRadius={new UDim(0, 8)} />
			<textlabel
				Size={new UDim2(1, 0, 0.55, 0)}
				Position={new UDim2(0, 0, 0, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(200, 200, 200)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={
					targetName !== ""
						? `${t(L_ROLE_SPECTATOR)}: ${targetName}`
						: t(L_ROLE_SPECTATOR)
				}
				ZIndex={16}
			/>
			<textlabel
				Size={new UDim2(1, 0, 0.4, 0)}
				Position={new UDim2(0, 0, 0.58, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(150, 150, 170)}
				TextScaled={true}
				Font={Enum.Font.Gotham}
				Text={t(L_SPECTATOR_TAP)}
				ZIndex={16}
			/>
		</frame>
	);
}
