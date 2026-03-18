interface Point3Like {
	X: number;
	Y: number;
	Z: number;
}

const JAIL_RATTLE_PADDING = {
	X: 2,
	Y: 4,
	Z: 2,
} as const;

export function isInsideJailRattleZone(
	localPosition: Point3Like,
	halfSize: Point3Like,
): boolean {
	return (
		math.abs(localPosition.X) <= halfSize.X + JAIL_RATTLE_PADDING.X &&
		math.abs(localPosition.Y) <= halfSize.Y + JAIL_RATTLE_PADDING.Y &&
		math.abs(localPosition.Z) <= halfSize.Z + JAIL_RATTLE_PADDING.Z
	);
}
