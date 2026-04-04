import React from "@rbxts/react";
import { ActionBar } from "./components/ActionBar";
import { ActionButton } from "./components/ActionButton";
import { BonOdoriRhythmLane } from "./components/BonOdoriRhythmLane";
import { CountdownOverlay } from "./components/CountdownOverlay";
import { EventFeed } from "./components/EventFeed";

import { HachiHud } from "./components/HachiHud";
import { HachiPlayButton } from "./components/HachiPlayButton";
import { HachiToggleButton } from "./components/HachiToggleButton";
import { HintText } from "./components/HintText";
import { LeaderboardPanel } from "./components/LeaderboardPanel";
import { MicroEventIndicator } from "./components/MicroEventIndicator";
import { MissionPanel } from "./components/MissionPanel";
import { ObstacleCourseTimer } from "./components/ObstacleCourseTimer";
import { OmikujiCard } from "./components/OmikujiCard";
import { PlayPointsDisplay } from "./components/PlayPointsDisplay";
import { RewardPopup } from "./components/RewardPopup";
import { RoleIndicator } from "./components/RoleIndicator";
import { RoundIntroOverlay } from "./components/RoundIntroOverlay";
import { Scoreboard } from "./components/Scoreboard";
import { ShopPanel } from "./components/ShopPanel";
import { SkillsPanel } from "./components/SkillsPanel";
import { SpectatorOverlay } from "./components/SpectatorOverlay";
import { SpinWheel } from "./components/SpinWheel";
import { StampCardPanel } from "./components/StampCardPanel";
import { StampDiscoveryPopup } from "./components/StampDiscoveryPopup";

import { TopBar, TopBarTimer } from "./components/TopBar";
import { ZonePopup } from "./components/ZonePopup";

// Error boundary: catches render errors to prevent permanent UI death.
// Without this, a single component crash unmounts the entire React tree.
interface ErrorBoundaryState {
	hasError: boolean;
}

class ErrorBoundary extends React.Component<
	{ children: React.Element },
	ErrorBoundaryState
> {
	state: ErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): ErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(err: unknown) {
		warn(`[GameHud] React error boundary caught: ${tostring(err)}`);
		// Auto-recover after a brief delay so the UI tree re-mounts
		task.delay(0.5, () => this.setState({ hasError: false }));
	}

	render() {
		if (this.state.hasError) return undefined!;
		return this.props.children;
	}
}

export function GameHud() {
	return (
		<ErrorBoundary>
			<>
				{/* Topbar zone elements (own ScreenGui with ScreenInsets.None) */}
				<TopBarTimer />
				<ActionBar />
				<SpinWheel />
				<LeaderboardPanel />
				<screengui
					key="GameHud"
					ResetOnSpawn={false}
					ZIndexBehavior={Enum.ZIndexBehavior.Sibling}
				>
					<PlayPointsDisplay />
					<TopBar />
					<RoundIntroOverlay />
					<RoleIndicator />
					<HachiHud />
					<HachiToggleButton />
					<HachiPlayButton />
					<HintText />
					<EventFeed />
					<CountdownOverlay />
					<RewardPopup />
					<Scoreboard />
					<ActionButton />
					<MissionPanel />
					<ShopPanel />
					<SpectatorOverlay />
					<SkillsPanel />
					{/* Living Shibuya */}
					<StampCardPanel />
					<StampDiscoveryPopup />
					<OmikujiCard />
					<MicroEventIndicator />
					<BonOdoriRhythmLane />
					<ObstacleCourseTimer />
					<ZonePopup />
				</screengui>
			</>
		</ErrorBoundary>
	);
}
