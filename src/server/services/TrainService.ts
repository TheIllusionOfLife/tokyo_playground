import { OnStart, Service } from "@flamework/core";
import { TweenService, Workspace } from "@rbxts/services";

const TRAIN_INTERVAL = 10; // seconds to wait at each end before returning
const TWEEN_SPEED = 60; // studs per second
const TRAVEL_DISTANCE = 400; // studs to travel along the train's forward axis

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
				// Add weld if not already welded
				if (!desc.FindFirstChildOfClass("WeldConstraint")) {
					const weld = new Instance("WeldConstraint");
					weld.Part0 = primary;
					weld.Part1 = desc;
					weld.Parent = desc;
				}
			}
		}

		print("[TrainService] Started — animating Subway Train back and forth");
		task.spawn(() => this.runLoop(primary));
	}

	private runLoop(primary: BasePart) {
		const startCFrame = primary.CFrame;
		// Travel along the train's RightVector (the model's length axis)
		const travelDir = startCFrame.RightVector;
		const endCFrame = startCFrame.add(travelDir.mul(TRAVEL_DISTANCE));
		const duration = TRAVEL_DISTANCE / TWEEN_SPEED;

		while (primary.Parent) {
			// Move forward
			const tweenFwd = TweenService.Create(
				primary,
				new TweenInfo(
					duration,
					Enum.EasingStyle.Quad,
					Enum.EasingDirection.InOut,
				),
				{ CFrame: endCFrame },
			);
			tweenFwd.Play();
			tweenFwd.Completed.Wait();

			task.wait(TRAIN_INTERVAL);

			// Move back
			const tweenBack = TweenService.Create(
				primary,
				new TweenInfo(
					duration,
					Enum.EasingStyle.Quad,
					Enum.EasingDirection.InOut,
				),
				{ CFrame: startCFrame },
			);
			tweenBack.Play();
			tweenBack.Completed.Wait();

			task.wait(TRAIN_INTERVAL);
		}
	}
}
