import { ServerStorage } from "@rbxts/services";
import { VEHICLE_CATALOG } from "shared/constants";
import { VehicleId } from "shared/types";

/**
 * Resolve the vehicle template Model from ServerStorage for a given VehicleId.
 * Falls back to DefaultHachi if the requested template is missing.
 */
export function getVehicleTemplate(vehicleId: VehicleId): Model | undefined {
	const def = VEHICLE_CATALOG.find((v) => v.id === vehicleId);
	if (!def) return undefined;

	const template = ServerStorage.FindFirstChild(def.templateName);
	if (template?.IsA("Model")) return template;

	// Fallback to DefaultHachi if the specific template is missing
	if (vehicleId !== VehicleId.DefaultHachi) {
		warn(
			`[vehicleTemplate] Missing ${def.templateName}, falling back to HachiTemplate`,
		);
		const fallback = ServerStorage.FindFirstChild("HachiTemplate");
		if (fallback?.IsA("Model")) return fallback;
	}

	return undefined;
}
