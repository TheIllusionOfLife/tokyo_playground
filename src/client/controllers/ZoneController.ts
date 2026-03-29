import { Controller, OnStart } from "@flamework/core";
import { CollectionService, Players, RunService } from "@rbxts/services";
import {
	ZONE_DEBOUNCE,
	ZONE_DISPLAY_DURATION,
	ZONE_TAG,
} from "shared/constants";
import { gameStore } from "shared/store/game-store";

const CHECK_INTERVAL = 0.5; // seconds between zone checks

@Controller()
export class ZoneController implements OnStart {
	private zoneParts: BasePart[] = [];
	private lastShown = new Map<string, number>(); // zoneName → timestamp
	private currentZone = "";
	private elapsed = 0;

	onStart() {
		this.zoneParts = CollectionService.GetTagged(ZONE_TAG).filter(
			(p): p is BasePart => p.IsA("BasePart"),
		);
		CollectionService.GetInstanceAddedSignal(ZONE_TAG).Connect((p) => {
			if (p.IsA("BasePart")) this.zoneParts.push(p);
		});
		CollectionService.GetInstanceRemovedSignal(ZONE_TAG).Connect((p) => {
			this.zoneParts = this.zoneParts.filter((z) => z !== p);
		});

		RunService.Heartbeat.Connect((dt) => {
			this.elapsed += dt;
			if (this.elapsed < CHECK_INTERVAL) return;
			this.elapsed = 0;
			this.check();
		});

		// Force recompute on respawn/teleport
		Players.LocalPlayer.CharacterAdded.Connect(() => {
			task.wait(1);
			this.currentZone = "";
			this.check();
		});
	}

	private check() {
		const char = Players.LocalPlayer.Character;
		if (!char) return;
		const hrp = char.FindFirstChild("HumanoidRootPart") as BasePart | undefined;
		if (!hrp) return;

		const pos = hrp.Position;
		const now = os.clock();

		let nearestZone = "";
		let nearestDistSq = math.huge;

		for (const part of this.zoneParts) {
			if (!part.Parent) continue;
			const radius = (part.GetAttribute("ZoneRadius") as number) ?? 30;
			const delta = pos.sub(part.Position);
			const distSq = delta.X * delta.X + delta.Y * delta.Y + delta.Z * delta.Z;
			if (distSq < radius * radius && distSq < nearestDistSq) {
				const zoneName = (part.GetAttribute("ZoneName") as string) ?? part.Name;
				nearestDistSq = distSq;
				nearestZone = zoneName;
			}
		}

		if (nearestZone !== "" && nearestZone !== this.currentZone) {
			const lastTime = this.lastShown.get(nearestZone) ?? 0;
			if (now - lastTime >= ZONE_DEBOUNCE) {
				this.currentZone = nearestZone;
				this.lastShown.set(nearestZone, now);
				gameStore.setCurrentZone(nearestZone);
				task.delay(ZONE_DISPLAY_DURATION, () => {
					if (this.currentZone === nearestZone) {
						gameStore.setCurrentZone("");
					}
				});
			}
		} else if (nearestZone === "" && this.currentZone !== "") {
			this.currentZone = "";
		}
	}
}
