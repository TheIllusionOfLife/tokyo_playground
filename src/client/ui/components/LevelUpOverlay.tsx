import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { t } from "shared/localization";
import { L_LEVEL_UP } from "shared/localization/keys";
import { GameStoreState } from "shared/store/game-store";

export function LevelUpOverlay() {
	const showLevelUp = useSelector((state: GameStoreState) => state.showLevelUp);
	const newLevel = useSelector(
		(state: GameStoreState) => state.levelUpNewLevel,
	);

	if (!showLevelUp) return undefined!;

	return (
		<frame
			key="LevelUpOverlay"
			Size={new UDim2(1, 0, 1, 0)}
			BackgroundColor3={Color3.fromRGB(0, 0, 0)}
			BackgroundTransparency={0.5}
			BorderSizePixel={0}
			ZIndex={100}
		>
			<textlabel
				Size={new UDim2(0.5, 0, 0.3, 0)}
				Position={new UDim2(0.25, 0, 0.35, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 215, 0)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={`${t(L_LEVEL_UP)}\nLv.${newLevel}`}
			/>
		</frame>
	);
}
