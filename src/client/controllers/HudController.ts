import { Controller, OnStart } from "@flamework/core";
import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";
import ReactRoblox from "@rbxts/react-roblox";
import { Players } from "@rbxts/services";
import { clientEvents } from "client/network";
import { gameStore } from "shared/store/game-store";
import { MatchPhase } from "shared/types";
import { GameHud } from "../ui/GameHud";

@Controller()
export class HudController implements OnStart {
	private root?: ReactRoblox.Root;

	onStart() {
		print("[HudController] Client initialized");
		this.wireNetworkEvents();
		this.mountReactUi();
		clientEvents.playerReady.fire();
		clientEvents.requestShopCatalog.fire();
	}

	private wireNetworkEvents() {
		clientEvents.matchPhaseChanged.connect((phase) => {
			gameStore.setMatchPhase(phase);

			if (phase === MatchPhase.WaitingForPlayers) {
				gameStore.resetForNewMatch();
			}
		});

		clientEvents.roleAssigned.connect((role, minigameId) => {
			gameStore.setRole(role);
			gameStore.setActiveMinigameId(minigameId);
		});

		clientEvents.roundTimerUpdate.connect((timeRemaining) => {
			gameStore.setTimeRemaining(timeRemaining);
		});

		clientEvents.hintTextChanged.connect((hint) => {
			gameStore.setHintText(hint);
		});

		clientEvents.countdownTick.connect((secondsLeft) => {
			gameStore.setCountdownSeconds(secondsLeft);
		});

		clientEvents.rewardGranted.connect((breakdown) => {
			gameStore.setRewardBreakdown(breakdown);
		});

		clientEvents.roundResultAnnounced.connect((result) => {
			gameStore.setRoundResult(result);
		});

		clientEvents.scoreboard.connect((entries) => {
			gameStore.setScoreboard(entries);
		});

		clientEvents.matchSnapshot.connect(
			(phase, timeRemaining, role, minigameId) => {
				gameStore.setMatchPhase(phase);
				gameStore.setRole(role);
				gameStore.setTimeRemaining(timeRemaining);
				gameStore.setActiveMinigameId(minigameId);
			},
		);

		clientEvents.playPointsUpdate.connect((points, level, shopBalance) => {
			gameStore.setPlayPoints(points, level);
			gameStore.setShopBalance(shopBalance);
		});

		clientEvents.scoreUpdated.connect((_coins) => {
			// Legacy event, kept for compatibility
		});

		clientEvents.gameStateChanged.connect((_state) => {
			// Legacy event, kept for compatibility
		});

		// ── New events ──────────────────────────────────────────────────────

		clientEvents.missionUpdate.connect((missions) => {
			gameStore.setMissions(missions);
		});

		clientEvents.missionCompleted.connect((_id, _pts) => {
			// missionUpdate handles the state refresh; this fires for future toast notifications
		});

		clientEvents.shopCatalog.connect((items) => {
			gameStore.setShopItems(items);
		});

		clientEvents.purchaseResult.connect((ok, _id, newShopBal, _err) => {
			if (ok) {
				clientEvents.requestShopCatalog.fire(); // refresh owned flags
				gameStore.setShopBalance(newShopBal); // shop balance only — NOT setPlayPoints
			}
		});

		clientEvents.levelUp.connect((lv) => {
			gameStore.setLevelUp(lv);
			task.delay(3, () => gameStore.hideLevelUp());
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
