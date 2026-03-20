import { Controller, OnStart } from "@flamework/core";
import { SoundService, TweenService } from "@rbxts/services";
import { SE_AMBIENT_CITY } from "shared/constants";
import { gameStore } from "shared/store/game-store";
import { TimePhase } from "shared/types";

/**
 * Layered ambient city sounds that shift with TimePhase.
 * Crossfades between layers on phase change.
 */
@Controller()
export class AmbientAudioController implements OnStart {
	private currentSound?: Sound;
	private currentPhase?: TimePhase;

	onStart() {
		// Subscribe to time phase changes
		gameStore.subscribe(
			(state) => state.timePhase,
			(phase) => {
				if (phase === this.currentPhase) return;
				this.currentPhase = phase;
				this.crossfadeToPhase(phase);
			},
		);

		// Start with base city ambience
		this.playAmbient(SE_AMBIENT_CITY, 0.3);
	}

	private crossfadeToPhase(phase: TimePhase) {
		// Adjust volume based on time of day
		const volume = phase === TimePhase.Night ? 0.15 : 0.3;
		if (this.currentSound) {
			TweenService.Create(
				this.currentSound,
				new TweenInfo(2, Enum.EasingStyle.Linear),
				{ Volume: volume },
			).Play();
		}
	}

	private playAmbient(soundId: string, volume: number) {
		const sound = new Instance("Sound");
		sound.SoundId = soundId;
		sound.Volume = volume;
		sound.Looped = true;
		sound.Parent = SoundService;
		sound.Play();
		this.currentSound = sound;
	}
}
