import { OnStart, Service } from "@flamework/core";
import { Players, RunService } from "@rbxts/services";
import {
	BOUNDARY_AABB_MAX,
	BOUNDARY_AABB_MIN,
	BOUNDARY_WARNING_RATIO,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import { edgeRatio_XZ } from "shared/utils/proximityUtils";

/** Minimum Y before we consider the player falling into void. */
const VOID_Y_THRESHOLD = -10;
/** Check boundary every 0.25s for responsive teleport-back. */
const CHECK_INTERVAL = 0.25;
/** Only store lastValidPos when well inside boundary (avoids edge positions). */
const SAFE_RATIO = 0.7;

@Service()
export class BoundaryService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});
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
			if (this.elapsed < CHECK_INTERVAL) return;
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

			// Fast void check: if falling below threshold, teleport immediately
			if (pos.Y < VOID_Y_THRESHOLD) {
				this.teleportBack(player, character);
				continue;
			}

			const ratio = edgeRatio_XZ(pos, BOUNDARY_AABB_MIN, BOUNDARY_AABB_MAX);

			if (ratio >= 1) {
				// Beyond boundary: teleport back
				this.teleportBack(player, character);
				// Send ratio=2 to signal "teleported" (distinct from warning)
				this.serverEvents.boundaryWarning.fire(player, 2);
			} else if (ratio >= BOUNDARY_WARNING_RATIO) {
				// In warning zone: notify client for fog + hint
				this.serverEvents.boundaryWarning.fire(player, ratio);
			} else {
				// Safe zone: only store position when well inside boundary
				if (ratio < SAFE_RATIO) {
					this.lastValidPos.set(player.UserId, pos);
				}
				if (ratio < BOUNDARY_WARNING_RATIO - 0.05) {
					this.serverEvents.boundaryWarning.fire(player, 0);
				}
			}
		}
	}

	private teleportBack(player: Player, character: Model) {
		const lastValid = this.lastValidPos.get(player.UserId);
		if (lastValid) {
			character.PivotTo(new CFrame(lastValid.add(new Vector3(0, 5, 0))));
			this.serverEvents.boundaryWarning.fire(player, 0);
		} else {
			// Fallback: teleport to spawn
			const spawn = game.Workspace.FindFirstChildWhichIsA("SpawnLocation");
			if (spawn) {
				character.PivotTo(spawn.CFrame.add(new Vector3(0, 3, 0)));
			}
			this.serverEvents.boundaryWarning.fire(player, 0);
		}
	}
}
