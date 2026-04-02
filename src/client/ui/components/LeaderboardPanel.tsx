import React, { useEffect, useState } from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { clientEvents } from "client/network";
import { t } from "shared/localization";
import {
	L_LEADERBOARD_ALL_TIME,
	L_LEADERBOARD_WEEKLY_HACHI,
} from "shared/localization/keys";
import { GameStoreState, gameStore } from "shared/store/game-store";
import { LeaderboardTab, MatchPhase } from "shared/types";

interface LeaderboardEntry {
	rank: number;
	name: string;
	points: number;
}

export function LeaderboardPanel() {
	const matchPhase = useSelector((s: GameStoreState) => s.matchPhase);
	const activeOverlay = useSelector((s: GameStoreState) => s.activeOverlay);
	const open = activeOverlay === "leaderboard";
	const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
	const [activeTab, setActiveTab] = useState<LeaderboardTab>("allTime");

	useEffect(() => {
		const conn = clientEvents.leaderboardData.connect(
			(
				tab: LeaderboardTab,
				data: { rank: number; name: string; points: number }[],
			) => {
				if (tab === activeTab) {
					setEntries(data);
				}
			},
		);
		return () => conn.Disconnect();
	}, [activeTab]);

	// Request leaderboard data when panel opens or tab changes
	useEffect(() => {
		if (open) {
			setEntries([]);
			clientEvents.requestLeaderboard.fire(activeTab);
		}
	}, [open, activeTab]);

	if (matchPhase !== MatchPhase.WaitingForPlayers) return undefined!;

	return (
		<>
			{/* Toggle button in topbar zone */}
			<screengui
				key="LeaderboardButtonGui"
				ResetOnSpawn={false}
				ScreenInsets={Enum.ScreenInsets.None}
				DisplayOrder={4}
				ZIndexBehavior={Enum.ZIndexBehavior.Sibling}
			>
				<frame
					key="LeaderboardButton"
					Size={new UDim2(0, 100, 0, 30)}
					Position={new UDim2(1, -10, 0, 20)}
					AnchorPoint={new Vector2(1, 0)}
					BackgroundColor3={Color3.fromRGB(30, 50, 80)}
					BackgroundTransparency={0.3}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(0, 15)} />
					<textbutton
						Size={new UDim2(1, 0, 1, 0)}
						BackgroundTransparency={1}
						TextColor3={Color3.fromRGB(150, 200, 255)}
						TextScaled={true}
						Font={Enum.Font.GothamBold}
						Text={"\u{1F3C6} Ranks"}
						Event={{
							Activated: () =>
								gameStore.setActiveOverlay(
									open ? "none" : ("leaderboard" as never),
								),
						}}
					>
						<uipadding
							PaddingLeft={new UDim(0, 8)}
							PaddingRight={new UDim(0, 8)}
						/>
					</textbutton>
				</frame>
			</screengui>
			{/* Leaderboard overlay (separate ScreenGui with default insets) */}
			{open ? (
				<screengui
					key="LeaderboardOverlayGui"
					ResetOnSpawn={false}
					DisplayOrder={10}
					ZIndexBehavior={Enum.ZIndexBehavior.Sibling}
				>
					<frame
						key="LeaderboardOverlay"
						Size={new UDim2(0, 280, 0, 350)}
						Position={new UDim2(0.5, 0, 0.5, 0)}
						AnchorPoint={new Vector2(0.5, 0.5)}
						BackgroundColor3={Color3.fromRGB(15, 25, 45)}
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
							Size={new UDim2(0.8, 0, 0, 28)}
							Position={new UDim2(0.1, 0, 0, 12)}
							BackgroundTransparency={1}
							TextColor3={Color3.fromRGB(255, 215, 0)}
							TextScaled={true}
							Font={Enum.Font.FredokaOne}
							Text="Leaderboard"
							ZIndex={19}
						/>
						<frame
							key="TabBar"
							Size={new UDim2(1, -24, 0, 28)}
							Position={new UDim2(0, 12, 0, 44)}
							BackgroundTransparency={1}
							ZIndex={19}
						>
							<uilistlayout
								FillDirection={Enum.FillDirection.Horizontal}
								Padding={new UDim(0, 4)}
								HorizontalAlignment={Enum.HorizontalAlignment.Center}
							/>
							<textbutton
								key="tab_allTime"
								LayoutOrder={1}
								Size={new UDim2(0.48, 0, 1, 0)}
								BackgroundColor3={
									activeTab === "allTime"
										? Color3.fromRGB(60, 60, 100)
										: Color3.fromRGB(30, 30, 50)
								}
								BackgroundTransparency={activeTab === "allTime" ? 0.1 : 0.4}
								BorderSizePixel={0}
								TextColor3={
									activeTab === "allTime"
										? Color3.fromRGB(255, 255, 200)
										: Color3.fromRGB(150, 150, 170)
								}
								TextScaled={true}
								Font={
									activeTab === "allTime"
										? Enum.Font.GothamBold
										: Enum.Font.Gotham
								}
								Text={t(L_LEADERBOARD_ALL_TIME)}
								ZIndex={19}
								Event={{
									Activated: () => setActiveTab("allTime"),
								}}
							>
								<uicorner CornerRadius={new UDim(0, 6)} />
							</textbutton>
							<textbutton
								key="tab_weeklyHachi"
								LayoutOrder={2}
								Size={new UDim2(0.48, 0, 1, 0)}
								BackgroundColor3={
									activeTab === "weeklyHachi"
										? Color3.fromRGB(60, 60, 100)
										: Color3.fromRGB(30, 30, 50)
								}
								BackgroundTransparency={activeTab === "weeklyHachi" ? 0.1 : 0.4}
								BorderSizePixel={0}
								TextColor3={
									activeTab === "weeklyHachi"
										? Color3.fromRGB(255, 255, 200)
										: Color3.fromRGB(150, 150, 170)
								}
								TextScaled={true}
								Font={
									activeTab === "weeklyHachi"
										? Enum.Font.GothamBold
										: Enum.Font.Gotham
								}
								Text={t(L_LEADERBOARD_WEEKLY_HACHI)}
								ZIndex={19}
								Event={{
									Activated: () => setActiveTab("weeklyHachi"),
								}}
							>
								<uicorner CornerRadius={new UDim(0, 6)} />
							</textbutton>
						</frame>
						<scrollingframe
							Size={new UDim2(1, -24, 1, -84)}
							Position={new UDim2(0, 12, 0, 78)}
							BackgroundTransparency={1}
							BorderSizePixel={0}
							ScrollBarThickness={4}
							CanvasSize={new UDim2(0, 0, 0, 0)}
							AutomaticCanvasSize={Enum.AutomaticSize.Y}
							ZIndex={19}
						>
							<uilistlayout
								FillDirection={Enum.FillDirection.Vertical}
								Padding={new UDim(0, 3)}
							/>
							{entries.size() === 0 ? (
								<textlabel
									key="Empty"
									Size={new UDim2(1, 0, 0, 40)}
									BackgroundTransparency={1}
									TextColor3={Color3.fromRGB(120, 120, 140)}
									TextScaled={true}
									Font={Enum.Font.Gotham}
									Text="No data yet."
								/>
							) : (
								entries.map((entry) => (
									<frame
										key={`rank-${entry.rank}`}
										Size={new UDim2(1, -4, 0, 32)}
										BackgroundColor3={
											entry.rank <= 3
												? Color3.fromRGB(50, 40, 20)
												: Color3.fromRGB(30, 35, 50)
										}
										BackgroundTransparency={0.3}
										BorderSizePixel={0}
									>
										<uicorner CornerRadius={new UDim(0, 4)} />
										<textlabel
											Size={new UDim2(0.12, 0, 1, 0)}
											Position={new UDim2(0, 4, 0, 0)}
											BackgroundTransparency={1}
											TextColor3={
												entry.rank === 1
													? Color3.fromRGB(255, 215, 0)
													: entry.rank === 2
														? Color3.fromRGB(192, 192, 192)
														: entry.rank === 3
															? Color3.fromRGB(205, 127, 50)
															: Color3.fromRGB(200, 200, 200)
											}
											TextScaled={true}
											Font={Enum.Font.GothamBold}
											Text={`#${entry.rank}`}
										/>
										<textlabel
											Size={new UDim2(0.55, 0, 1, 0)}
											Position={new UDim2(0.14, 0, 0, 0)}
											BackgroundTransparency={1}
											TextColor3={Color3.fromRGB(230, 230, 230)}
											TextScaled={true}
											Font={Enum.Font.Gotham}
											Text={entry.name}
											TextXAlignment={Enum.TextXAlignment.Left}
										/>
										<textlabel
											Size={new UDim2(0.28, 0, 1, 0)}
											Position={new UDim2(0.72, 0, 0, 0)}
											BackgroundTransparency={1}
											TextColor3={Color3.fromRGB(255, 220, 100)}
											TextScaled={true}
											Font={Enum.Font.GothamBold}
											Text={`${entry.points} pts`}
										/>
									</frame>
								))
							)}
						</scrollingframe>
					</frame>
				</screengui>
			) : (
				undefined!
			)}
		</>
	);
}
