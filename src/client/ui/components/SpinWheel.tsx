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
	const sparkleRefs = useRef<(Frame | undefined)[]>([]);
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
				const orbitR = 55;
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
			{/* Toggle button removed — now handled by ActionBar */}
			{/* Spin overlay (separate ScreenGui with default insets) */}
			{open ? (
				<screengui
					key="SpinOverlayGui"
					ResetOnSpawn={false}
					DisplayOrder={10}
					ZIndexBehavior={Enum.ZIndexBehavior.Sibling}
				>
					<frame
						key="SpinOverlay"
						Size={new UDim2(0, 260, 0.75, 0)}
						Position={new UDim2(0.5, 0, 0.5, 0)}
						AnchorPoint={new Vector2(0.5, 0.5)}
						BackgroundColor3={Color3.fromRGB(16, 12, 30)}
						BackgroundTransparency={0}
						BorderSizePixel={0}
						ZIndex={19}
					>
						<uicorner CornerRadius={new UDim(0, 18)} />
						<uisizeconstraint
							MinSize={new Vector2(220, 220)}
							MaxSize={new Vector2(280, 340)}
						/>
						<uistroke
							Color={Color3.fromRGB(255, 190, 80)}
							Thickness={2.5}
							Transparency={0.15}
						/>
						<uigradient
							Color={
								new ColorSequence(
									Color3.fromRGB(25, 20, 50),
									Color3.fromRGB(12, 8, 24),
								)
							}
							Rotation={90}
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
						{/* Spinning coin container */}
						<frame
							ref={wheelRef}
							Size={new UDim2(0, 90, 0, 90)}
							Position={new UDim2(0.5, 0, 0.48, 0)}
							AnchorPoint={new Vector2(0.5, 0.5)}
							BackgroundTransparency={1}
							BorderSizePixel={0}
							Rotation={0}
							ZIndex={19}
						>
							{/* Outer glow ring */}
							<frame
								Size={new UDim2(0, 82, 0, 82)}
								Position={new UDim2(0.5, 0, 0.5, 0)}
								AnchorPoint={new Vector2(0.5, 0.5)}
								BackgroundColor3={Color3.fromRGB(255, 200, 50)}
								BackgroundTransparency={0.75}
								BorderSizePixel={0}
								ZIndex={19}
							>
								<uicorner CornerRadius={new UDim(1, 0)} />
							</frame>
							{/* Middle ring */}
							<frame
								Size={new UDim2(0, 70, 0, 70)}
								Position={new UDim2(0.5, 0, 0.5, 0)}
								AnchorPoint={new Vector2(0.5, 0.5)}
								BackgroundColor3={Color3.fromRGB(255, 200, 50)}
								BackgroundTransparency={0.5}
								BorderSizePixel={0}
								ZIndex={20}
							>
								<uicorner CornerRadius={new UDim(1, 0)} />
							</frame>
							{/* Center coin */}
							<frame
								Size={new UDim2(0, 56, 0, 56)}
								Position={new UDim2(0.5, 0, 0.5, 0)}
								AnchorPoint={new Vector2(0.5, 0.5)}
								BackgroundColor3={Color3.fromRGB(255, 200, 50)}
								BorderSizePixel={0}
								ZIndex={21}
							>
								<uicorner CornerRadius={new UDim(1, 0)} />
								<uistroke Color={Color3.fromRGB(255, 160, 20)} Thickness={4} />
								<uigradient
									Color={
										new ColorSequence(
											Color3.fromRGB(255, 230, 100),
											Color3.fromRGB(255, 170, 20),
										)
									}
									Rotation={90}
								/>
								<textlabel
									ref={centerTextRef}
									Size={new UDim2(resultScale, 0, resultScale, 0)}
									Position={new UDim2(0.5, 0, 0.5, 0)}
									AnchorPoint={new Vector2(0.5, 0.5)}
									BackgroundTransparency={1}
									TextColor3={Color3.fromRGB(60, 30, 0)}
									TextScaled={true}
									Font={Enum.Font.FredokaOne}
									Text={lastReward > 0 ? `+${lastReward}` : "\u{2B50}"}
									ZIndex={22}
									Rotation={0}
								>
									<uitextsizeconstraint MaxTextSize={30} />
								</textlabel>
							</frame>
						</frame>
						{/* Glow dots orbiting the wheel */}
						{SPARKLE_OFFSETS.map((_, i) => (
							<frame
								key={`glow-${i}`}
								ref={(ref) => {
									sparkleRefs.current[i] = ref;
								}}
								Size={new UDim2(0, 6, 0, 6)}
								Position={new UDim2(0.5, 0, 0.5, 0)}
								AnchorPoint={new Vector2(0.5, 0.5)}
								BackgroundColor3={Color3.fromRGB(255, 220, 120)}
								BackgroundTransparency={alreadySpun ? 0.7 : 0.2}
								BorderSizePixel={0}
								ZIndex={20}
							>
								<uicorner CornerRadius={new UDim(1, 0)} />
							</frame>
						))}
						{/* Spin / Come back tomorrow button */}
						<textbutton
							Size={new UDim2(0.7, 0, 0, 38)}
							Position={new UDim2(0.5, 0, 1, -14)}
							AnchorPoint={new Vector2(0.5, 1)}
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
				</screengui>
			) : (
				undefined!
			)}
		</>
	);
}
