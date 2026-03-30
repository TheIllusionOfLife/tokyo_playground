import React, { useRef } from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { clientEvents } from "client/network";
import { GameStoreState } from "shared/store/game-store";
import { MatchPhase, MinigameId } from "shared/types";

export function HachiPlayButton() {
	const lastClickRef = useRef(0);
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);
	const activeMinigameId = useSelector(
		(state: GameStoreState) => state.activeMinigameId,
	);

	// Only show in lobby (WaitingForPlayers) and not during a match
	if (
		matchPhase !== MatchPhase.WaitingForPlayers ||
		activeMinigameId !== undefined
	) {
		return undefined!;
	}

	return (
		<frame
			key="HachiPlayButton"
			Size={new UDim2(0, 56, 0, 56)}
			Position={new UDim2(0, 14, 0, 52)}
			BackgroundTransparency={1}
			BorderSizePixel={0}
			ZIndex={10}
		>
			{/* Left ear */}
			<frame
				Size={new UDim2(0, 14, 0, 12)}
				Position={new UDim2(0, 4, 0, -4)}
				BackgroundColor3={Color3.fromRGB(255, 180, 50)}
				BorderSizePixel={0}
				Rotation={-15}
				ZIndex={9}
			>
				<uicorner CornerRadius={new UDim(0, 4)} />
			</frame>
			{/* Right ear */}
			<frame
				Size={new UDim2(0, 14, 0, 12)}
				Position={new UDim2(1, -18, 0, -4)}
				BackgroundColor3={Color3.fromRGB(255, 180, 50)}
				BorderSizePixel={0}
				Rotation={15}
				ZIndex={9}
			>
				<uicorner CornerRadius={new UDim(0, 4)} />
			</frame>
			{/* Main circle body */}
			<textbutton
				Size={new UDim2(1, 0, 1, 0)}
				Position={new UDim2(0, 0, 0, 4)}
				BackgroundColor3={Color3.fromRGB(255, 160, 20)}
				BorderSizePixel={0}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				Text={"\u{1F43E}"}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				ZIndex={10}
				Event={{
					Activated: () => {
						const now = os.clock();
						if (now - lastClickRef.current < 3) return;
						lastClickRef.current = now;
						clientEvents.requestMinigameStart.fire(MinigameId.HachiRide);
					},
				}}
			>
				<uicorner CornerRadius={new UDim(1, 0)} />
				<uistroke
					Color={Color3.fromRGB(255, 220, 80)}
					Thickness={2}
					Transparency={0.1}
				/>
				<uipadding
					PaddingLeft={new UDim(0, 6)}
					PaddingRight={new UDim(0, 6)}
					PaddingTop={new UDim(0, 6)}
					PaddingBottom={new UDim(0, 6)}
				/>
			</textbutton>
			{/* Label below */}
			<textlabel
				Size={new UDim2(0, 70, 0, 14)}
				Position={new UDim2(0.5, 0, 1, 6)}
				AnchorPoint={new Vector2(0.5, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 220, 80)}
				TextScaled={true}
				Font={Enum.Font.FredokaOne}
				Text="JOIN"
				ZIndex={10}
			/>
		</frame>
	);
}
