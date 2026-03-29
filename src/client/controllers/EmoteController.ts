import { Controller, OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";
import { CELEBRATION_EFFECTS } from "shared/constants";
import { GlobalEvents } from "shared/network";
import { ItemId } from "shared/types";

@Controller()
export class EmoteController implements OnStart {
	private readonly clientEvents = GlobalEvents.createClient({});

	onStart() {
		this.clientEvents.emoteTriggered.connect((playerId, itemIdStr) => {
			this.playEffect(playerId, itemIdStr as ItemId);
		});
	}

	private playEffect(playerId: number, itemId: ItemId) {
		const effectData = CELEBRATION_EFFECTS[itemId];
		if (!effectData) return;

		const player = Players.GetPlayerByUserId(playerId);
		if (!player) return;
		const character = player.Character;
		if (!character) return;
		const hrp = character.FindFirstChild("HumanoidRootPart") as
			| BasePart
			| undefined;
		if (!hrp) return;

		const emitter = new Instance("ParticleEmitter");
		emitter.Rate = effectData.particleRate;
		emitter.Lifetime = effectData.particleLifetime;
		emitter.Speed = effectData.particleSpeed;
		emitter.SpreadAngle = effectData.particleSpreadAngle;
		emitter.Color = effectData.particleColor;
		emitter.Size = effectData.particleSize;
		emitter.LightEmission = 0.5;
		emitter.Transparency = new NumberSequence(0, 1);
		emitter.Parent = hrp;

		task.delay(effectData.duration, () => {
			emitter.Enabled = false;
			task.delay(2, () => emitter.Destroy());
		});
	}
}
