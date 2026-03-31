import { OnStart, Service } from "@flamework/core";
import { RunService, TweenService, Workspace } from "@rbxts/services";

const TRAIN_INTERVAL = 12; // seconds to wait before next pass
const TWEEN_SPEED = 60; // studs per second
const TRAVEL_DISTANCE = 950; // studs from start to city edge
const FADE_STUDS = 80; // studs over which the train fades out at the end
const VISIBILITY_SETTLE = 0.5; // seconds to let transparency propagate to clients

interface PartState {
	part: BasePart;
	originalTransparency: number;
	originalCanCollide: boolean;
}

interface DecalState {
	decal: Decal | Texture;
	originalTransparency: number;
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

		// Cache original transparency per part and per decal/texture
		const partStates: PartState[] = [];
		const decalStates: DecalState[] = [];
		for (const desc of train.GetDescendants()) {
			if (desc.IsA("BasePart")) {
				partStates.push({
					part: desc,
					originalTransparency: desc.Transparency,
					originalCanCollide: desc.CanCollide,
				});
			} else if (desc.IsA("Decal") || desc.IsA("Texture")) {
				decalStates.push({
					decal: desc,
					originalTransparency: desc.Transparency,
				});
			}
		}

		print("[TrainService] Started — one-directional train with fade");
		task.spawn(() => this.runLoop(primary, partStates, decalStates));
	}

	private setFade(
		partStates: PartState[],
		decalStates: DecalState[],
		alpha: number,
	) {
		for (const ps of partStates) {
			ps.part.Transparency =
				ps.originalTransparency + (1 - ps.originalTransparency) * alpha;
		}
		for (const ds of decalStates) {
			ds.decal.Transparency =
				ds.originalTransparency + (1 - ds.originalTransparency) * alpha;
		}
	}

	private setCollision(partStates: PartState[], enabled: boolean) {
		for (const ps of partStates) {
			ps.part.CanCollide = enabled ? ps.originalCanCollide : false;
		}
	}

	private runLoop(
		primary: BasePart,
		partStates: PartState[],
		decalStates: DecalState[],
	) {
		const startCFrame = primary.CFrame;
		const travelDir = startCFrame.RightVector;
		const exitCFrame = startCFrame.add(travelDir.mul(TRAVEL_DISTANCE));
		const hiddenCFrame = startCFrame.add(new Vector3(0, -500, 0));
		const duration = TRAVEL_DISTANCE / TWEEN_SPEED;

		while (primary.Parent) {
			// Train is already visible (restored off-screen during previous wait).
			primary.CFrame = startCFrame;
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
					this.setFade(
						partStates,
						decalStates,
						1 - math.max(remaining, 0) / FADE_STUDS,
					);
				}
			});

			tween.Completed.Wait();
			conn.Disconnect();

			// Hide fully, disable collision, move off-screen
			this.setFade(partStates, decalStates, 1);
			this.setCollision(partStates, false);
			primary.CFrame = hiddenCFrame;

			// Restore visibility while off-screen so clients process all changes
			// before the train teleports back to the visible start position.
			task.wait(TRAIN_INTERVAL - VISIBILITY_SETTLE);
			this.setFade(partStates, decalStates, 0);
			task.wait(VISIBILITY_SETTLE);
		}
	}
}
