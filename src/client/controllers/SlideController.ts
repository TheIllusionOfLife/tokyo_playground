import { Controller, OnStart } from "@flamework/core";
import {
	CollectionService,
	Players,
	RunService,
	SoundService,
} from "@rbxts/services";
import { clientEvents } from "client/network";
import {
	SCRAMBLE_SLIDE_COOLDOWN,
	SCRAMBLE_SLIDE_SPEED,
	SE_SLIDE,
	SLIDE_DIR_Y_OFFSET,
	SLIDE_RAMP_TAG,
	SLIDE_TRIGGER_RADIUS,
} from "shared/constants";
import { gameStore } from "shared/store/game-store";
import { MatchPhase, MinigameId } from "shared/types";

const SURFACE_THRESHOLD = SLIDE_TRIGGER_RADIUS;

@Controller()
export class SlideController implements OnStart {
	private lastSlideTime = 0;
	private slideRamps: BasePart[] = [];
	private slideSE?: Sound;

	onStart() {
		this.slideRamps = CollectionService.GetTagged(SLIDE_RAMP_TAG).filter(
			(p): p is BasePart => p.IsA("BasePart"),
		);
		CollectionService.GetInstanceAddedSignal(SLIDE_RAMP_TAG).Connect((p) => {
			if (p.IsA("BasePart")) this.slideRamps.push(p);
		});
		CollectionService.GetInstanceRemovedSignal(SLIDE_RAMP_TAG).Connect((p) => {
			this.slideRamps = this.slideRamps.filter((r) => r !== p);
		});
		RunService.Heartbeat.Connect(() => this.check());
	}

	private check() {
		// ShibuyaScramble handles slides server-side (slideImpulse); skip local path
		// to avoid double-impulse. HachiRide and lobby still use this path.
		const { matchPhase, activeMinigameId } = gameStore.getState();
		if (
			matchPhase === MatchPhase.InProgress &&
			activeMinigameId === MinigameId.ShibuyaScramble
		)
			return;

		const now = os.clock();
		if (now - this.lastSlideTime < SCRAMBLE_SLIDE_COOLDOWN) return;

		const char = Players.LocalPlayer.Character;
		if (!char) return;
		const hrp = char.FindFirstChild("HumanoidRootPart") as BasePart | undefined;
		if (!hrp) return;

		const humanoid = char.FindFirstChildOfClass("Humanoid");
		const seatPart = humanoid?.SeatPart;
		const vehicleBody = seatPart?.Parent?.FindFirstChild("Body") as
			| BasePart
			| undefined;
		const checkPos = vehicleBody ? vehicleBody.Position : hrp.Position;

		for (const ramp of this.slideRamps) {
			if (!ramp.Parent) continue;

			// Accurate closest-point-on-box check
			const localPos = ramp.CFrame.PointToObjectSpace(checkPos);
			const half = ramp.Size.mul(0.5);
			const clamped = new Vector3(
				math.clamp(localPos.X, -half.X, half.X),
				math.clamp(localPos.Y, -half.Y, half.Y),
				math.clamp(localPos.Z, -half.Z, half.Z),
			);
			const closestWorld = ramp.CFrame.PointToWorldSpace(clamped);
			const dist = checkPos.sub(closestWorld).Magnitude;
			if (dist > SURFACE_THRESHOLD) continue;

			this.lastSlideTime = now;
			const dir = ramp.CFrame.LookVector.add(
				new Vector3(0, SLIDE_DIR_Y_OFFSET, 0),
			).Unit;

			const rawSpeed = ramp.GetAttribute("SlideSpeed");
			const speed =
				typeIs(rawSpeed, "number") && rawSpeed > 0
					? rawSpeed
					: SCRAMBLE_SLIDE_SPEED;

			if (vehicleBody) {
				// Server must apply impulse to vehicle (server owns Body physics).
				// Client fires event; server zeros BodyVelocity.MaxForce then applies.
				clientEvents.requestHachiSlide.fire();
			} else {
				// Character physics are client-owned. Disable Humanoid ground
				// controller via PlatformStand so the impulse isn't dampened.
				if (humanoid) humanoid.PlatformStand = true;
				hrp.AssemblyLinearVelocity = dir.mul(speed);
				task.delay(0.4, () => {
					if (humanoid?.Parent) humanoid.PlatformStand = false;
				});
			}

			// Slide sound effect (cached instance)
			if (!this.slideSE) {
				this.slideSE = new Instance("Sound");
				this.slideSE.SoundId = SE_SLIDE;
				this.slideSE.Volume = 0.6;
				this.slideSE.Parent = SoundService;
			}
			this.slideSE.Play();
			return;
		}
	}
}
