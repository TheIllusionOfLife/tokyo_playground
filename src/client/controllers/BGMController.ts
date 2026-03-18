import { Controller, OnStart } from "@flamework/core";
import { SoundService } from "@rbxts/services";
import { clientEvents } from "client/network";
import {
	BGM_TRACK_ID,
	SE_BONUS_PICKUP,
	SE_EVOLVE,
	SE_ITEM_PICKUP,
} from "shared/constants";

@Controller()
export class BGMController implements OnStart {
	private bgm!: Sound;
	private readonly seCache = new Map<string, Sound>();
	private bonusThisFrame = false;

	onStart() {
		this.bgm = new Instance("Sound");
		this.bgm.SoundId = BGM_TRACK_ID;
		this.bgm.Looped = true;
		this.bgm.Volume = 0.05;
		this.bgm.Parent = SoundService;
		this.bgm.Play();

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
	}

	private playSE(id: string, volume: number) {
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
