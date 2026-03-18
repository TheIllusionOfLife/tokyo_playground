import { type QueueStatusData } from "shared/types";

export function formatQueueStatusDetail(status: QueueStatusData): string {
	if (status.autoStartEnabled) {
		return `Starting in ${status.secondsUntilStart}s • ${status.joinedPlayerCount} in server`;
	}

	return `Portal selected • ${status.joinedPlayerCount} in server`;
}
