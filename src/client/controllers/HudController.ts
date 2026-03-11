import { Controller, OnStart } from "@flamework/core";
import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";
import ReactRoblox from "@rbxts/react-roblox";
import { Players } from "@rbxts/services";
import { GlobalEvents } from "shared/network";
import { gameStore } from "shared/store/game-store";
import { MatchPhase } from "shared/types";
import { GameHud } from "../ui/GameHud";

@Controller()
export class HudController implements OnStart {
	private readonly events = GlobalEvents.createClient({});
	private root?: ReactRoblox.Root;

	onStart() {
		print("[HudController] Client initialized");
		this.wireNetworkEvents();
		this.mountReactUi();
		this.events.playerReady.fire();
	}

	private wireNetworkEvents() {
		this.events.matchPhaseChanged.connect((phase) => {
			gameStore.setMatchPhase(phase);

			if (phase === MatchPhase.WaitingForPlayers) {
				gameStore.resetForNewMatch();
			}
		});

		this.events.roleAssigned.connect((role) => {
			gameStore.setRole(role);
		});

		this.events.roundTimerUpdate.connect((timeRemaining) => {
			gameStore.setTimeRemaining(timeRemaining);
		});

		this.events.hintTextChanged.connect((hint) => {
			gameStore.setHintText(hint);
		});

		this.events.countdownTick.connect((secondsLeft) => {
			gameStore.setCountdownSeconds(secondsLeft);
		});

		this.events.rewardGranted.connect((breakdown) => {
			gameStore.setRewardBreakdown(breakdown);
		});

		this.events.roundResultAnnounced.connect((result) => {
			gameStore.setRoundResult(result);
		});

		this.events.scoreboard.connect((entries) => {
			gameStore.setScoreboard(entries);
		});

		this.events.matchSnapshot.connect((phase, _timeRemaining, role) => {
			gameStore.setMatchPhase(phase);
			gameStore.setRole(role);
		});

		this.events.scoreUpdated.connect((_coins) => {
			// Legacy event, kept for compatibility
		});

		this.events.gameStateChanged.connect((_state) => {
			// Legacy event, kept for compatibility
		});
	}

	private mountReactUi() {
		const player = Players.LocalPlayer;
		const playerGui = player.WaitForChild("PlayerGui") as PlayerGui;

		// Remove old imperative HUD if it exists
		const existing = playerGui.FindFirstChild("GameHud");
		if (existing) {
			existing.Destroy();
		}

		this.root = ReactRoblox.createRoot(playerGui);
		this.root.render(
			React.createElement(
				ReflexProvider,
				{ producer: gameStore as never },
				React.createElement(GameHud),
			),
		);

		print("[HudController] React UI mounted");
	}
}
