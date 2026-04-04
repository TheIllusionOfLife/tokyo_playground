import { Controller, OnStart } from "@flamework/core";
import {
	ContentProvider,
	ReplicatedStorage,
	SoundService,
	TweenService,
} from "@rbxts/services";
import { clientEvents } from "client/network";
import {
	BGM_TRACK_ID,
	SE_AMBIENT_CITY,
	SE_BONUS_PICKUP,
	SE_CATCH,
	SE_CHEER,
	SE_EVOLVE,
	SE_ITEM_PICKUP,
	SE_TICK,
} from "shared/constants";
import { MatchPhase } from "shared/types";
import { getAmbientVolumeForPhase } from "shared/utils/ambientAudio";

@Controller()
export class BGMController implements OnStart {
	private bgm!: Sound;
	private ambient!: Sound;
	private readonly seCache = new Map<string, Sound>();
	private bonusThisFrame = false;
	private ambientFadeTween?: Tween;

	onStart() {
		// Create sounds but start silent (wait for loading screen to finish)
		this.bgm = new Instance("Sound");
		this.bgm.SoundId = BGM_TRACK_ID;
		this.bgm.Looped = true;
		this.bgm.Volume = 0;
		this.bgm.Parent = SoundService;

		// Ambient city hum — constant low atmosphere
		this.ambient = new Instance("Sound");
		this.ambient.SoundId = SE_AMBIENT_CITY;
		this.ambient.Looped = true;
		this.ambient.Volume = 0;
		this.ambient.Parent = SoundService;

		// Wait for loading screen completion (BoolValue is race-condition safe)
		const loadingDone = ReplicatedStorage.WaitForChild("LoadingDone", 20) as
			| BoolValue
			| undefined;
		if (loadingDone && !loadingDone.Value) {
			loadingDone.GetPropertyChangedSignal("Value").Wait();
		}

		// Fade in BGM and ambient over 2 seconds
		this.bgm.Play();
		TweenService.Create(this.bgm, new TweenInfo(2), { Volume: 0.05 }).Play();
		this.ambient.Play();
		this.ambientFadeTween = TweenService.Create(
			this.ambient,
			new TweenInfo(2),
			{
				Volume: 0.03,
			},
		);
		this.ambientFadeTween.Play();

		// Pre-populate SE cache and preload assets to avoid first-play silence
		const seIds = [
			SE_ITEM_PICKUP,
			SE_BONUS_PICKUP,
			SE_EVOLVE,
			SE_CATCH,
			SE_CHEER,
			SE_TICK,
		];
		const toPreload: Sound[] = [];
		for (const id of seIds) {
			const s = new Instance("Sound");
			s.SoundId = id;
			s.Parent = SoundService;
			this.seCache.set(id, s);
			toPreload.push(s);
		}
		task.spawn(() => ContentProvider.PreloadAsync(toPreload));

		// Fade ambient during active matches and stop all SFX on return to lobby
		clientEvents.matchPhaseChanged.connect((phase) => {
			this.ambientFadeTween?.Cancel();
			this.ambient.Volume = getAmbientVolumeForPhase(phase);
			if (phase === MatchPhase.WaitingForPlayers) {
				this.stopAllSE();
			}
		});
		clientEvents.matchSnapshot.connect((phase) => {
			this.ambientFadeTween?.Cancel();
			this.ambient.Volume = getAmbientVolumeForPhase(phase);
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

		// Countdown tick in last 30s
		clientEvents.roundTimerUpdate.connect((timeRemaining) => {
			if (timeRemaining <= 0) return;
			if (timeRemaining <= 30) {
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
		// Stop any in-progress playback before restarting (prevents long-asset overlap)
		if (s.IsPlaying) s.Stop();
		s.Play();
	}

	private stopAllSE() {
		for (const [, s] of this.seCache) {
			if (s.IsPlaying) s.Stop();
		}
	}
}
