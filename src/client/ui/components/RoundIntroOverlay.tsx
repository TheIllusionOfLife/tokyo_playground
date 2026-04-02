import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { t } from "shared/localization";
import { L_ROLE_HIDER, L_ROLE_ONI } from "shared/localization/keys";
import { GameStoreState } from "shared/store/game-store";
import { PlayerRole } from "shared/types";

export function RoundIntroOverlay() {
	const intro = useSelector((state: GameStoreState) => state.roundIntro);
	const role = useSelector((state: GameStoreState) => state.role);

	if (!intro) {
		return undefined!;
	}

	// Append role to title for role-based games (e.g. "Can Kick: ONI")
	const roleLabel =
		role === PlayerRole.Oni
			? t(L_ROLE_ONI)
			: role === PlayerRole.Hider
				? t(L_ROLE_HIDER)
				: "";
	const title = roleLabel ? `${t(intro.title)}: ${roleLabel}` : t(intro.title);

	return (
		<frame
			key="RoundIntroOverlay"
			Size={new UDim2(0.6, 0, 0.28, 0)}
			Position={new UDim2(0.2, 0, 0.06, 0)}
			BackgroundColor3={Color3.fromRGB(10, 12, 24)}
			BackgroundTransparency={0.1}
			BorderSizePixel={0}
			ZIndex={20}
		>
			<uicorner CornerRadius={new UDim(0, 12)} />
			<textlabel
				Size={new UDim2(1, -24, 0.35, 0)}
				Position={new UDim2(0, 12, 0, 6)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 220, 120)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={title}
				ZIndex={21}
			/>
			<textlabel
				Size={new UDim2(1, -24, 0.52, 0)}
				Position={new UDim2(0, 12, 0.38, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(240, 240, 255)}
				TextScaled={true}
				Font={Enum.Font.Gotham}
				Text={t(intro.subtitle)}
				TextWrapped={true}
				ZIndex={21}
			/>
		</frame>
	);
}
