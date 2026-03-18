import { Controller, OnStart } from "@flamework/core";
import { SoundService } from "@rbxts/services";
import { clientEvents } from "client/network";
import {
	BGM_TRACK_ID,
	SE_AMBIENT_CITY,
	SE_BONUS_PICKUP,
	SE_CATCH,
	SE_CHEER,
	SE_EVOLVE,
	SE_HEARTBEAT,
	SE_ITEM_PICKUP,
	SE_TICK,
} from "shared/constants";
import { MatchPhase } from "shared/types";

@Controller()
export class BGMController implements OnStart {
	private bgm!: Sound;
	private ambient!: Sound;
	private readonly seCache = new Map<string, Sound>();
	private bonusThisFrame = false;

	onStart() {
		this.bgm = new Instance("Sound");
		this.bgm.SoundId = BGM_TRACK_ID;
		this.bgm.Looped = true;
		this.bgm.Volume = 0.05;
		this.bgm.Parent = SoundService;
		this.bgm.Play();

		// Ambient city hum — constant low atmosphere
		this.ambient = new Instance("Sound");
		this.ambient.SoundId = SE_AMBIENT_CITY;
		this.ambient.Looped = true;
		this.ambient.Volume = 0.03;
		this.ambient.Parent = SoundService;
		this.ambient.Play();

		// Fade ambient during active matches
		clientEvents.matchPhaseChanged.connect((phase) => {
			this.ambient.Volume = phase === MatchPhase.InProgress ? 0.01 : 0.03;
		});

		clientEvents.hachiItemCollected.connect(() => {
			// Skip regular SE if bonus just played (both events arrive same frame)
			if (this.bonusThisFrame) return;
			this.playSE(SE_ITEM_PICKUP, 0.6);
		});
		clientEvents.hachiBonusCollected.connect(() => {
			this.bonusThisFrame = true;
			this.playSE(SE_BONUS_PICKUP, 1.0);
			// Reset flag after deferred callback (next frame)
			task.defer(() => {
				this.bonusThisFrame = false;
			});
		});
		clientEvents.hachiEvolved.connect(() => this.playSE(SE_EVOLVE, 0.8));

		clientEvents.playerCaught.connect(() => this.playSE(SE_CATCH, 0.7));
		clientEvents.canKicked.connect(() => this.playSE(SE_CHEER, 0.5));
		clientEvents.roundResultAnnounced.connect(() => this.playSE(SE_CHEER, 0.6));

		// Countdown tick: normal tick above 10s, heartbeat in last 10s
		clientEvents.roundTimerUpdate.connect((timeRemaining) => {
			if (timeRemaining <= 0) return;
			if (timeRemaining <= 10) {
				this.playSE(SE_HEARTBEAT, 0.4);
			} else if (timeRemaining <= 30) {
				this.playSE(SE_TICK, 0.3);
			}
		});
	}

	playSE(id: string, volume: number) {
		let s = this.seCache.get(id);
		if (!s) {
			s = new Instance("Sound");
			s.SoundId = id;
			s.Parent = SoundService;
			this.seCache.set(id, s);
		}
		s.Volume = volume;
		s.Play();
	}
}
