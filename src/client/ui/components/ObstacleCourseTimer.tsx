import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { GameStoreState } from "shared/store/game-store";

/**
 * Personal timer display during the Hachi Obstacle Course micro-event.
 */
export function ObstacleCourseTimer() {
	const event = useSelector((state: GameStoreState) => state.currentMicroEvent);

	if (event?.eventId !== "ObstacleCourse") return undefined;

	return (
		<frame
			key="ObstacleCourseTimer"
			Size={new UDim2(0.15, 0, 0.05, 0)}
			Position={new UDim2(0.425, 0, 0.06, 0)}
			BackgroundColor3={Color3.fromRGB(30, 40, 30)}
			BackgroundTransparency={0.3}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 6)} />
			<uistroke Color={Color3.fromRGB(100, 220, 100)} Thickness={1} />
			<textlabel
				Size={new UDim2(0.9, 0, 0.9, 0)}
				Position={new UDim2(0.05, 0, 0.05, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(150, 255, 150)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text="Obstacle Course Active"
			/>
		</frame>
	);
}
