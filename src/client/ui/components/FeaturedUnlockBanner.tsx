import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { GameStoreState } from "shared/store/game-store";
import { MatchPhase } from "shared/types";

export function FeaturedUnlockBanner() {
	const featuredUnlock = useSelector(
		(state: GameStoreState) => state.featuredUnlock,
	);
	const activeOverlay = useSelector(
		(state: GameStoreState) => state.activeOverlay,
	);
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);

	// Hide during gameplay or when an overlay is open
	if (
		!featuredUnlock ||
		activeOverlay !== "none" ||
		matchPhase === MatchPhase.InProgress
	) {
		return undefined!;
	}

	const ratio =
		featuredUnlock.progressTarget <= 0
			? 0
			: math.clamp(
					featuredUnlock.progressCurrent / featuredUnlock.progressTarget,
					0,
					1,
				);

	return (
		<frame
			key="FeaturedUnlockBanner"
			Size={new UDim2(0, 270, 0, 62)}
			Position={new UDim2(0, 14, 0, 118)}
			BackgroundColor3={Color3.fromRGB(58, 34, 24)}
			BackgroundTransparency={0.12}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 10)} />
			<textlabel
				Size={new UDim2(1, -18, 0, 20)}
				Position={new UDim2(0, 9, 0, 6)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 214, 118)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={`Next Unlock: ${featuredUnlock.name}`}
				TextXAlignment={Enum.TextXAlignment.Left}
			/>
			<textlabel
				Size={new UDim2(1, -18, 0, 18)}
				Position={new UDim2(0, 9, 0, 26)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(244, 240, 230)}
				TextScaled={true}
				Font={Enum.Font.Gotham}
				Text={featuredUnlock.description}
				TextXAlignment={Enum.TextXAlignment.Left}
			/>
			<frame
				Size={new UDim2(1, -18, 0, 8)}
				Position={new UDim2(0, 9, 1, -14)}
				BackgroundColor3={Color3.fromRGB(80, 60, 48)}
				BorderSizePixel={0}
			>
				<uicorner CornerRadius={new UDim(0, 4)} />
				<frame
					Size={new UDim2(ratio, 0, 1, 0)}
					BackgroundColor3={Color3.fromRGB(255, 190, 84)}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(0, 4)} />
				</frame>
			</frame>
		</frame>
	);
}
