import { OnStart, Service } from "@flamework/core";
import { RunService, TweenService, Workspace } from "@rbxts/services";

const TRAIN_INTERVAL = 12; // seconds to wait before next pass
const TWEEN_SPEED = 60; // studs per second
const TRAVEL_DISTANCE = 950; // studs from start to city edge
const FADE_STUDS = 80; // studs over which the train fades out at the end

interface PartState {
	part: BasePart;
	originalTransparency: number;
	originalCanCollide: boolean;
}

@Service()
export class TrainService implements OnStart {
	onStart() {
		const trainInst = Workspace.FindFirstChild("Subway Train");
		if (!trainInst?.IsA("Model")) {
			warn("[TrainService] Subway Train not found in Workspace");
			return;
		}

		const train = trainInst;
		if (!train.PrimaryPart) {
			for (const child of train.GetDescendants()) {
				if (child.IsA("BasePart")) {
					train.PrimaryPart = child;
					break;
				}
			}
		}
		if (!train.PrimaryPart) {
			warn("[TrainService] Subway Train has no PrimaryPart");
			return;
		}

		// Anchor PrimaryPart, weld everything else
		const primary = train.PrimaryPart;
		primary.Anchored = true;
		for (const desc of train.GetDescendants()) {
			if (desc.IsA("BasePart") && desc !== primary) {
				desc.Anchored = false;
				if (!desc.FindFirstChildOfClass("WeldConstraint")) {
					const weld = new Instance("WeldConstraint");
					weld.Part0 = primary;
					weld.Part1 = desc;
					weld.Parent = desc;
				}
			}
		}

		// Cache original transparency and collision per part
		const partStates: PartState[] = [];
		for (const desc of train.GetDescendants()) {
			if (desc.IsA("BasePart")) {
				partStates.push({
					part: desc,
					originalTransparency: desc.Transparency,
					originalCanCollide: desc.CanCollide,
				});
			}
		}

		print("[TrainService] Started — one-directional train with fade");
		task.spawn(() => this.runLoop(primary, partStates));
	}

	private setFade(partStates: PartState[], alpha: number) {
		for (const ps of partStates) {
			// Interpolate from original transparency toward fully hidden
			ps.part.Transparency =
				ps.originalTransparency + (1 - ps.originalTransparency) * alpha;
		}
	}

	private setCollision(partStates: PartState[], enabled: boolean) {
		for (const ps of partStates) {
			ps.part.CanCollide = enabled ? ps.originalCanCollide : false;
		}
	}

	private runLoop(primary: BasePart, partStates: PartState[]) {
		const startCFrame = primary.CFrame;
		const travelDir = startCFrame.RightVector;
		const exitCFrame = startCFrame.add(travelDir.mul(TRAVEL_DISTANCE));
		const duration = TRAVEL_DISTANCE / TWEEN_SPEED;

		while (primary.Parent) {
			// Start visible at initial position with original transparency
			primary.CFrame = startCFrame;
			this.setFade(partStates, 0);
			this.setCollision(partStates, true);

			// Tween from start toward city edge
			const tween = TweenService.Create(
				primary,
				new TweenInfo(
					duration,
					Enum.EasingStyle.Linear,
					Enum.EasingDirection.InOut,
				),
				{ CFrame: exitCFrame },
			);
			tween.Play();

			// Fade out near the end via Heartbeat
			const startTime = os.clock();
			const conn = RunService.Heartbeat.Connect(() => {
				const traveled = (os.clock() - startTime) * TWEEN_SPEED;
				if (traveled > TRAVEL_DISTANCE - FADE_STUDS) {
					const remaining = TRAVEL_DISTANCE - traveled;
					this.setFade(partStates, 1 - math.max(remaining, 0) / FADE_STUDS);
				}
			});

			tween.Completed.Wait();
			conn.Disconnect();

			// Hide, disable collision, and teleport back to start
			this.setFade(partStates, 1);
			this.setCollision(partStates, false);
			primary.CFrame = startCFrame;

			task.wait(TRAIN_INTERVAL);
		}
	}
}
