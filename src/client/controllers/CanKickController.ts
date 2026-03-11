import { Controller, OnStart } from "@flamework/core";
import { GlobalEvents } from "shared/network";

@Controller()
export class CanKickController implements OnStart {
	private readonly events = GlobalEvents.createClient({});

	onStart() {
		print("[CanKickController] Started");

		this.events.playerCaught.connect((caughtPlayerId) => {
			print(`[CanKickController] Player ${caughtPlayerId} was caught`);
		});

		this.events.canKicked.connect((kickerPlayerId) => {
			print(`[CanKickController] Can kicked by ${kickerPlayerId}!`);
		});

		this.events.playerFreed.connect((freedPlayerIds) => {
			print(`[CanKickController] ${freedPlayerIds.size()} players freed!`);
		});

		this.events.countdownTick.connect((secondsLeft) => {
			print(`[CanKickController] Countdown: ${secondsLeft}`);
		});
	}
}
