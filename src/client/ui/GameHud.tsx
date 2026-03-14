import React from "@rbxts/react";
import { ActionButton } from "./components/ActionButton";
import { CountdownOverlay } from "./components/CountdownOverlay";
import { HachiHud } from "./components/HachiHud";
import { HintText } from "./components/HintText";
import { LevelUpOverlay } from "./components/LevelUpOverlay";
import { MissionPanel } from "./components/MissionPanel";
import { PlayPointsDisplay } from "./components/PlayPointsDisplay";
import { RewardPopup } from "./components/RewardPopup";
import { RoleIndicator } from "./components/RoleIndicator";
import { Scoreboard } from "./components/Scoreboard";
import { ShopPanel } from "./components/ShopPanel";
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
			<RoleIndicator />
			<HachiHud />
			<HintText />
			<CountdownOverlay />
			<RewardPopup />
			<Scoreboard />
			<ActionButton />
			<LevelUpOverlay />
			<MissionPanel />
			<ShopPanel />
		</screengui>
	);
}
