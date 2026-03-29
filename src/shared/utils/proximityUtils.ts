/**
 * Shared proximity math used by BoundaryService and ZoneController.
 */

/** Check if an XZ point is inside an axis-aligned bounding box (ignores Y). */
export function isInsideAABB_XZ(
	point: Vector3,
	aabbMin: Vector3,
	aabbMax: Vector3,
): boolean {
	return (
		point.X >= aabbMin.X &&
		point.X <= aabbMax.X &&
		point.Z >= aabbMin.Z &&
		point.Z <= aabbMax.Z
	);
}

/**
 * Compute how close a point is to the AABB edge, as a ratio 0..1.
 * 0 = at center, 1 = at or beyond edge. Uses XZ plane only.
 */
export function edgeRatio_XZ(
	point: Vector3,
	aabbMin: Vector3,
	aabbMax: Vector3,
): number {
	const centerX = (aabbMin.X + aabbMax.X) / 2;
	const centerZ = (aabbMin.Z + aabbMax.Z) / 2;
	const halfX = (aabbMax.X - aabbMin.X) / 2;
	const halfZ = (aabbMax.Z - aabbMin.Z) / 2;
	if (halfX <= 0 || halfZ <= 0) return 1;
	const dx = math.abs(point.X - centerX) / halfX;
	const dz = math.abs(point.Z - centerZ) / halfZ;
	return math.max(dx, dz);
}

/** Squared distance between two points in XZ plane. */
export function squaredDistXZ(a: Vector3, b: Vector3): number {
	const dx = a.X - b.X;
	const dz = a.Z - b.Z;
	return dx * dx + dz * dz;
}
