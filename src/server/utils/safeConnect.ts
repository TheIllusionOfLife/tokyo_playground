/**
 * Wraps a Flamework remote event handler in pcall to prevent a single
 * error from silently breaking the connection for all future events.
 */
export function safeHandler<A extends unknown[]>(
	label: string,
	handler: (...args: A) => void,
): (...args: A) => void {
	return (...args: A) => {
		const [ok, err] = pcall(() => handler(...args));
		if (!ok) {
			warn(`[${label}] Remote handler error: ${err}`);
		}
	};
}
