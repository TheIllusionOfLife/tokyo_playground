/**
 * Reusable cooldown tracker. Replaces the repeated Map<K, number> + os.clock()
 * pattern used across 14+ call sites in server services.
 */
export class CooldownTracker<K = number> {
	private readonly map = new Map<K, number>();

	/** Returns true if the action is allowed (cooldown expired). Updates timestamp on success. */
	check(key: K, duration: number): boolean {
		const now = os.clock();
		const last = this.map.get(key);
		if (last !== undefined && now - last < duration) return false;
		this.map.set(key, now);
		return true;
	}

	/** Remove a single key (e.g., on player leave). */
	reset(key: K): void {
		this.map.delete(key);
	}

	/** Clear all entries (e.g., on match/minigame cleanup). */
	clear(): void {
		this.map.clear();
	}
}
