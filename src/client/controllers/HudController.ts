import { Controller, OnStart } from "@flamework/core";
import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";
import ReactRoblox from "@rbxts/react-roblox";
import { Players, SoundService } from "@rbxts/services";
import { clientEvents } from "client/network";
import { SCRAMBLE_SLIDE_COOLDOWN, SE_SLIDE } from "shared/constants";
import { gameStore } from "shared/store/game-store";
import { MatchPhase, MinigameId, MissionId } from "shared/types";
import { getFeaturedUnlock } from "shared/utils/featuredUnlock";
import { GameHud } from "../ui/GameHud";

@Controller()
export class HudController implements OnStart {
	private root?: ReactRoblox.Root;
	private activeMinigameId?: MinigameId;
	private latestShopItems = gameStore.getState().shopItems;
	private latestLevel = gameStore.getState().playgroundLevel;
	private latestShopBalance = gameStore.getState().shopBalance;

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
			this.activeMinigameId = minigameId;
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
			this.latestLevel = level;
			this.latestShopBalance = shopBalance;
			gameStore.setPlayPoints(points, level);
			gameStore.setShopBalance(shopBalance);
			this.refreshFeaturedUnlock();
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
			const claimReady = gameStore.getState().missionClaimReady;
			if (
				claimReady &&
				missions.some(
					(mission) => mission.id === claimReady.id && mission.rewardCollected,
				)
			) {
				gameStore.setMissionClaimReady(undefined);
			}
		});

		clientEvents.missionCompleted.connect((_id, _pts) => {
			gameStore.setMissionClaimReady({
				id: _id as MissionId,
				pointsReward: _pts,
			});
			task.delay(5, () => {
				const current = gameStore.getState().missionClaimReady;
				if (current?.id === _id) {
					gameStore.setMissionClaimReady(undefined);
				}
			});
		});

		clientEvents.shopCatalog.connect((items) => {
			this.latestShopItems = items;
			gameStore.setShopItems(items);
			this.refreshFeaturedUnlock();
		});

		clientEvents.purchaseResult.connect((ok, _id, newShopBal, _err) => {
			if (ok) {
				clientEvents.requestShopCatalog.fire(); // refresh owned flags
				gameStore.setShopBalance(newShopBal); // shop balance only — NOT setPlayPoints
				this.latestShopBalance = newShopBal;
				this.refreshFeaturedUnlock();
			}
		});

		clientEvents.equipResult.connect(() => {
			clientEvents.requestShopCatalog.fire(); // refresh equipped flags
		});

		clientEvents.levelUp.connect((lv) => {
			gameStore.setLevelUp(lv);
			task.delay(3, () => gameStore.hideLevelUp());
		});

		clientEvents.hachiItemCollected.connect((count) => {
			gameStore.setHachiItemCount(count);
		});

		clientEvents.hachiEvolved.connect((level) => {
			gameStore.setHachiEvolutionLevel(level);
		});

		clientEvents.queueStatusChanged.connect((status) => {
			gameStore.setQueueStatus(status);
		});

		clientEvents.roundIntroShown.connect((intro) => {
			gameStore.setRoundIntro(intro);
			task.delay(intro.durationSeconds, () => {
				const current = gameStore.getState().roundIntro;
				if (current?.title === intro.title) {
					gameStore.setRoundIntro(undefined);
				}
			});
		});

		clientEvents.playerCaught.connect((caughtPlayerId) => {
			if (Players.LocalPlayer.UserId !== caughtPlayerId) return;
			if (this.activeMinigameId === MinigameId.CanKick) {
				gameStore.setLocalCaught(true);
			}
			if (this.activeMinigameId === MinigameId.ShibuyaScramble) {
				gameStore.setLocalTagged(true);
				gameStore.setSpiritCharges(1);
			}
		});

		clientEvents.playerFreed.connect((freedPlayerIds) => {
			if (!freedPlayerIds.includes(Players.LocalPlayer.UserId)) return;
			gameStore.setLocalCaught(false);
		});

		clientEvents.spiritChargeChanged.connect((charges) => {
			gameStore.setSpiritCharges(charges);
		});

		clientEvents.hachiRaceState.connect((state) => {
			gameStore.setHachiRaceState(state);
		});

		// Server-side slide impulse fired by ShibuyaScrambleMinigame during matches.
		// SlideController handles the lobby case directly; this covers the in-match path.
		let lastSlideImpulseTime = 0;
		let slideSE: Sound | undefined;
		clientEvents.slideImpulse.connect((dir, speed) => {
			const now = os.clock();
			if (now - lastSlideImpulseTime < SCRAMBLE_SLIDE_COOLDOWN) return;
			lastSlideImpulseTime = now;

			const character = Players.LocalPlayer.Character;
			if (!character) return;
			const hrp = character.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (!hrp) return;
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			if (humanoid) humanoid.PlatformStand = true;
			hrp.AssemblyLinearVelocity = dir.mul(speed);
			task.delay(0.4, () => {
				if (humanoid?.Parent) humanoid.PlatformStand = false;
			});

			// Slide SFX — SlideController is skipped during Scramble, so play here
			if (!slideSE) {
				slideSE = new Instance("Sound");
				slideSE.SoundId = SE_SLIDE;
				slideSE.Volume = 0.6;
				slideSE.Parent = SoundService;
			}
			slideSE.Play();
		});
	}

	private refreshFeaturedUnlock() {
		gameStore.setFeaturedUnlock(
			getFeaturedUnlock(
				this.latestShopItems,
				this.latestLevel,
				this.latestShopBalance,
			),
		);
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
