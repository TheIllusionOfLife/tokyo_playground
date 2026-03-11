import React from "@rbxts/react";
import { ActionButton } from "./components/ActionButton";
import { CountdownOverlay } from "./components/CountdownOverlay";
import { HintText } from "./components/HintText";
import { PlayPointsDisplay } from "./components/PlayPointsDisplay";
import { RewardPopup } from "./components/RewardPopup";
import { RoleIndicator } from "./components/RoleIndicator";
import { Scoreboard } from "./components/Scoreboard";
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
			<HintText />
			<CountdownOverlay />
			<RewardPopup />
			<Scoreboard />
			<ActionButton />
		</screengui>
	);
}
