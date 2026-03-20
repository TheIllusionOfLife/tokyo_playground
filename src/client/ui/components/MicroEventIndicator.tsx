import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { GameStoreState } from "shared/store/game-store";

/**
 * Subtle HUD indicator when a micro-event is active.
 * Shows event name and remaining time.
 */
export function MicroEventIndicator() {
	const event = useSelector((state: GameStoreState) => state.currentMicroEvent);

	if (!event) return undefined;

	return (
		<frame
			key="MicroEventIndicator"
			Size={new UDim2(0.2, 0, 0.04, 0)}
			Position={new UDim2(0.4, 0, 0.01, 0)}
			BackgroundColor3={Color3.fromRGB(40, 30, 60)}
			BackgroundTransparency={0.3}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 6)} />
			<uistroke Color={Color3.fromRGB(180, 140, 255)} Thickness={1} />
			<textlabel
				Size={new UDim2(0.9, 0, 0.9, 0)}
				Position={new UDim2(0.05, 0, 0.05, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(220, 200, 255)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={`${event.eventId}`}
			/>
		</frame>
	);
}
