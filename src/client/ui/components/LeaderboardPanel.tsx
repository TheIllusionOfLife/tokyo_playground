import React, { useEffect, useRef, useState } from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { clientEvents } from "client/network";
import { LEADERBOARD_AUTO_REFRESH } from "shared/constants";
import { t } from "shared/localization";
import {
	L_LEADERBOARD_ALL_TIME,
	L_LEADERBOARD_LOADING,
	L_LEADERBOARD_NEXT,
	L_LEADERBOARD_NO_DATA,
	L_LEADERBOARD_PREV,
	L_LEADERBOARD_TITLE,
	L_LEADERBOARD_UNRANKED,
	L_LEADERBOARD_WEEKLY_HACHI,
	L_LEADERBOARD_YOUR_RANK,
} from "shared/localization/keys";
import { GameStoreState, gameStore } from "shared/store/game-store";
import {
	LeaderboardEntry,
	LeaderboardResponse,
	LeaderboardTab,
	MatchPhase,
} from "shared/types";

// Row colors
const COLOR_TOP3_BG = Color3.fromRGB(50, 40, 20);
const COLOR_NORMAL_BG = Color3.fromRGB(30, 35, 50);
const COLOR_SELF_BG = Color3.fromRGB(30, 50, 70);
const COLOR_GOLD = Color3.fromRGB(255, 215, 0);
const COLOR_SILVER = Color3.fromRGB(192, 192, 192);
const COLOR_BRONZE = Color3.fromRGB(205, 127, 50);
const COLOR_RANK_DEFAULT = Color3.fromRGB(200, 200, 200);
const COLOR_NAME = Color3.fromRGB(230, 230, 230);
const COLOR_POINTS = Color3.fromRGB(255, 220, 100);
const COLOR_MUTED = Color3.fromRGB(120, 120, 140);
const COLOR_PANEL_BG = Color3.fromRGB(15, 25, 45);
const COLOR_TAB_ACTIVE = Color3.fromRGB(60, 60, 100);
const COLOR_TAB_INACTIVE = Color3.fromRGB(30, 30, 50);
const COLOR_TAB_TEXT_ACTIVE = Color3.fromRGB(255, 255, 200);
const COLOR_TAB_TEXT_INACTIVE = Color3.fromRGB(150, 150, 170);
const COLOR_CLOSE_BG = Color3.fromRGB(60, 40, 40);
const COLOR_PAGE_DISABLED = Color3.fromRGB(60, 60, 80);
const COLOR_PAGE_ENABLED = Color3.fromRGB(80, 80, 120);

function rankColor(rank: number): Color3 {
	if (rank === 1) return COLOR_GOLD;
	if (rank === 2) return COLOR_SILVER;
	if (rank === 3) return COLOR_BRONZE;
	return COLOR_RANK_DEFAULT;
}

function EntryRow({
	entry,
	layoutOrder,
	highlight,
}: {
	entry: LeaderboardEntry;
	layoutOrder: number;
	highlight?: boolean;
}) {
	const bg = highlight
		? COLOR_SELF_BG
		: entry.rank <= 3
			? COLOR_TOP3_BG
			: COLOR_NORMAL_BG;
	return (
		<frame
			key={`rank-${layoutOrder}`}
			LayoutOrder={layoutOrder}
			Size={new UDim2(1, -4, 0, 32)}
			BackgroundColor3={bg}
			BackgroundTransparency={0.3}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 4)} />
			<textlabel
				Size={new UDim2(0.12, 0, 1, 0)}
				Position={new UDim2(0, 4, 0, 0)}
				BackgroundTransparency={1}
				TextColor3={rankColor(entry.rank)}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={`#${entry.rank}`}
			/>
			<textlabel
				Size={new UDim2(0.55, 0, 1, 0)}
				Position={new UDim2(0.14, 0, 0, 0)}
				BackgroundTransparency={1}
				TextColor3={COLOR_NAME}
				TextScaled={true}
				Font={Enum.Font.Gotham}
				Text={entry.name}
				TextXAlignment={Enum.TextXAlignment.Left}
			/>
			<textlabel
				Size={new UDim2(0.28, 0, 1, 0)}
				Position={new UDim2(0.72, 0, 0, 0)}
				BackgroundTransparency={1}
				TextColor3={COLOR_POINTS}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={`${entry.points} pts`}
			/>
		</frame>
	);
}

