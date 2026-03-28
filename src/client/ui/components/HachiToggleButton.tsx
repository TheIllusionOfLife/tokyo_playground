import React, { useEffect, useRef } from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { clientEvents } from "client/network";
import { GameStoreState } from "shared/store/game-store";
import { MatchPhase, MinigameId } from "shared/types";

const PULSE_SPEED = 3;
const SHAKE_SPEED = 4;
const SHAKE_ANGLE = 3;

export function HachiToggleButton() {
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);
	const costumed = useSelector((state: GameStoreState) => state.hachiCostumed);
	const activeMinigameId = useSelector(
		(state: GameStoreState) => state.activeMinigameId,
	);

	const outerRef = useRef<Frame>();
	const frameRef = useRef<Frame>();
	const pendingRef = useRef(false);

	// Reset pending flag when costumed state updates from server
	useEffect(() => {
		pendingRef.current = false;
	}, [costumed]);

	const isVisible =
		matchPhase === MatchPhase.WaitingForPlayers &&
		activeMinigameId !== MinigameId.HachiRide;

	// Pulsing glow + shake animation when not mounted and visible
	useEffect(() => {
		if (costumed || !isVisible) {
			const outer = outerRef.current;
			if (outer) outer.Rotation = 0;
			return;
		}
		const conn = game.GetService("RunService").Heartbeat.Connect(() => {
			const frame = frameRef.current;
			const outer = outerRef.current;
			if (!frame || !outer) return;
			const t = os.clock();
			// Glow pulse
			const alpha = (math.sin(t * PULSE_SPEED) + 1) / 2;
			frame.BackgroundTransparency = 0.05 + 0.15 * alpha;
			// Shake rotation
			outer.Rotation = math.sin(t * SHAKE_SPEED) * SHAKE_ANGLE;
		});
		return () => conn.Disconnect();
	}, [costumed, isVisible]);

	if (!isVisible) return undefined!;

	const mounted = costumed;
	const bgColor = mounted
		? Color3.fromRGB(180, 80, 40)
		: Color3.fromRGB(255, 160, 20);
	const labelText = mounted ? "Dismount" : "Ride Hachi";

	return (
		<frame
			key="HachiToggleButton"
			ref={outerRef}
			Size={new UDim2(0, 160, 0, 60)}
			Position={new UDim2(1, -10, 0, 110)}
			AnchorPoint={new Vector2(1, 0)}
			BackgroundTransparency={1}
			BorderSizePixel={0}
			ZIndex={10}
		>
			{/* Left ear */}
			<frame
				Size={new UDim2(0, 22, 0, 20)}
				Position={new UDim2(0, 12, 0, -6)}
				BackgroundColor3={bgColor}
				BackgroundTransparency={mounted ? 0.3 : 0}
				BorderSizePixel={0}
				Rotation={-20}
				ZIndex={9}
			>
				<uicorner CornerRadius={new UDim(0, 6)} />
			</frame>
			{/* Right ear */}
			<frame
				Size={new UDim2(0, 22, 0, 20)}
				Position={new UDim2(1, -34, 0, -6)}
				BackgroundColor3={bgColor}
				BackgroundTransparency={mounted ? 0.3 : 0}
				BorderSizePixel={0}
				Rotation={20}
				ZIndex={9}
			>
				<uicorner CornerRadius={new UDim(0, 6)} />
			</frame>
			{/* Main body */}
			<frame
				key="Body"
				ref={frameRef}
				Size={new UDim2(1, 0, 0, 48)}
				Position={new UDim2(0, 0, 0, 12)}
				BackgroundColor3={bgColor}
				BackgroundTransparency={mounted ? 0.3 : 0.05}
				BorderSizePixel={0}
				ZIndex={10}
			>
				<uicorner CornerRadius={new UDim(0, 16)} />
				<uistroke
					Color={Color3.fromRGB(255, 220, 80)}
					Thickness={mounted ? 0 : 2.5}
					Transparency={0.2}
				/>
				<textbutton
					Size={new UDim2(1, 0, 1, 0)}
					BackgroundTransparency={1}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					Font={Enum.Font.FredokaOne}
					Text={labelText}
					ZIndex={11}
					Event={{
						Activated: () => {
							if (pendingRef.current) return;
							pendingRef.current = true;
							clientEvents.hachiToggleCostume.fire(!costumed);
						},
					}}
				>
					<uipadding
						PaddingLeft={new UDim(0, 12)}
						PaddingRight={new UDim(0, 12)}
						PaddingTop={new UDim(0, 6)}
						PaddingBottom={new UDim(0, 6)}
					/>
				</textbutton>
			</frame>
		</frame>
	);
}
