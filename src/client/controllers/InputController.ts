import { Controller, OnStart } from "@flamework/core";

@Controller()
export class InputController implements OnStart {
	onStart() {
		print("[InputController] Started (stub)");
	}
}
