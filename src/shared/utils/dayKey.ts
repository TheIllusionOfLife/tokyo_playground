/** Returns the current UTC day as an integer. Single source of truth for daily reset boundaries. */
export function getCurrentDay(): number {
	return math.floor(os.time() / 86400);
}
