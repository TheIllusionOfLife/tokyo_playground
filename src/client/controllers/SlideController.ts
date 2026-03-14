import { Controller, OnStart } from "@flamework/core";
import { CollectionService, Players, RunService } from "@rbxts/services";
import { clientEvents } from "client/network";
import {
	SCRAMBLE_SLIDE_COOLDOWN,
	SCRAMBLE_SLIDE_SPEED,
} from "shared/constants";

const SLIDE_RAMP_TAG = "ShibuyaSlideRamp";
const SURFACE_THRESHOLD = 2.5; // studs from ramp surface to trigger
const SLIDE_DIR_Y_OFFSET = -0.4; // downward bias added to ramp LookVector

@Controller()
export class SlideController implements OnStart {
	private lastSlideTime = 0;
	private slideRamps: BasePart[] = [];

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

			if (vehicleBody) {
				// Server must apply impulse to vehicle (server owns Body physics).
				// Client fires event; server zeros BodyVelocity.MaxForce then applies.
				clientEvents.requestHachiSlide.fire(dir);
			} else {
				// Character physics are client-owned. Disable Humanoid ground
				// controller via PlatformStand so the impulse isn't dampened.
				if (humanoid) humanoid.PlatformStand = true;
				hrp.AssemblyLinearVelocity = dir.mul(SCRAMBLE_SLIDE_SPEED);
				task.delay(0.4, () => {
					if (humanoid?.Parent) humanoid.PlatformStand = false;
				});
			}
			return;
		}
	}
}
