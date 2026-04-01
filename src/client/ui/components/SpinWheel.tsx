import React, { useEffect, useRef, useState } from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { RunService } from "@rbxts/services";
import { clientEvents } from "client/network";
import { SPIN_REWARDS } from "shared/constants";
import { t } from "shared/localization";
import { GameStoreState, gameStore } from "shared/store/game-store";
import { MatchPhase } from "shared/types";

const SEGMENT_COLORS = [
	Color3.fromRGB(255, 90, 90),
	Color3.fromRGB(255, 200, 60),
	Color3.fromRGB(90, 200, 90),
	Color3.fromRGB(80, 160, 255),
	Color3.fromRGB(200, 120, 255),
	Color3.fromRGB(255, 160, 60),
	Color3.fromRGB(100, 220, 200),
	Color3.fromRGB(255, 130, 180),
];

const SPARKLE_OFFSETS = [0, 60, 120, 180, 240, 300];

export function SpinWheel() {
	const matchPhase = useSelector((s: GameStoreState) => s.matchPhase);
	const activeOverlay = useSelector((s: GameStoreState) => s.activeOverlay);
	const spinAvailable = useSelector((s: GameStoreState) => s.spinAvailable);
	const open = activeOverlay === "spin";
	const [spinning, setSpinning] = useState(false);
	const [lastReward, setLastReward] = useState(0);
	const [resultScale, setResultScale] = useState(1);
	const wheelRef = useRef<Frame>();
	const centerTextRef = useRef<TextLabel>();
	const sparkleRefs = useRef<(TextLabel | undefined)[]>([]);
	const rotationRef = useRef(0);
	const scaleDelayRef = useRef<thread>();

	// Listen for spin result
	useEffect(() => {
		const conn = clientEvents.spinResult.connect((reward, success) => {
			setSpinning(false);
			if (success) {
				setLastReward(reward);
				setResultScale(1.8);
				if (scaleDelayRef.current) task.cancel(scaleDelayRef.current);
				scaleDelayRef.current = task.delay(0.4, () => setResultScale(1));
			}
		});
		return () => {
			conn.Disconnect();
			if (scaleDelayRef.current) task.cancel(scaleDelayRef.current);
		};
	}, []);

	// Imperative wheel rotation (no React re-renders)
	useEffect(() => {
		if (!open) return;
		const conn = RunService.Heartbeat.Connect((dt) => {
			const speed = spinning ? 12 : 0.3;
			rotationRef.current = (rotationRef.current + dt * speed * 60) % 360;
			const rot = rotationRef.current;
			if (wheelRef.current) wheelRef.current.Rotation = rot;
			if (centerTextRef.current) centerTextRef.current.Rotation = -rot;
			// Update sparkle positions
			for (let i = 0; i < SPARKLE_OFFSETS.size(); i++) {
				const sparkle = sparkleRefs.current[i];
				if (!sparkle) continue;
				const rad = ((rot * 0.7 + SPARKLE_OFFSETS[i]) * math.pi) / 180;
				const orbitR = 95;
				sparkle.Position = new UDim2(
					0.5,
					math.cos(rad) * orbitR,
					0.5 - 15 / 300,
					math.sin(rad) * orbitR,
				);
			}
		});
		return () => conn.Disconnect();
	}, [open, spinning]);

	// Hide during matches
	if (matchPhase !== MatchPhase.WaitingForPlayers) return undefined!;

	const alreadySpun = !spinAvailable;

	return (
		<>
			{/* Toggle button */}
			<frame
				key="SpinButton"
				Size={new UDim2(0, 100, 0, 30)}
				Position={new UDim2(1, -220, 0, 8)}
				AnchorPoint={new Vector2(1, 0)}
				BackgroundColor3={
					alreadySpun ? Color3.fromRGB(60, 60, 60) : Color3.fromRGB(70, 30, 100)
				}
				BackgroundTransparency={0.3}
				BorderSizePixel={0}
				ZIndex={10}
			>
				<uicorner CornerRadius={new UDim(0, 15)} />
				<textbutton
					Size={new UDim2(1, 0, 1, 0)}
					BackgroundTransparency={1}
					TextColor3={
						alreadySpun
							? Color3.fromRGB(150, 150, 150)
							: Color3.fromRGB(255, 200, 255)
					}
					TextScaled={true}
					Font={Enum.Font.GothamBold}
					Text={
						alreadySpun
							? `\u{2705} ${t("spin_toggle")}`
							: `\u{1F3B0} ${t("spin_toggle")}`
					}
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
					Size={new UDim2(0, 280, 0, 300)}
					Position={new UDim2(0.5, 0, 0.5, 0)}
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundColor3={Color3.fromRGB(20, 15, 35)}
					BackgroundTransparency={0.05}
					BorderSizePixel={0}
					ZIndex={19}
				>
					<uicorner CornerRadius={new UDim(0, 16)} />
					<uistroke
						Color={Color3.fromRGB(255, 200, 100)}
						Thickness={2}
						Transparency={0.3}
					/>
					{/* Close button */}
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
					{/* Title */}
					<textlabel
						Size={new UDim2(0.8, 0, 0, 30)}
						Position={new UDim2(0.1, 0, 0, 12)}
						BackgroundTransparency={1}
						TextColor3={Color3.fromRGB(255, 200, 100)}
						TextScaled={true}
						Font={Enum.Font.FredokaOne}
						Text={t("spin_title")}
						ZIndex={19}
					/>
					{/* Wheel container with rotation */}
					<frame
						ref={wheelRef}
						Size={new UDim2(0, 160, 0, 160)}
						Position={new UDim2(0.5, 0, 0.5, -15)}
						AnchorPoint={new Vector2(0.5, 0.5)}
						BackgroundTransparency={1}
						BorderSizePixel={0}
						Rotation={0}
						ZIndex={19}
					>
						{/* Colored segments (8 wedge-like sections) */}
						{SPIN_REWARDS.map((reward, i) => {
							const angle = (i / SPIN_REWARDS.size()) * 360;
							const segColor = SEGMENT_COLORS[i % SEGMENT_COLORS.size()];
							const dimmed = alreadySpun
								? new Color3(
										segColor.R * 0.4,
										segColor.G * 0.4,
										segColor.B * 0.4,
									)
								: segColor;
							return (
								<frame
									key={`seg-${i}`}
									Size={new UDim2(0, 28, 0, 60)}
									Position={new UDim2(0.5, 0, 0.5, 0)}
									AnchorPoint={new Vector2(0.5, 1)}
									BackgroundColor3={dimmed}
									BackgroundTransparency={0.15}
									BorderSizePixel={0}
									Rotation={angle}
									ZIndex={19}
								>
									<uicorner CornerRadius={new UDim(0, 4)} />
									<textlabel
										Size={new UDim2(1, 0, 0.5, 0)}
										Position={new UDim2(0, 0, 0, 2)}
										BackgroundTransparency={1}
										TextColor3={Color3.fromRGB(255, 255, 255)}
										TextScaled={true}
										Font={Enum.Font.GothamBold}
										Text={`${reward}`}
										ZIndex={20}
										Rotation={0}
									/>
								</frame>
							);
						})}
						{/* Center circle */}
						<frame
							Size={new UDim2(0, 50, 0, 50)}
							Position={new UDim2(0.5, 0, 0.5, 0)}
							AnchorPoint={new Vector2(0.5, 0.5)}
							BackgroundColor3={Color3.fromRGB(255, 200, 50)}
							BorderSizePixel={0}
							ZIndex={21}
						>
							<uicorner CornerRadius={new UDim(1, 0)} />
							<uistroke Color={Color3.fromRGB(255, 160, 20)} Thickness={3} />
							<textlabel
								ref={centerTextRef}
								Size={new UDim2(resultScale, 0, resultScale, 0)}
								Position={new UDim2(0.5, 0, 0.5, 0)}
								AnchorPoint={new Vector2(0.5, 0.5)}
								BackgroundTransparency={1}
								TextColor3={Color3.fromRGB(50, 30, 10)}
								TextScaled={true}
								Font={Enum.Font.FredokaOne}
								Text={lastReward > 0 ? `+${lastReward}` : "\u{2B50}"}
								ZIndex={22}
								Rotation={0}
							/>
						</frame>
					</frame>
					{/* Sparkle stars (positioned imperatively via refs) */}
					{SPARKLE_OFFSETS.map((offsetDeg, i) => (
						<textlabel
							key={`sparkle-${i}`}
							ref={(ref) => {
								sparkleRefs.current[i] = ref;
							}}
							Size={new UDim2(0, 12, 0, 12)}
							Position={new UDim2(0.5, 0, 0.5, 0)}
							AnchorPoint={new Vector2(0.5, 0.5)}
							BackgroundTransparency={1}
							TextColor3={Color3.fromRGB(255, 255, 200)}
							TextTransparency={alreadySpun ? 0.7 : 0.2}
							TextScaled={true}
							Font={Enum.Font.GothamBold}
							Text={"\u{2728}"}
							ZIndex={20}
						/>
					))}
					{/* Spin / Come back tomorrow button */}
					<textbutton
						Size={new UDim2(0.65, 0, 0, 40)}
						Position={new UDim2(0.5, 0, 1, -45)}
						AnchorPoint={new Vector2(0.5, 0)}
						BackgroundColor3={
							spinning || alreadySpun
								? Color3.fromRGB(80, 80, 80)
								: Color3.fromRGB(80, 200, 120)
						}
						TextColor3={Color3.fromRGB(255, 255, 255)}
						TextScaled={true}
						Font={Enum.Font.GothamBold}
						Text={
							alreadySpun
								? t("spin_come_back")
								: spinning
									? t("spin_spinning")
									: t("spin_button")
						}
						Active={!spinning && !alreadySpun}
						ZIndex={20}
						Event={{
							Activated: () => {
								if (spinning || alreadySpun) return;
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
