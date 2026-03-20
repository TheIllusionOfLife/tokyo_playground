import { Controller, OnStart } from "@flamework/core";
import {
	CollectionService,
	Players,
	RunService,
	SoundService,
} from "@rbxts/services";
import {
	AMBIENT_CHECK_INTERVAL,
	CAT_APPROACH_SPEED,
	FOOD_STALL_TAG,
	HACHI_PAIR_INTERACTION_RADIUS,
	HACHI_RIDE_TAG,
	MOOD_DECAY_DURATION,
	MUSICIAN_TAG,
	SLEEP_IDLE_THRESHOLD,
	TONGUE_OUT_SPEED_THRESHOLD,
	WATER_FEATURE_TAG,
} from "shared/constants";
import { gameStore } from "shared/store/game-store";
import { GameState, HachiMood, TimePhase } from "shared/types";

interface AmbientCooldown {
	tag: string;
	instance: Instance;
	expiry: number;
}

/**
 * Client-only ambient reactions for lobby Hachi. Checks proximity to
 * tagged world objects and current game state, then plays cosmetic
 * animations and sounds. Zero server cost.
 */
@Controller()
export class HachiAmbientController implements OnStart {
	private checkAccumulator = 0;
	private cooldowns: AmbientCooldown[] = [];
	private mood = HachiMood.Happy;
	private moodExpiry = 0;
	private idleTimer = 0;
	private tongueOutActive = false;

	onStart() {
		RunService.Heartbeat.Connect((dt) => this.tick(dt));

		// React to stamp discovery with happy reaction
		gameStore.subscribe(
			(state) => state.stampDiscoveryPopup,
			(popup) => {
				if (popup) this.setMood(HachiMood.Excited);
			},
		);

		// React to micro-event start
		gameStore.subscribe(
			(state) => state.currentMicroEvent,
			(evt) => {
				if (evt) this.setMood(HachiMood.Excited);
			},
		);
	}

	private tick(dt: number) {
		const storeState = gameStore.getState();
		// Only run in lobby while riding Hachi
		if (storeState.matchPhase !== "WaitingForPlayers") return;

		const hachiBody = this.getLocalHachiBody();
		if (!hachiBody) return;

		// Mood decay
		if (os.clock() > this.moodExpiry && this.mood !== HachiMood.Happy) {
			this.mood = HachiMood.Happy;
		}

		// Speed-based tongue-out
		const speed = hachiBody.AssemblyLinearVelocity.Magnitude;
		if (speed > TONGUE_OUT_SPEED_THRESHOLD && !this.tongueOutActive) {
			this.tongueOutActive = true;
			// Animation would be played here via AnimationController
		} else if (speed <= TONGUE_OUT_SPEED_THRESHOLD && this.tongueOutActive) {
			this.tongueOutActive = false;
		}

		// Night idle -> sleepy
		if (storeState.timePhase === TimePhase.Night && speed < 2) {
			this.idleTimer += dt;
			if (
				this.idleTimer > SLEEP_IDLE_THRESHOLD &&
				this.mood !== HachiMood.Sleepy
			) {
				this.setMood(HachiMood.Sleepy);
			}
		} else {
			this.idleTimer = 0;
		}

		// Throttled proximity checks
		this.checkAccumulator += dt;
		if (this.checkAccumulator < AMBIENT_CHECK_INTERVAL) return;
		this.checkAccumulator -= AMBIENT_CHECK_INTERVAL;

		const pos = hachiBody.Position;
		this.checkProximityTrigger(FOOD_STALL_TAG, pos, 15, 30);
		this.checkProximityTrigger(WATER_FEATURE_TAG, pos, 10, 60);
		this.checkProximityTrigger(MUSICIAN_TAG, pos, 20, 0); // continuous, no cooldown
		this.checkHachiPairProximity(hachiBody);
	}

	private checkProximityTrigger(
		tag: string,
		pos: Vector3,
		radius: number,
		cooldownSec: number,
	) {
		const radiusSq = radius * radius;
		for (const inst of CollectionService.GetTagged(tag)) {
			if (!inst.IsA("BasePart")) continue;
			const delta = pos.sub(inst.Position);
			if (delta.Dot(delta) > radiusSq) continue;

			// Check cooldown
			if (this.isOnCooldown(tag, inst)) continue;

			// Trigger reaction
			this.playReaction(tag);
			if (cooldownSec > 0) {
				this.setCooldown(tag, inst, cooldownSec);
			}
			return; // One reaction per tag per check
		}
	}

	private checkHachiPairProximity(localBody: BasePart) {
		const radiusSq =
			HACHI_PAIR_INTERACTION_RADIUS * HACHI_PAIR_INTERACTION_RADIUS;
		const localPos = localBody.Position;

		for (const hachi of CollectionService.GetTagged(HACHI_RIDE_TAG)) {
			if (!hachi.IsA("Model")) continue;
			const body = hachi.FindFirstChild("Body") as BasePart | undefined;
			if (!body || body === localBody) continue;

			const delta = localPos.sub(body.Position);
			if (delta.Dot(delta) < radiusSq) {
				if (!this.isOnCooldown("HachiPair", hachi)) {
					this.setMood(HachiMood.Excited);
					this.setCooldown("HachiPair", hachi, 45);
				}
				return;
			}
		}
	}

	private playReaction(tag: string) {
		// Mood transitions based on trigger type
		if (tag === FOOD_STALL_TAG) {
			this.setMood(HachiMood.Happy);
		} else if (tag === MUSICIAN_TAG) {
			this.setMood(HachiMood.Relaxed);
		} else if (tag === WATER_FEATURE_TAG) {
			this.setMood(HachiMood.Relaxed);
		}
		// Animations and SFX would be played via AnimationController here.
		// For now, mood state drives idle anim selection.
	}

	private setMood(mood: HachiMood) {
		this.mood = mood;
		this.moodExpiry = os.clock() + MOOD_DECAY_DURATION;
	}

	getMood(): HachiMood {
		return this.mood;
	}

	private isOnCooldown(tag: string, inst: Instance): boolean {
		const now = os.clock();
		// Clean expired cooldowns
		this.cooldowns = this.cooldowns.filter((c) => c.expiry > now);
		return this.cooldowns.some((c) => c.tag === tag && c.instance === inst);
	}

	private setCooldown(tag: string, inst: Instance, duration: number) {
		this.cooldowns.push({
			tag,
			instance: inst,
			expiry: os.clock() + duration,
		});
	}

	private getLocalHachiBody(): BasePart | undefined {
		const character = Players.LocalPlayer.Character;
		if (!character) return undefined;
		const humanoid = character.FindFirstChildOfClass("Humanoid");
		if (!humanoid?.SeatPart) return undefined;
		const hachiModel = humanoid.SeatPart.Parent;
		if (!hachiModel) return undefined;
		if (!CollectionService.HasTag(hachiModel, HACHI_RIDE_TAG)) return undefined;
		return hachiModel.FindFirstChild("Body") as BasePart | undefined;
	}
}
