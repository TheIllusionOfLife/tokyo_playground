import { Controller, OnStart } from "@flamework/core";
import { SoundService } from "@rbxts/services";
import { clientEvents } from "client/network";
import { BGM_TRACK_ID, SE_EVOLVE, SE_ITEM_PICKUP } from "shared/constants";

@Controller()
export class BGMController implements OnStart {
	private bgm!: Sound;
	private readonly seCache = new Map<string, Sound>();

	onStart() {
		this.bgm = new Instance("Sound");
		this.bgm.SoundId = BGM_TRACK_ID;
		this.bgm.Looped = true;
		this.bgm.Volume = 0.05;
		this.bgm.Parent = SoundService;
		this.bgm.Play();

		clientEvents.hachiItemCollected.connect(() => this.playSE(SE_ITEM_PICKUP));
		clientEvents.hachiEvolved.connect(() => this.playSE(SE_EVOLVE));
	}

	private playSE(id: string) {
		let s = this.seCache.get(id);
		if (!s) {
			s = new Instance("Sound");
			s.SoundId = id;
			s.Volume = 0.6;
			s.Parent = SoundService;
			this.seCache.set(id, s);
		}
		s.Play();
	}
}
