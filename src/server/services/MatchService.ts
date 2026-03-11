import { OnStart, Service } from "@flamework/core";

@Service()
export class MatchService implements OnStart {
	onStart() {
		print("[MatchService] Started (stub)");
	}
}