export function LeaderboardPanel() {
	const matchPhase = useSelector((s: GameStoreState) => s.matchPhase);
	const activeOverlay = useSelector((s: GameStoreState) => s.activeOverlay);
	const open = activeOverlay === "leaderboard";

	const [response, setResponse] = useState<LeaderboardResponse | undefined>();
	const [page, setPage] = useState(1);
	const [activeTab, setActiveTab] = useState<LeaderboardTab>("allTime");
	const [loading, setLoading] = useState(false);
	const requestIdRef = useRef(0);

	// Listen for server responses with staleness check
	useEffect(() => {
		const conn = clientEvents.leaderboardData.connect(
			(resp: LeaderboardResponse) => {
				if (resp.tab === activeTab && resp.requestId >= requestIdRef.current) {
					setResponse(resp);
					setLoading(false);
				}
			},
		);
		return () => conn.Disconnect();
	}, [activeTab]);

	// Fire request when panel opens, tab changes, or page changes
	useEffect(() => {
		if (open) {
			requestIdRef.current++;
			setLoading(true);
			clientEvents.requestLeaderboard.fire(
				activeTab,
				page,
				requestIdRef.current,
			);
		}
	}, [open, activeTab, page]);

	// Silent auto-refresh while open
	useEffect(() => {
		if (!open) return;
		let alive = true;
		task.spawn(() => {
			while (alive) {
				task.wait(LEADERBOARD_AUTO_REFRESH);
				if (!alive) break;
				requestIdRef.current++;
				clientEvents.requestLeaderboard.fire(
					activeTab,
					page,
					requestIdRef.current,
				);
			}
		});
		return () => {
			alive = false;
		};
	}, [open, activeTab, page]);

	if (matchPhase !== MatchPhase.WaitingForPlayers) return undefined!;

	const entries = response?.entries ?? [];
	const yourEntry = response?.yourEntry;
	const hasNextPage = response?.hasNextPage ?? false;
	// Show "your rank" only if player is not already in the visible entries
	const selfVisibleOnPage = entries.some((e) => e.isYou);
	const showYourRank = yourEntry !== undefined && !selfVisibleOnPage;
	const showUnranked =
		!loading &&
		!selfVisibleOnPage &&
		yourEntry === undefined &&
		entries.size() > 0;
	// Adjust scroll area to avoid overlapping pinned sections below
	const scrollBottomOffset = showYourRank ? -160 : showUnranked ? -148 : -118;
	const canPrev = page > 1 && !loading;
	const canNext = hasNextPage && !loading;

	return (
		<>
			{open ? (
				<screengui
					key="LeaderboardOverlayGui"
					ResetOnSpawn={false}
					DisplayOrder={10}
					ZIndexBehavior={Enum.ZIndexBehavior.Sibling}
				>
					<frame
						key="LeaderboardOverlay"
						Size={new UDim2(0.55, 0, 1, -10)}
						Position={new UDim2(0.5, 0, 0.5, 0)}
						AnchorPoint={new Vector2(0.5, 0.5)}
						BackgroundColor3={COLOR_PANEL_BG}
						BackgroundTransparency={0.05}
						BorderSizePixel={0}
						ZIndex={19}
					>
						<uicorner CornerRadius={new UDim(0, 12)} />
						{/* Close button */}
						<textbutton
							Size={new UDim2(0, 32, 0, 32)}
							Position={new UDim2(1, -8, 0, 8)}
							AnchorPoint={new Vector2(1, 0)}
							BackgroundColor3={COLOR_CLOSE_BG}
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
							Size={new UDim2(0.8, 0, 0, 28)}
							Position={new UDim2(0.1, 0, 0, 12)}
							BackgroundTransparency={1}
							TextColor3={COLOR_GOLD}
							TextScaled={true}
							Font={Enum.Font.FredokaOne}
							Text={t(L_LEADERBOARD_TITLE)}
							ZIndex={19}
						/>
						{/* Tab bar */}
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
										? COLOR_TAB_ACTIVE
										: COLOR_TAB_INACTIVE
								}
								BackgroundTransparency={activeTab === "allTime" ? 0.1 : 0.4}
								BorderSizePixel={0}
								TextColor3={
									activeTab === "allTime"
										? COLOR_TAB_TEXT_ACTIVE
										: COLOR_TAB_TEXT_INACTIVE
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
									Activated: () => {
										setPage(1);
										setResponse(undefined);
										setActiveTab("allTime");
									},
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
										? COLOR_TAB_ACTIVE
										: COLOR_TAB_INACTIVE
								}
								BackgroundTransparency={activeTab === "weeklyHachi" ? 0.1 : 0.4}
								BorderSizePixel={0}
								TextColor3={
									activeTab === "weeklyHachi"
										? COLOR_TAB_TEXT_ACTIVE
										: COLOR_TAB_TEXT_INACTIVE
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
									Activated: () => {
										setPage(1);
										setResponse(undefined);
										setActiveTab("weeklyHachi");
									},
								}}
							>
								<uicorner CornerRadius={new UDim(0, 6)} />
							</textbutton>
						</frame>
						{/* Entry list */}
						<scrollingframe
							Size={new UDim2(1, -24, 1, scrollBottomOffset)}
							Position={new UDim2(0, 12, 0, 78)}
							BackgroundTransparency={1}
							BorderSizePixel={0}
							ScrollBarThickness={4}
							CanvasSize={new UDim2(0, 0, 0, 0)}
							AutomaticCanvasSize={Enum.AutomaticSize.Y}
							ZIndex={19}
						>
							<uilistlayout
								SortOrder={Enum.SortOrder.LayoutOrder}
								FillDirection={Enum.FillDirection.Vertical}
								Padding={new UDim(0, 3)}
							/>
							{loading ? (
								<textlabel
									key="Loading"
									LayoutOrder={0}
									Size={new UDim2(1, 0, 0, 40)}
									BackgroundTransparency={1}
									TextColor3={COLOR_MUTED}
									TextScaled={true}
									Font={Enum.Font.Gotham}
									Text={t(L_LEADERBOARD_LOADING)}
								/>
							) : entries.size() === 0 ? (
								<textlabel
									key="Empty"
									LayoutOrder={0}
									Size={new UDim2(1, 0, 0, 40)}
									BackgroundTransparency={1}
									TextColor3={COLOR_MUTED}
									TextScaled={true}
									Font={Enum.Font.Gotham}
									Text={t(L_LEADERBOARD_NO_DATA)}
								/>
							) : (
								entries.map((entry) => (
									<EntryRow
										key={`rank-${entry.rank}`}
										entry={entry}
										layoutOrder={entry.rank}
										highlight={entry.isYou}
									/>
								))
							)}
						</scrollingframe>
						{/* Your Rank section (pinned below scroll) */}
						{showYourRank && (
							<frame
								key="YourRankSection"
								Size={new UDim2(1, -24, 0, 48)}
								Position={new UDim2(0, 12, 1, -82)}
								BackgroundTransparency={1}
								ZIndex={19}
							>
								<textlabel
									Size={new UDim2(1, 0, 0, 14)}
									BackgroundTransparency={1}
									TextColor3={COLOR_MUTED}
									TextScaled={true}
									Font={Enum.Font.GothamBold}
									Text={t(L_LEADERBOARD_YOUR_RANK)}
									TextXAlignment={Enum.TextXAlignment.Left}
									ZIndex={19}
								/>
								<frame
									key="YourRankRow"
									Size={new UDim2(1, -4, 0, 32)}
									Position={new UDim2(0, 0, 0, 16)}
									BackgroundColor3={COLOR_SELF_BG}
									BackgroundTransparency={0.2}
									BorderSizePixel={0}
								>
									<uicorner CornerRadius={new UDim(0, 4)} />
									<textlabel
										Size={new UDim2(0.12, 0, 1, 0)}
										Position={new UDim2(0, 4, 0, 0)}
										BackgroundTransparency={1}
										TextColor3={rankColor(yourEntry.rank)}
										TextScaled={true}
										Font={Enum.Font.GothamBold}
										Text={`#${yourEntry.rank}`}
									/>
									<textlabel
										Size={new UDim2(0.55, 0, 1, 0)}
										Position={new UDim2(0.14, 0, 0, 0)}
										BackgroundTransparency={1}
										TextColor3={COLOR_NAME}
										TextScaled={true}
										Font={Enum.Font.Gotham}
										Text={yourEntry.name}
										TextXAlignment={Enum.TextXAlignment.Left}
									/>
									<textlabel
										Size={new UDim2(0.28, 0, 1, 0)}
										Position={new UDim2(0.72, 0, 0, 0)}
										BackgroundTransparency={1}
										TextColor3={COLOR_POINTS}
										TextScaled={true}
										Font={Enum.Font.GothamBold}
										Text={`${yourEntry.points} pts`}
									/>
								</frame>
							</frame>
						)}
						{/* "Unranked" label when player has no rank */}
						{showUnranked && (
							<frame
								key="UnrankedSection"
								Size={new UDim2(1, -24, 0, 30)}
								Position={new UDim2(0, 12, 1, -64)}
								BackgroundTransparency={1}
								ZIndex={19}
							>
								<textlabel
									Size={new UDim2(1, 0, 1, 0)}
									BackgroundTransparency={1}
									TextColor3={COLOR_MUTED}
									TextScaled={true}
									Font={Enum.Font.Gotham}
									Text={t(L_LEADERBOARD_UNRANKED)}
									ZIndex={19}
								/>
							</frame>
						)}
						{/* Pagination controls */}
						<frame
							key="Pagination"
							Size={new UDim2(1, -24, 0, 28)}
							Position={new UDim2(0, 12, 1, -34)}
							BackgroundTransparency={1}
							ZIndex={19}
						>
							<uilistlayout
								SortOrder={Enum.SortOrder.LayoutOrder}
								FillDirection={Enum.FillDirection.Horizontal}
								Padding={new UDim(0, 4)}
								HorizontalAlignment={Enum.HorizontalAlignment.Center}
								VerticalAlignment={Enum.VerticalAlignment.Center}
							/>
							<textbutton
								key="PrevBtn"
								LayoutOrder={1}
								Size={new UDim2(0, 60, 1, 0)}
								BackgroundColor3={
									canPrev ? COLOR_PAGE_ENABLED : COLOR_PAGE_DISABLED
								}
								BackgroundTransparency={canPrev ? 0.2 : 0.5}
								BorderSizePixel={0}
								TextColor3={
									canPrev ? Color3.fromRGB(255, 255, 255) : COLOR_MUTED
								}
								TextScaled={true}
								Font={Enum.Font.GothamBold}
								Text={t(L_LEADERBOARD_PREV)}
								ZIndex={19}
								Active={canPrev}
								Event={{
									Activated: () => {
										if (canPrev) setPage(page - 1);
									},
								}}
							>
								<uicorner CornerRadius={new UDim(0, 4)} />
							</textbutton>
							<textlabel
								key="PageNum"
								LayoutOrder={2}
								Size={new UDim2(0, 60, 1, 0)}
								BackgroundTransparency={1}
								TextColor3={Color3.fromRGB(200, 200, 220)}
								TextScaled={true}
								Font={Enum.Font.Gotham}
								Text={`Page ${page}`}
								ZIndex={19}
							/>
							<textbutton
								key="NextBtn"
								LayoutOrder={3}
								Size={new UDim2(0, 60, 1, 0)}
								BackgroundColor3={
									canNext ? COLOR_PAGE_ENABLED : COLOR_PAGE_DISABLED
								}
								BackgroundTransparency={canNext ? 0.2 : 0.5}
								BorderSizePixel={0}
								TextColor3={
									canNext ? Color3.fromRGB(255, 255, 255) : COLOR_MUTED
								}
								TextScaled={true}
								Font={Enum.Font.GothamBold}
								Text={t(L_LEADERBOARD_NEXT)}
								ZIndex={19}
								Active={canNext}
								Event={{
									Activated: () => {
										if (canNext) setPage(page + 1);
									},
								}}
							>
								<uicorner CornerRadius={new UDim(0, 4)} />
							</textbutton>
						</frame>
					</frame>
				</screengui>
			) : (
				undefined!
			)}
		</>
	);
}
