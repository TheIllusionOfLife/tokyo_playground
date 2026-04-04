import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { GuiService } from "@rbxts/services";
import { ICON_CLOCK } from "shared/constants";
import { t } from "shared/localization";
import {
	L_PHASE_GET_READY,
	L_PHASE_IN_PROGRESS,
	L_PHASE_PREPARING,
	L_PHASE_RESULTS,
	L_PHASE_ROUND_OVER,
	L_PHASE_WAITING,
} from "shared/localization/keys";
import { GameStoreState } from "shared/store/game-store";
import { MatchPhase } from "shared/types";

// Pre-defined timer color palettes (avoids Color3 allocation per render)
const TIMER_CRITICAL = {
	text: Color3.fromRGB(255, 80, 60),
	stroke: Color3.fromRGB(255, 80, 60),
	strokeTransparency: 0.3,
};
const TIMER_WARNING = {
	text: Color3.fromRGB(255, 160, 60),
	stroke: Color3.fromRGB(255, 160, 60),
	strokeTransparency: 0.5,
};
const TIMER_NORMAL = {
	text: Color3.fromRGB(255, 220, 100),
	stroke: Color3.fromRGB(255, 200, 80),
	strokeTransparency: 0.5,
};

function getTimerColors(seconds: number) {
	if (seconds <= 10) return TIMER_CRITICAL;
	if (seconds <= 30) return TIMER_WARNING;
	return TIMER_NORMAL;
}

const PHASE_LABELS: Record<string, () => string> = {
	[MatchPhase.WaitingForPlayers]: () => t(L_PHASE_WAITING),
	[MatchPhase.Countdown]: () => t(L_PHASE_GET_READY),
	[MatchPhase.Preparing]: () => t(L_PHASE_PREPARING),
	[MatchPhase.InProgress]: () => t(L_PHASE_IN_PROGRESS),
	[MatchPhase.RoundOver]: () => t(L_PHASE_ROUND_OVER),
	[MatchPhase.Rewarding]: () => t(L_PHASE_RESULTS),
};

function formatTime(seconds: number): string {
	const clamped = math.max(0, seconds);
	const mins = math.floor(clamped / 60);
	const secs = math.floor(clamped % 60);
	return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

/**
 * Timer displayed inside the Roblox topbar zone (same row as menu buttons).
 * Uses a separate ScreenGui with ScreenInsets.None so it renders above the
 * safe inset area, and GuiService:GetGuiInset() for dynamic positioning.
 */
export function TopBarTimer() {
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);
	const timeRemaining = useSelector(
		(state: GameStoreState) => state.timeRemaining,
	);

	if (matchPhase !== MatchPhase.InProgress) return undefined!;

	const colors = getTimerColors(timeRemaining);

	return (
		<screengui
			key="TopBarTimerGui"
			ResetOnSpawn={false}
			ScreenInsets={Enum.ScreenInsets.None}
			DisplayOrder={5}
			ZIndexBehavior={Enum.ZIndexBehavior.Sibling}
		>
			<frame
				key="TimerFrame"
				Size={new UDim2(0, 110, 0, 30)}
				Position={new UDim2(0.5, 0, 0, 8)}
				AnchorPoint={new Vector2(0.5, 0)}
				BackgroundColor3={Color3.fromRGB(10, 10, 20)}
				BackgroundTransparency={0.25}
				BorderSizePixel={0}
			>
				<uicorner CornerRadius={new UDim(0, 10)} />
				<uistroke
					Color={colors.stroke}
					Thickness={1.5}
					Transparency={colors.strokeTransparency}
				/>
				<uigradient
					Color={
						new ColorSequence(
							Color3.fromRGB(30, 30, 50),
							Color3.fromRGB(10, 10, 20),
						)
					}
					Rotation={90}
				/>
				<uilistlayout
					FillDirection={Enum.FillDirection.Horizontal}
					VerticalAlignment={Enum.VerticalAlignment.Center}
					HorizontalAlignment={Enum.HorizontalAlignment.Center}
					Padding={new UDim(0, 6)}
				/>
				{/* Clock icon */}
				<imagelabel
					key="ClockIcon"
					Size={new UDim2(0, 16, 0, 16)}
					BackgroundTransparency={1}
					Image={ICON_CLOCK}
					ImageColor3={colors.text}
					ScaleType={Enum.ScaleType.Fit}
					LayoutOrder={1}
				/>
				{/* Time text */}
				<textlabel
					key="Timer"
					Size={new UDim2(0, 60, 0, 22)}
					BackgroundTransparency={1}
					TextColor3={colors.text}
					TextScaled={true}
					Font={Enum.Font.GothamBold}
					Text={formatTime(timeRemaining)}
					TextXAlignment={Enum.TextXAlignment.Left}
					LayoutOrder={2}
				>
					<uitextsizeconstraint MaxTextSize={18} />
				</textlabel>
			</frame>
		</screengui>
	);
}

/**
 * Phase text shown below the topbar (for non-InProgress phases).
 */
export function TopBar() {
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);

	// Hide in lobby, Preparing (intro overlay handles that), InProgress, and Rewarding
	if (
		matchPhase === MatchPhase.WaitingForPlayers ||
		matchPhase === MatchPhase.Preparing ||
		matchPhase === MatchPhase.InProgress ||
		matchPhase === MatchPhase.Rewarding
	) {
		return undefined!;
	}

	const phaseText = PHASE_LABELS[matchPhase]?.() ?? matchPhase;

	return (
		<frame
			key="TopBar"
			Size={new UDim2(0.4, 0, 0.06, 0)}
			Position={new UDim2(0.3, 0, 0.02, 0)}
			BackgroundColor3={Color3.fromRGB(0, 0, 0)}
			BackgroundTransparency={0.4}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 8)} />
			<textlabel
				key="PhaseText"
				Size={new UDim2(1, 0, 1, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={phaseText}
			/>
		</frame>
	);
}
