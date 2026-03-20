import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { GameStoreState } from "shared/store/game-store";

/**
 * Minimal rhythm lane UI for the Bon Odori micro-event.
 * Shows current score and combo counter.
 */
export function BonOdoriRhythmLane() {
	const bonOdori = useSelector((state: GameStoreState) => state.bonOdoriState);
	const event = useSelector((state: GameStoreState) => state.currentMicroEvent);

	if (!bonOdori || event?.eventId !== "BonOdori") return undefined;

	return (
		<frame
			key="BonOdoriRhythmLane"
			Size={new UDim2(0.12, 0, 0.3, 0)}
			Position={new UDim2(0.44, 0, 0.35, 0)}
			BackgroundColor3={Color3.fromRGB(30, 20, 40)}
			BackgroundTransparency={0.2}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 8)} />
			<uistroke Color={Color3.fromRGB(255, 180, 80)} Thickness={2} />

			{/* Score */}
			<textlabel
				Size={new UDim2(0.9, 0, 0.15, 0)}
				Position={new UDim2(0.05, 0, 0.05, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 220, 100)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={`Score: ${bonOdori.score}`}
			/>

			{/* Combo */}
			<textlabel
				Size={new UDim2(0.9, 0, 0.12, 0)}
				Position={new UDim2(0.05, 0, 0.22, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(200, 180, 220)}
				TextScaled={true}
				Font={Enum.Font.Gotham}
				Text={bonOdori.combo > 0 ? `Combo x${bonOdori.combo}` : ""}
			/>

			{/* Instruction */}
			<textlabel
				Size={new UDim2(0.9, 0, 0.1, 0)}
				Position={new UDim2(0.05, 0, 0.85, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(160, 160, 180)}
				TextScaled={true}
				Font={Enum.Font.Gotham}
				Text="WASD to the beat!"
			/>
		</frame>
	);
}
