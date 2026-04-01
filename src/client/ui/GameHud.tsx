import React from "@rbxts/react";
import { ActionButton } from "./components/ActionButton";
import { BonOdoriRhythmLane } from "./components/BonOdoriRhythmLane";
import { CountdownOverlay } from "./components/CountdownOverlay";
import { EventFeed } from "./components/EventFeed";

import { HachiHud } from "./components/HachiHud";
import { HachiPlayButton } from "./components/HachiPlayButton";
import { HachiToggleButton } from "./components/HachiToggleButton";
import { HintText } from "./components/HintText";
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

import { TopBar } from "./components/TopBar";
import { ZonePopup } from "./components/ZonePopup";

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
			<HachiPlayButton />
			<HintText />
			<EventFeed />
			<CountdownOverlay />
			<RewardPopup />
			<Scoreboard />
			<ActionButton />
			<LevelUpOverlay />
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
	);
}
