import React from "@rbxts/react";
import { ActionButton } from "./components/ActionButton";
import { BonOdoriRhythmLane } from "./components/BonOdoriRhythmLane";
import { CountdownOverlay } from "./components/CountdownOverlay";
import { EventFeed } from "./components/EventFeed";
import { FeaturedUnlockBanner } from "./components/FeaturedUnlockBanner";
import { HachiHud } from "./components/HachiHud";
import { HachiToggleButton } from "./components/HachiToggleButton";
import { HintText } from "./components/HintText";
import { InviteButton } from "./components/InviteButton";
import { LevelUpOverlay } from "./components/LevelUpOverlay";
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
import { StampCardPanel } from "./components/StampCardPanel";
import { StampDiscoveryPopup } from "./components/StampDiscoveryPopup";
import { TodayGoalChip } from "./components/TodayGoalChip";
import { TopBar } from "./components/TopBar";

export function GameHud() {
	return (
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
			<HintText />
			<TodayGoalChip />
			<FeaturedUnlockBanner />
			<EventFeed />
			<CountdownOverlay />
			<RewardPopup />
			<Scoreboard />
			<ActionButton />
			<LevelUpOverlay />
			<MissionPanel />
			<ShopPanel />
			<InviteButton />
			<SpectatorOverlay />
			<SkillsPanel />
			{/* Living Shibuya */}
			<StampCardPanel />
			<StampDiscoveryPopup />
			<OmikujiCard />
			<MicroEventIndicator />
			<BonOdoriRhythmLane />
			<ObstacleCourseTimer />
		</screengui>
	);
}
