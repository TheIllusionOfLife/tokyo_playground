import { OnStart, Service } from "@flamework/core";
import { RunService, TweenService, Workspace } from "@rbxts/services";

const TRAIN_INTERVAL = 12; // seconds to wait before next pass
const TWEEN_SPEED = 60; // studs per second
const TRAVEL_DISTANCE = 1900; // total one-way travel (beyond city edges on both sides)
const FADE_STUDS = 80; // studs over which the train fades in/out

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

		// Collect all BaseParts for transparency fade
		const allParts: BasePart[] = [];
		for (const desc of train.GetDescendants()) {
			if (desc.IsA("BasePart")) {
				allParts.push(desc);
			}
		}

		print("[TrainService] Started — one-directional train with fade");
		task.spawn(() => this.runLoop(primary, allParts));
	}

	private setTransparency(parts: BasePart[], alpha: number) {
		for (const part of parts) {
			part.Transparency = alpha;
		}
	}

	private runLoop(primary: BasePart, allParts: BasePart[]) {
		const startCFrame = primary.CFrame;
		const travelDir = startCFrame.RightVector;
		// Entry point: half travel distance behind start
		const entryCFrame = startCFrame.sub(travelDir.mul(TRAVEL_DISTANCE / 2));
		const exitCFrame = startCFrame.add(travelDir.mul(TRAVEL_DISTANCE / 2));
		const duration = TRAVEL_DISTANCE / TWEEN_SPEED;

		while (primary.Parent) {
			// Teleport to entry point, fully hidden
			primary.CFrame = entryCFrame;
			this.setTransparency(allParts, 1);

			// Tween across entire distance
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

			// Fade in/out via Heartbeat during the tween
			const startTime = os.clock();
			const conn = RunService.Heartbeat.Connect(() => {
				const elapsed = os.clock() - startTime;
				const traveled = elapsed * TWEEN_SPEED;

				// Fade in over first FADE_STUDS
				if (traveled < FADE_STUDS) {
					this.setTransparency(allParts, 1 - traveled / FADE_STUDS);
				}
				// Fade out over last FADE_STUDS
				else if (traveled > TRAVEL_DISTANCE - FADE_STUDS) {
					const remaining = TRAVEL_DISTANCE - traveled;
					this.setTransparency(
						allParts,
						1 - math.max(remaining, 0) / FADE_STUDS,
					);
				}
				// Fully visible in the middle
				else {
					this.setTransparency(allParts, 0);
				}
			});

			tween.Completed.Wait();
			conn.Disconnect();

			// Ensure fully hidden after tween completes
			this.setTransparency(allParts, 1);

			task.wait(TRAIN_INTERVAL);
		}
	}
}
