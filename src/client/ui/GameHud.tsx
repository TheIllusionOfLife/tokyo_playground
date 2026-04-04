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

export function GameHud() {
	return (
		<>
			{/* Topbar zone elements (own ScreenGui with ScreenInsets.None) */}
			<TopBarTimer />
			<SpinWheel />
			<LeaderboardPanel />
			<screengui
				key="GameHud"
				ResetOnSpawn={false}
				ZIndexBehavior={Enum.ZIndexBehavior.Sibling}
			>
				<ActionBar />
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
	);
}
