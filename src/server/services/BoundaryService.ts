import { OnStart, Service } from "@flamework/core";
import { Players, RunService } from "@rbxts/services";
import {
	BOUNDARY_AABB_MAX,
	BOUNDARY_AABB_MIN,
	BOUNDARY_CHECK_INTERVAL,
	BOUNDARY_WARNING_RATIO,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import { edgeRatio_XZ, isInsideAABB_XZ } from "shared/utils/proximityUtils";

@Service()
export class BoundaryService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});
	/** Last known valid position per player (inside boundary). */
	private readonly lastValidPos = new Map<number, Vector3>();
	private elapsed = 0;
	private matchActive = false;

	setMatchActive(active: boolean) {
		this.matchActive = active;
	}

	onStart() {
		print("[BoundaryService] Started");

		RunService.Heartbeat.Connect((dt) => {
			this.elapsed += dt;
			if (this.elapsed < BOUNDARY_CHECK_INTERVAL) return;
			this.elapsed = 0;
			this.checkAllPlayers();
		});

		Players.PlayerRemoving.Connect((player) => {
			this.lastValidPos.delete(player.UserId);
		});
	}

	private checkAllPlayers() {
		if (this.matchActive) return;

		for (const player of Players.GetPlayers()) {
			const character = player.Character;
			if (!character) continue;
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			if (!humanoid || humanoid.Health <= 0) continue;

			const hrp = character.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (!hrp) continue;

			const pos = hrp.Position;
			const ratio = edgeRatio_XZ(pos, BOUNDARY_AABB_MIN, BOUNDARY_AABB_MAX);

			if (ratio >= 1) {
				// Beyond boundary: teleport back
				const lastValid = this.lastValidPos.get(player.UserId);
				if (lastValid) {
					character.PivotTo(new CFrame(lastValid.add(new Vector3(0, 3, 0))));
				}
				this.serverEvents.boundaryWarning.fire(player, 1);
			} else if (ratio >= BOUNDARY_WARNING_RATIO) {
				// In warning zone: notify client for fog effect
				this.serverEvents.boundaryWarning.fire(player, ratio);
			} else {
				// Safe zone: track valid position and clear warning
				this.lastValidPos.set(player.UserId, pos);
				if (ratio < BOUNDARY_WARNING_RATIO - 0.05) {
					this.serverEvents.boundaryWarning.fire(player, 0);
				}
			}
		}
	}
}
