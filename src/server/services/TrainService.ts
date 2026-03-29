import { OnStart, Service } from "@flamework/core";
import { ServerStorage, TweenService, Workspace } from "@rbxts/services";

const TRAIN_INTERVAL = 60; // seconds between spawns
const TWEEN_SPEED = 80; // studs per second

@Service()
export class TrainService implements OnStart {
	private template?: Model;
	private waypoints: BasePart[] = [];
	private activeTrain?: Model;

	onStart() {
		this.template = ServerStorage.FindFirstChild("TrainTemplate") as
			| Model
			| undefined;
		if (!this.template) {
			warn("[TrainService] TrainTemplate not found in ServerStorage");
			return;
		}

		const wpFolder = ServerStorage.FindFirstChild("TrainWaypoints");
		const path1 = wpFolder?.FindFirstChild("Path1");
		if (!path1) {
			warn("[TrainService] TrainWaypoints/Path1 not found");
			return;
		}

		// Sort waypoints by name (WP1, WP2, ...)
		const parts: BasePart[] = [];
		for (const child of path1.GetChildren()) {
			if (child.IsA("BasePart")) parts.push(child);
		}
		parts.sort((a, b) => a.Name < b.Name);
		this.waypoints = parts;

		if (this.waypoints.size() < 2) {
			warn("[TrainService] Need at least 2 waypoints");
			return;
		}

		print(
			`[TrainService] Started with ${this.waypoints.size()} waypoints, interval ${TRAIN_INTERVAL}s`,
		);
		this.runLoop();
	}

	private runLoop() {
		while (true) {
			this.spawnAndAnimate();
			task.wait(TRAIN_INTERVAL);
		}
	}

	private spawnAndAnimate() {
		if (!this.template || this.waypoints.size() < 2) return;

		// Cleanup previous train
		if (this.activeTrain?.Parent) {
			this.activeTrain.Destroy();
		}

		const train = this.template.Clone();

		// Set PrimaryPart if not set
		if (!train.PrimaryPart) {
			for (const child of train.GetChildren()) {
				if (child.IsA("BasePart")) {
					train.PrimaryPart = child;
					break;
				}
			}
		}
		if (!train.PrimaryPart) {
			train.Destroy();
			return;
		}

		// Make all parts cosmetic
		for (const desc of train.GetDescendants()) {
			if (desc.IsA("BasePart")) {
				desc.Anchored = desc === train.PrimaryPart;
				desc.CanCollide = false;
				desc.CanTouch = false;
				desc.CanQuery = false;
				desc.CastShadow = false;
			}
		}

		// Position at first waypoint, facing second
		const startPos = this.waypoints[0].Position;
		const nextPos = this.waypoints[1].Position;
		train.PrimaryPart.CFrame = CFrame.lookAt(startPos, nextPos);
		train.Parent = Workspace;
		this.activeTrain = train;

		// Tween through waypoints sequentially
		const primary = train.PrimaryPart;
		for (let i = 1; i < this.waypoints.size(); i++) {
			if (!primary.Parent) break; // train was destroyed

			const targetPos = this.waypoints[i].Position;
			const dist = primary.Position.sub(targetPos).Magnitude;
			const duration = dist / TWEEN_SPEED;

			// Look toward next waypoint (or keep current if last)
			const lookTarget =
				i < this.waypoints.size() - 1
					? this.waypoints[i + 1].Position
					: targetPos.add(targetPos.sub(this.waypoints[i - 1].Position).Unit);

			const tween = TweenService.Create(
				primary,
				new TweenInfo(duration, Enum.EasingStyle.Linear),
				{ CFrame: CFrame.lookAt(targetPos, lookTarget) },
			);
			tween.Play();
			tween.Completed.Wait();
		}

		// Destroy after reaching end
		if (train.Parent) {
			train.Destroy();
		}
		this.activeTrain = undefined;
	}
}
