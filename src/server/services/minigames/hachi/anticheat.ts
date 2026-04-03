/**
 * HachiRide anti-cheat: speed and teleport detection with strike system.
 * Operates on shared mutable state via HachiAnticheatContext.
 */
import {
	HACHI_ANTICHEAT_CHECK_INTERVAL,
	HACHI_ANTICHEAT_GRACE_STUDS,
	HACHI_ANTICHEAT_RESPAWN_GRACE,
	HACHI_ANTICHEAT_STRIKE_DECAY,
	HACHI_ANTICHEAT_STRIKE_LIMIT,
	HACHI_ANTICHEAT_TELEPORT_THRESHOLD,
	HACHI_JUMP_VELOCITY,
	HACHI_MAX_SPEED_TOLERANCE,
	HACHI_WALK_SPEEDS,
} from "shared/constants";
import { HachiAnticheatContext } from "./types";

/** Reset anti-cheat tracking for a player (used on spawn/respawn). */
export function resetAnticheatBaseline(
	ctx: HachiAnticheatContext,
	userId: number,
	position: Vector3,
) {
	ctx.lastPositions.set(userId, position);
	ctx.strikes.set(userId, 0);
	ctx.lastStrikeTime.delete(userId);
}

/** Run speed and teleport violation checks. Rate-limited internally. */
export function checkSpeedViolations(
	ctx: HachiAnticheatContext,
): number /* updated lastPositionTime */ {
	const now = os.clock();
	if (now - ctx.lastPositionTime < HACHI_ANTICHEAT_CHECK_INTERVAL)
		return ctx.lastPositionTime;
	const elapsed = now - ctx.lastPositionTime;

	const maxSpeed =
		math.max(
			HACHI_WALK_SPEEDS[HACHI_WALK_SPEEDS.size() - 1],
			HACHI_JUMP_VELOCITY,
		) * HACHI_MAX_SPEED_TOLERANCE;
	const maxDist = maxSpeed * elapsed + HACHI_ANTICHEAT_GRACE_STUDS;

	for (const [userId] of ctx.playerStates) {
		// Skip players in slide impulse, but refresh baseline
		if (ctx.hachiSlideActive.has(userId)) {
			const p = ctx.playerObjects.get(userId);
			const h = p?.Character?.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (h) ctx.lastPositions.set(userId, h.Position);
			continue;
		}

		const player = ctx.playerObjects.get(userId);
		if (!player?.Character) continue;
		const hrp = player.Character.FindFirstChild("HumanoidRootPart") as
			| BasePart
			| undefined;
		if (!hrp) continue;

		const pos = hrp.Position;
		const lastPos = ctx.lastPositions.get(userId);
		ctx.lastPositions.set(userId, pos);

		if (!lastPos) continue;

		const dist = pos.sub(lastPos).Magnitude;

		// Teleport detection: blatant displacement far beyond any legitimate movement.
		if (dist > HACHI_ANTICHEAT_TELEPORT_THRESHOLD) {
			const respawnTime = ctx.respawnGrace.get(userId) ?? 0;
			const wallState = ctx.wallRunStates.get(userId);
			if (
				now - respawnTime < HACHI_ANTICHEAT_RESPAWN_GRACE ||
				wallState?.running
			) {
				continue;
			}
			const currentStrikes = (ctx.strikes.get(userId) ?? 0) + 2;
			ctx.strikes.set(userId, currentStrikes);
			ctx.lastStrikeTime.set(userId, now);
			if (currentStrikes >= HACHI_ANTICHEAT_STRIKE_LIMIT) {
				warn(
					`[HachiRide] Teleport snapback for ${player.Name}: ${math.floor(dist)} studs (strike ${currentStrikes})`,
				);
				player.Character?.PivotTo(new CFrame(lastPos));
				if (hrp) hrp.AssemblyLinearVelocity = Vector3.zero;
				ctx.lastPositions.set(userId, lastPos);
			} else {
				warn(
					`[HachiRide] Teleport warning for ${player.Name}: ${math.floor(dist)} studs (strike ${currentStrikes})`,
				);
				ctx.lastPositions.set(userId, lastPos);
			}
			continue;
		}

		if (dist <= maxDist) {
			// Clean movement: decay strikes over time
			const lastStrike = ctx.lastStrikeTime.get(userId) ?? 0;
			if (
				now - lastStrike > HACHI_ANTICHEAT_STRIKE_DECAY &&
				(ctx.strikes.get(userId) ?? 0) > 0
			) {
				ctx.strikes.set(userId, 0);
			}
			continue;
		}

		// Speed violation (1 strike)
		const currentStrikes = (ctx.strikes.get(userId) ?? 0) + 1;
		ctx.strikes.set(userId, currentStrikes);
		ctx.lastStrikeTime.set(userId, now);

		if (currentStrikes < HACHI_ANTICHEAT_STRIKE_LIMIT) {
			warn(
				`[HachiRide] Speed warning for ${player.Name}: ${math.floor(dist)} studs in ${string.format("%.1f", elapsed)}s (strike ${currentStrikes})`,
			);
			ctx.lastPositions.set(userId, lastPos);
		} else {
			warn(
				`[HachiRide] Snapback for ${player.Name}: ${math.floor(dist)} studs in ${string.format("%.1f", elapsed)}s (strike ${currentStrikes})`,
			);
			player.Character?.PivotTo(new CFrame(lastPos));
			if (hrp) hrp.AssemblyLinearVelocity = Vector3.zero;
			ctx.lastPositions.set(userId, lastPos);
		}
	}

	return now;
}
