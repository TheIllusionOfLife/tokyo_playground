import React, { useEffect, useRef, useState } from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { TweenService } from "@rbxts/services";
import { clientEvents } from "client/network";
import { SPIN_REWARDS } from "shared/constants";
import { GameStoreState, gameStore } from "shared/store/game-store";
import { MatchPhase } from "shared/types";

export function SpinWheel() {
	const matchPhase = useSelector((s: GameStoreState) => s.matchPhase);
	const activeOverlay = useSelector((s: GameStoreState) => s.activeOverlay);
	const open = activeOverlay === "spin";
	const [spinning, setSpinning] = useState(false);
	const [lastReward, setLastReward] = useState(0);
	const wheelRef = useRef<Frame>();

	// Listen for spin result (must be before early return to satisfy Rules of Hooks)
	useEffect(() => {
		const conn = clientEvents.spinResult.connect((reward, success) => {
			setSpinning(false);
			if (success) {
				setLastReward(reward);
			}
		});
		return () => conn.Disconnect();
	}, []);

	// Hide during matches
	if (matchPhase !== MatchPhase.WaitingForPlayers) return undefined!;

	return (
		<>
			{/* Toggle button */}
			<frame
				key="SpinButton"
				Size={new UDim2(0, 100, 0, 30)}
				Position={new UDim2(1, -10, 0, 168)}
				AnchorPoint={new Vector2(1, 0)}
				BackgroundColor3={Color3.fromRGB(70, 30, 100)}
				BackgroundTransparency={0.3}
				BorderSizePixel={0}
				ZIndex={10}
			>
				<uicorner CornerRadius={new UDim(0, 15)} />
				<textbutton
					Size={new UDim2(1, 0, 1, 0)}
					BackgroundTransparency={1}
					TextColor3={Color3.fromRGB(255, 200, 255)}
					TextScaled={true}
					Font={Enum.Font.GothamBold}
					Text={"\u{1F3B0} Spin"}
					Event={{
						Activated: () =>
							gameStore.setActiveOverlay(open ? "none" : ("spin" as never)),
					}}
				>
					<uipadding
						PaddingLeft={new UDim(0, 8)}
						PaddingRight={new UDim(0, 8)}
					/>
				</textbutton>
			</frame>
			{/* Spin overlay */}
			{open ? (
				<frame
					key="SpinOverlay"
					Size={new UDim2(0, 250, 0, 250)}
					Position={new UDim2(0.5, 0, 0.5, 0)}
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundColor3={Color3.fromRGB(20, 15, 35)}
					BackgroundTransparency={0.05}
					BorderSizePixel={0}
					ZIndex={19}
				>
					<uicorner CornerRadius={new UDim(0, 12)} />
					<textbutton
						Size={new UDim2(0, 32, 0, 32)}
						Position={new UDim2(1, -8, 0, 8)}
						AnchorPoint={new Vector2(1, 0)}
						BackgroundColor3={Color3.fromRGB(60, 40, 40)}
						BackgroundTransparency={0.3}
						TextColor3={Color3.fromRGB(255, 255, 255)}
						TextScaled={true}
						Font={Enum.Font.GothamBold}
						Text="X"
						ZIndex={20}
						Event={{
							Activated: () => gameStore.setActiveOverlay("none"),
						}}
					>
						<uicorner CornerRadius={new UDim(1, 0)} />
					</textbutton>
					<textlabel
						Size={new UDim2(0.8, 0, 0, 30)}
						Position={new UDim2(0.1, 0, 0, 12)}
						BackgroundTransparency={1}
						TextColor3={Color3.fromRGB(255, 200, 100)}
						TextScaled={true}
						Font={Enum.Font.FredokaOne}
						Text="Daily Lucky Spin"
						ZIndex={19}
					/>
					{/* Wheel display */}
					<frame
						ref={wheelRef}
						Size={new UDim2(0, 140, 0, 140)}
						Position={new UDim2(0.5, 0, 0.5, -10)}
						AnchorPoint={new Vector2(0.5, 0.5)}
						BackgroundColor3={Color3.fromRGB(255, 200, 50)}
						BorderSizePixel={0}
						ZIndex={19}
					>
						<uicorner CornerRadius={new UDim(1, 0)} />
						<uistroke Color={Color3.fromRGB(255, 160, 20)} Thickness={4} />
						<textlabel
							Size={new UDim2(1, 0, 1, 0)}
							BackgroundTransparency={1}
							TextColor3={Color3.fromRGB(50, 30, 10)}
							TextScaled={true}
							Font={Enum.Font.FredokaOne}
							Text={lastReward > 0 ? `+${lastReward}` : "\u{1F3B0}"}
							ZIndex={20}
						/>
					</frame>
					{/* Spin button */}
					<textbutton
						Size={new UDim2(0.6, 0, 0, 40)}
						Position={new UDim2(0.2, 0, 1, -50)}
						BackgroundColor3={
							spinning
								? Color3.fromRGB(80, 80, 80)
								: Color3.fromRGB(80, 200, 120)
						}
						TextColor3={Color3.fromRGB(255, 255, 255)}
						TextScaled={true}
						Font={Enum.Font.GothamBold}
						Text={spinning ? "Spinning..." : "SPIN!"}
						Active={!spinning}
						ZIndex={20}
						Event={{
							Activated: () => {
								if (spinning) return;
								setSpinning(true);
								setLastReward(0);
								clientEvents.requestSpin.fire();
							},
						}}
					>
						<uicorner CornerRadius={new UDim(0, 8)} />
					</textbutton>
				</frame>
			) : (
				undefined!
			)}
		</>
	);
}
