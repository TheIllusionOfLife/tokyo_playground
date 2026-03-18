import React from "@rbxts/react";
import { ActionButton } from "./components/ActionButton";
import { CountdownOverlay } from "./components/CountdownOverlay";
import { EventFeed } from "./components/EventFeed";
import { FeaturedUnlockBanner } from "./components/FeaturedUnlockBanner";
import { HachiHud } from "./components/HachiHud";
import { HintText } from "./components/HintText";
import { LevelUpOverlay } from "./components/LevelUpOverlay";
import { MissionPanel } from "./components/MissionPanel";
import { PlayPointsDisplay } from "./components/PlayPointsDisplay";
import { QueueStatusCard } from "./components/QueueStatusCard";
import { RewardPopup } from "./components/RewardPopup";
import { RoleIndicator } from "./components/RoleIndicator";
import { RoundIntroOverlay } from "./components/RoundIntroOverlay";
import { Scoreboard } from "./components/Scoreboard";
import { ShopPanel } from "./components/ShopPanel";
import { SkillsPanel } from "./components/SkillsPanel";
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
			<QueueStatusCard />
			<RoundIntroOverlay />
			<RoleIndicator />
			<HachiHud />
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
			<SkillsPanel />
		</screengui>
	);
}
