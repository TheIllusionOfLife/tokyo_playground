import { Controller, OnStart } from "@flamework/core";
import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";
import ReactRoblox from "@rbxts/react-roblox";
import {
	HapticService,
	Players,
	RunService,
	SoundService,
	UserInputService,
	Workspace,
} from "@rbxts/services";
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
			const caughtPlayer = Players.GetPlayerByUserId(caughtPlayerId);
			const verb =
				this.activeMinigameId === MinigameId.ShibuyaScramble
					? "tagged"
					: "caught";
			if (caughtPlayer) {
				gameStore.pushFeedMessage(`${caughtPlayer.Name} was ${verb}!`);
			}
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
			if (freedPlayerIds.size() > 0) {
				gameStore.pushFeedMessage(`${freedPlayerIds.size()} prisoners freed!`);
			}
			if (!freedPlayerIds.includes(Players.LocalPlayer.UserId)) return;
			gameStore.setLocalCaught(false);
		});

		clientEvents.canKicked.connect((kickerId) => {
			const kicker = Players.GetPlayerByUserId(kickerId);
			if (kicker) {
				gameStore.pushFeedMessage(`${kicker.Name} kicked the can!`);
			}
		});

		clientEvents.roundSummary.connect((summaryText, winnerName) => {
			gameStore.setSummaryText(summaryText);
			if (winnerName !== "") {
				gameStore.setWinnerName(winnerName);
				this.spawnConfetti(winnerName);
			}
		});

		clientEvents.oniReveal.connect((oniUserId, durationSeconds) => {
			const oniPlayer = Players.GetPlayerByUserId(oniUserId);
			if (oniPlayer) {
				gameStore.setOniRevealName(oniPlayer.Name);
				task.delay(durationSeconds, () => {
					gameStore.setOniRevealName(undefined);
				});
			}
		});

		clientEvents.spiritChargeChanged.connect((charges) => {
			gameStore.setSpiritCharges(charges);
		});

		clientEvents.hachiRaceState.connect((state) => {
			gameStore.setHachiRaceState(state);
		});

		// Haptic feedback — zero network cost, graceful fallback on non-gamepad devices
		clientEvents.playerCaught.connect((caughtId) => {
			if (caughtId === Players.LocalPlayer.UserId) {
				this.pulseHaptic(1.0);
			}
		});
		clientEvents.canKicked.connect(() => {
			this.pulseHaptic(0.6);
			this.shakeCamera(0.8);
		});
		clientEvents.hachiEvolved.connect(() => {
			this.pulseHaptic(0.8);
			this.shakeCamera(0.6);
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

	private pulseHaptic(intensity: number) {
		// Mobile vibration via VibrationService-like pattern (setMotor on gamepad)
		// Wrapped in pcall: silently no-ops on devices without haptic motors
		const duration = 0.15;
		pcall(() => {
			if (UserInputService.GamepadEnabled) {
				HapticService.SetMotor(
					Enum.UserInputType.Gamepad1,
					Enum.VibrationMotor.Large,
					intensity,
				);
				task.delay(duration, () => {
					pcall(() => {
						HapticService.SetMotor(
							Enum.UserInputType.Gamepad1,
							Enum.VibrationMotor.Large,
							0,
						);
					});
				});
			}
		});
	}

	private shakeCamera(intensity: number) {
		// Mobile devices get reduced shake to avoid disorientation
		const isMobile =
			UserInputService.TouchEnabled && !UserInputService.KeyboardEnabled;
		const scale = isMobile ? 0.5 : 1.0;
		const magnitude = intensity * scale;

		let frames = 0;
		const maxFrames = 5; // ~0.08s at 60fps, well under 0.3s
		const conn = RunService.RenderStepped.Connect(() => {
			frames++;
			if (frames > maxFrames) {
				conn.Disconnect();
				return;
			}
			const camera = Workspace.CurrentCamera;
			if (!camera) return;
			const offset = new CFrame(
				(math.random() - 0.5) * magnitude,
				(math.random() - 0.5) * magnitude,
				0,
			);
			camera.CFrame = camera.CFrame.mul(offset);
		});
	}

	private spawnConfetti(winnerName: string) {
		// Find winner's character and attach a temporary ParticleEmitter
		for (const player of Players.GetPlayers()) {
			if (player.Name !== winnerName) continue;
			const character = player.Character;
			if (!character) break;
			const hrp = character.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (!hrp) break;

			const emitter = new Instance("ParticleEmitter");
			emitter.Rate = 80;
			emitter.Lifetime = new NumberRange(1, 2);
			emitter.Speed = new NumberRange(10, 20);
			emitter.SpreadAngle = new Vector2(360, 360);
			emitter.Color = new ColorSequence([
				new ColorSequenceKeypoint(0, Color3.fromRGB(255, 220, 50)),
				new ColorSequenceKeypoint(0.5, Color3.fromRGB(255, 100, 100)),
				new ColorSequenceKeypoint(1, Color3.fromRGB(100, 150, 255)),
			]);
			emitter.Size = new NumberSequence([
				new NumberSequenceKeypoint(0, 0.5),
				new NumberSequenceKeypoint(1, 0),
			]);
			emitter.Parent = hrp;

			task.delay(3, () => {
				emitter.Enabled = false;
				task.delay(2, () => emitter.Destroy());
			});
			break;
		}
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
