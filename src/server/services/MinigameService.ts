import { OnStart, Service } from "@flamework/core";

@Service()
export class MinigameService implements OnStart {
	onStart() {
		print("[MinigameService] Started (stub)");
	}
}
