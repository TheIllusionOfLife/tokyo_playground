import React, { useEffect, useState } from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { clientEvents } from "client/network";
import { GameStoreState, gameStore } from "shared/store/game-store";
import { MatchPhase } from "shared/types";

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

	useEffect(() => {
		const conn = clientEvents.leaderboardData.connect(
			(data: { rank: number; name: string; points: number }[]) => {
				setEntries(data);
			},
		);
		return () => conn.Disconnect();
	}, []);

	// Request leaderboard data when panel opens
	useEffect(() => {
		if (open) {
			clientEvents.requestLeaderboard.fire();
		}
	}, [open]);

	if (matchPhase !== MatchPhase.WaitingForPlayers) return undefined!;

	return (
		<>
			{/* Toggle button */}
			<frame
				key="LeaderboardButton"
				Size={new UDim2(0, 100, 0, 30)}
				Position={new UDim2(1, -10, 0, 206)}
				AnchorPoint={new Vector2(1, 0)}
				BackgroundColor3={Color3.fromRGB(30, 50, 80)}
				BackgroundTransparency={0.3}
				BorderSizePixel={0}
				ZIndex={10}
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
			{/* Leaderboard overlay */}
			{open ? (
				<frame
					key="LeaderboardOverlay"
					Size={new UDim2(0, 280, 0, 320)}
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
					<scrollingframe
						Size={new UDim2(1, -24, 1, -52)}
						Position={new UDim2(0, 12, 0, 46)}
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
								Text="No data yet. Play more games!"
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
			) : (
				undefined!
			)}
		</>
	);
}
