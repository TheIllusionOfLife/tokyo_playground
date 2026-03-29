import React, { useEffect, useRef } from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { TweenService } from "@rbxts/services";
import { t } from "shared/localization";
import { GameStoreState } from "shared/store/game-store";

export function ZonePopup() {
	const currentZone = useSelector((state: GameStoreState) => state.currentZone);
	const frameRef = useRef<Frame>();

	useEffect(() => {
		const frame = frameRef.current;
		if (!frame) return;

		if (currentZone !== "") {
			// Animate in: slide down + fade in
			frame.Position = new UDim2(0.5, 0, 0, -40);
			frame.BackgroundTransparency = 1;
			TweenService.Create(
				frame,
				new TweenInfo(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
				{
					Position: new UDim2(0.5, 0, 0, 20),
					BackgroundTransparency: 0.15,
				},
			).Play();
		} else {
			// Animate out: fade out
			TweenService.Create(
				frame,
				new TweenInfo(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
				{
					BackgroundTransparency: 1,
					Position: new UDim2(0.5, 0, 0, -40),
				},
			).Play();
		}
	}, [currentZone]);

	const zoneKey = `zone_${currentZone}`;
	const displayName = currentZone !== "" ? t(zoneKey) : "";

	return (
		<frame
			key="ZonePopup"
			ref={frameRef}
			Size={new UDim2(0, 300, 0, 50)}
			Position={new UDim2(0.5, 0, 0, -40)}
			AnchorPoint={new Vector2(0.5, 0)}
			BackgroundColor3={Color3.fromRGB(15, 15, 30)}
			BackgroundTransparency={1}
			BorderSizePixel={0}
			ZIndex={18}
		>
			<uicorner CornerRadius={new UDim(0, 12)} />
			<uistroke
				Color={Color3.fromRGB(255, 255, 255)}
				Thickness={1}
				Transparency={0.6}
			/>
			<textlabel
				Size={new UDim2(1, -24, 1, 0)}
				Position={new UDim2(0, 12, 0, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextScaled={true}
				Font={Enum.Font.FredokaOne}
				Text={displayName}
				TextTransparency={currentZone !== "" ? 0 : 1}
				ZIndex={18}
			>
				<uipadding PaddingTop={new UDim(0, 6)} PaddingBottom={new UDim(0, 6)} />
			</textlabel>
		</frame>
	);
}
