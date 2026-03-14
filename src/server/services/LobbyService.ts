import { OnStart, Service } from "@flamework/core";
import { CollectionService, Players, Workspace } from "@rbxts/services";
import {
	CAN_KICK_PORTAL_TAG,
	SCRAMBLE_PORTAL_TAG,
	SCRAMBLE_ROOFTOP_TP_COOLDOWN,
	SCRAMBLE_ROOFTOP_TP_DEST,
	SCRAMBLE_ROOFTOP_TP_TAG,
	SCRAMBLE_SLIDE_COOLDOWN,
	SCRAMBLE_SLIDE_SPEED,
} from "shared/constants";
import { GlobalEvents } from "shared/network";

const LOBBY_SPAWN_TAG = "LobbySpawn";
const SLIDE_RAMP_TAG = "ShibuyaSlideRamp";

@Service()
export class LobbyService implements OnStart {
	private lobbySpawns: BasePart[] = [];
	private readonly serverEvents = GlobalEvents.createServer({});
	private readonly slideCooldowns = new Map<number, number>();
	private readonly tpCooldowns = new Map<number, number>();

	onStart() {
		print("[LobbyService] Started");

		this.lobbySpawns = CollectionService.GetTagged(LOBBY_SPAWN_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);
		print(`[LobbyService] Found ${this.lobbySpawns.size()} lobby spawns`);

		Players.PlayerAdded.Connect((player) => {
			player.CharacterAdded.Connect(() => {
				// Small delay to let character load
				task.wait(0.5);
				if (player.Character) {
					this.teleportToLobby(player);
				}
			});
		});

		this.setupPortals();
		this.setupHachiRide();
		this.setupSlideRamps();
		this.setupRooftopTPs();
	}

	private setupSlideRamps() {
		const ramps = CollectionService.GetTagged(SLIDE_RAMP_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);
		for (const ramp of ramps) {
			ramp.Touched.Connect((touching) => {
				const character = touching.Parent;
				if (!character) return;
				const player = Players.GetPlayerFromCharacter(character as Model);
				if (!player) return;

				const now = os.clock();
				if (
					now - (this.slideCooldowns.get(player.UserId) ?? 0) <
					SCRAMBLE_SLIDE_COOLDOWN
				)
					return;
				this.slideCooldowns.set(player.UserId, now);

				const hrp = character.FindFirstChild("HumanoidRootPart") as
					| BasePart
					| undefined;
				if (!hrp) return;

				const dir = ramp.CFrame.LookVector.add(new Vector3(0, -0.4, 0)).Unit;
				hrp.AssemblyLinearVelocity = dir.mul(SCRAMBLE_SLIDE_SPEED);
			});
		}
		print(`[LobbyService] Connected ${ramps.size()} slide ramps (always-on)`);
	}

	private setupRooftopTPs() {
		const pads = CollectionService.GetTagged(SCRAMBLE_ROOFTOP_TP_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);
		for (const pad of pads) {
			pad.Touched.Connect((touching) => {
				const character = touching.Parent;
				if (!character) return;
				const player = Players.GetPlayerFromCharacter(character as Model);
				if (!player) return;

				const now = os.clock();
				if (
					now - (this.tpCooldowns.get(player.UserId) ?? 0) <
					SCRAMBLE_ROOFTOP_TP_COOLDOWN
				)
					return;
				this.tpCooldowns.set(player.UserId, now);

				player.Character?.PivotTo(new CFrame(SCRAMBLE_ROOFTOP_TP_DEST));
				this.serverEvents.hintTextChanged.fire(
					player,
					`${player.Name} flew to the rooftop!`,
				);
			});
		}
		print(
			`[LobbyService] Connected ${pads.size()} rooftop TP pads (always-on)`,
		);
	}

	private setupHachiRide() {
		for (const hachi of CollectionService.GetTagged("HachiRide")) {
			const seat = (hachi as Model).FindFirstChild("VehicleSeat") as
				| VehicleSeat
				| undefined;
			if (!seat) continue;

			seat.GetPropertyChangedSignal("Occupant").Connect(() => {
				if (!seat.Occupant) return;
				const player = Players.GetPlayerFromCharacter(
					seat.Occupant.Parent as Model,
				);
				if (player) {
					this.serverEvents.hintTextChanged.fire(
						player,
						"WASD / arrow keys to drive ハチ公!",
					);
				}
			});
		}
	}

	private setupPortals() {
		const portals = CollectionService.GetTagged(CAN_KICK_PORTAL_TAG);
		for (const portal of portals) {
			if (!portal.IsA("BasePart")) continue;
			const prompt = portal.FindFirstChildOfClass("ProximityPrompt");
			if (!prompt) continue;
			prompt.Triggered.Connect((player: Player) => {
				this.serverEvents.hintTextChanged.fire(
					player,
					"Joining Can Kick queue…",
				);
			});
		}
		print(`[LobbyService] Set up ${portals.size()} Can Kick portals`);

		for (const portal of CollectionService.GetTagged(SCRAMBLE_PORTAL_TAG)) {
			if (!portal.IsA("BasePart")) continue;
			portal
				.FindFirstChildOfClass("ProximityPrompt")
				?.Triggered.Connect((player: Player) => {
					this.serverEvents.hintTextChanged.fire(
						player,
						"Shibuya Scramble starts next round!",
					);
				});
		}
	}

	teleportToLobby(player: Player) {
		const character = player.Character;
		if (!character) return;

		if (this.lobbySpawns.size() > 0) {
			const spawn =
				this.lobbySpawns[math.random(0, this.lobbySpawns.size() - 1)];
			character.PivotTo(spawn.CFrame.add(new Vector3(0, 3, 0)));
			print(`[LobbyService] ${player.Name} teleported to lobby`);
		} else {
			// Fallback: use first SpawnLocation in Workspace
			const spawn = Workspace.FindFirstChildWhichIsA("SpawnLocation");
			if (spawn) {
				character.PivotTo(spawn.CFrame.add(new Vector3(0, 3, 0)));
				print(
					`[LobbyService] ${player.Name} teleported to lobby (fallback spawn)`,
				);
			} else {
				print(`[LobbyService] Warning: no spawn found for ${player.Name}`);
			}
		}
	}

	teleportToMatchArea(player: Player, position: Vector3) {
		const character = player.Character;
		if (!character) return;
		character.PivotTo(new CFrame(position));
	}
}
