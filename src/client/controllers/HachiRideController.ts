import { Controller, OnStart } from "@flamework/core";
import {
	ContextActionService,
	Players,
	RunService,
	SoundService,
} from "@rbxts/services";
import { clientEvents } from "client/network";
import { DEFAULT_WALK_SPEED, SE_JUMP } from "shared/constants";
import { MinigameId, PlayerRole, RoundResult } from "shared/types";

const ACTION_HACHI_JUMP = "HachiJump";
const ACTION_HACHI_EJECT = "HachiEject";

@Controller()
export class HachiRideController implements OnStart {
	private active = false;
	private wasSeated = false;

	private heartbeatConn?: RBXScriptConnection;

	onStart() {
		clientEvents.roleAssigned.connect((role, minigameId) => {
			if (minigameId === MinigameId.HachiRide && role === PlayerRole.None) {
				this.activate();
			} else {
				this.deactivate();
			}
		});

		clientEvents.roundResultAnnounced.connect((_result: RoundResult) => {
			this.deactivate();
		});
	}

	private activate() {
		if (this.active) return;
		this.active = true;
		this.wasSeated = false;

		// Heartbeat: seated state transitions
		this.heartbeatConn = RunService.Heartbeat.Connect(() => {
			if (!this.active) return;
			const character = Players.LocalPlayer.Character;
			if (!character) return;
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			if (!humanoid) return;

			const seated = humanoid.Sit;
			if (seated !== this.wasSeated) {
				this.wasSeated = seated;
				if (seated) {
					this.onSeated();
				} else {
					this.onStoodUp();
				}
			}
		});
	}

	private deactivate() {
		if (!this.active) return;
		this.onStoodUp();
		this.active = false;
		this.wasSeated = false;

		this.heartbeatConn?.Disconnect();
		this.heartbeatConn = undefined;

		// Restore WalkSpeed
		const character = Players.LocalPlayer.Character;
		if (character) {
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			if (humanoid) humanoid.WalkSpeed = DEFAULT_WALK_SPEED;
		}
	}

	// Called when player sits in Hachi's VehicleSeat
	private onSeated() {
		// Space: fire hachiJump every press. Server decides regular vs double jump.
		ContextActionService.BindAction(
			ACTION_HACHI_JUMP,
			(_name, inputState, _input) => {
				if (inputState === Enum.UserInputState.Begin) {
					clientEvents.hachiJump.fire();
					this.playJumpSE();
				}
				return Enum.ContextActionResult.Sink;
			},
			false,
			Enum.KeyCode.Space,
			Enum.KeyCode.ButtonA,
		);

		// E key to dismount
		ContextActionService.BindAction(
			ACTION_HACHI_EJECT,
			(_name, inputState, _input) => {
				if (inputState === Enum.UserInputState.Begin) {
					clientEvents.hachiEject.fire();
				}
				return Enum.ContextActionResult.Sink;
			},
			false,
			Enum.KeyCode.E,
		);
	}

	// Called when player stands up (or deactivate is called)
	private onStoodUp() {
		ContextActionService.UnbindAction(ACTION_HACHI_JUMP);
		ContextActionService.UnbindAction(ACTION_HACHI_EJECT);
	}

	private jumpSE?: Sound;

	private lastJumpSETime = 0;

	private playJumpSE() {
		const now = os.clock();
		if (now - this.lastJumpSETime < 0.3) return;
		this.lastJumpSETime = now;
		if (!this.jumpSE) {
			this.jumpSE = new Instance("Sound");
			this.jumpSE.SoundId = SE_JUMP;
			this.jumpSE.Volume = 0.4;
			this.jumpSE.Parent = SoundService;
		}
		this.jumpSE.Play();
	}
}
