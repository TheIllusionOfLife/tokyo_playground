import React, { useEffect, useRef } from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { RunService } from "@rbxts/services";
import { clientEvents } from "client/network";
import { t } from "shared/localization";
import { GameStoreState } from "shared/store/game-store";
import { MatchPhase, MinigameId } from "shared/types";

const PULSE_SPEED = 3;

export function HachiPlayButton() {
	const lastClickRef = useRef(0);
	const btnRef = useRef<TextButton>();
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

	// Pulsing glow animation
	useEffect(() => {
		const conn = RunService.Heartbeat.Connect(() => {
			const btn = btnRef.current;
			if (!btn) return;
			const now = os.clock();
			const alpha = (math.sin(now * PULSE_SPEED) + 1) / 2;
			btn.BackgroundTransparency = 0.05 + 0.1 * alpha;
		});
		return () => conn.Disconnect();
	}, []);

	return (
		<frame
			key="HachiPlayButton"
			Size={new UDim2(0, 64, 0, 64)}
			Position={new UDim2(0, 14, 0, 52)}
			BackgroundTransparency={1}
			BorderSizePixel={0}
			ZIndex={10}
		>
			{/* Dark backdrop for contrast */}
			<frame
				Size={new UDim2(1, 12, 1, 30)}
				Position={new UDim2(0.5, 0, 0.5, 4)}
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundColor3={Color3.fromRGB(0, 0, 0)}
				BackgroundTransparency={0.5}
				BorderSizePixel={0}
				ZIndex={8}
			>
				<uicorner CornerRadius={new UDim(0, 14)} />
			</frame>
			{/* Left ear */}
			<frame
				Size={new UDim2(0, 16, 0, 14)}
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
				Size={new UDim2(0, 16, 0, 14)}
				Position={new UDim2(1, -20, 0, -4)}
				BackgroundColor3={Color3.fromRGB(255, 180, 50)}
				BorderSizePixel={0}
				Rotation={15}
				ZIndex={9}
			>
				<uicorner CornerRadius={new UDim(0, 4)} />
			</frame>
			{/* Main circle body */}
			<textbutton
				ref={btnRef}
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
					Thickness={3}
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
				Size={new UDim2(0, 70, 0, 16)}
				Position={new UDim2(0.5, 0, 1, 8)}
				AnchorPoint={new Vector2(0.5, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 220, 80)}
				TextStrokeColor3={Color3.fromRGB(0, 0, 0)}
				TextStrokeTransparency={0.3}
				TextScaled={true}
				Font={Enum.Font.FredokaOne}
				Text={t("hachi_play")}
				ZIndex={10}
			/>
		</frame>
	);
}
