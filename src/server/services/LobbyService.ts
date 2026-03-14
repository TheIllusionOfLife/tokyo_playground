import { OnStart, Service } from "@flamework/core";
import { CollectionService, Players, Workspace } from "@rbxts/services";
import {
	CAN_KICK_PORTAL_TAG,
	HACHI_RIDE_PORTAL_TAG,
	HACHI_RIDE_TAG,
	SCRAMBLE_PORTAL_TAG,
	SCRAMBLE_ROOFTOP_TP_COOLDOWN,
	SCRAMBLE_ROOFTOP_TP_DEST,
	SCRAMBLE_ROOFTOP_TP_TAG,
	SCRAMBLE_SLIDE_COOLDOWN,
	SCRAMBLE_SLIDE_SPEED,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import { MinigameId } from "shared/types";

const LOBBY_SPAWN_TAG = "LobbySpawn";
const SLIDE_RAMP_TAG = "ShibuyaSlideRamp";

@Service()
export class LobbyService implements OnStart {
	private lobbySpawns: BasePart[] = [];
	private readonly serverEvents = GlobalEvents.createServer({});
	private readonly slideCooldowns = new Map<number, number>();
	private readonly tpCooldowns = new Map<number, number>();
	private matchActive = false;
	private onStartRequested?: (minigameId: MinigameId) => void;

	/** Registered by MatchService to avoid circular DI. */
	setOnStartRequested(cb: (minigameId: MinigameId) => void) {
		this.onStartRequested = cb;
	}

	/** Called by MatchService when a match starts/ends to disable lobby-level handlers. */
	setMatchActive(active: boolean) {
		this.matchActive = active;
	}

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
				if (this.matchActive) return;
				if (player.Character) {
					this.teleportToLobby(player);
				}
			});
		});

		Players.PlayerRemoving.Connect((player) => {
			this.slideCooldowns.delete(player.UserId);
			this.tpCooldowns.delete(player.UserId);
		});

		this.setupPortals();
		this.setupHachiRide();
		this.setupHachiRidePortal();
		this.setupSlideRamps();
		this.setupRooftopTPs();
		this.setupHachiSlideHandler();
	}

	private setupSlideRamps() {
		const ramps = CollectionService.GetTagged(SLIDE_RAMP_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);
		for (const ramp of ramps) {
			ramp.Touched.Connect((touching) => {
				const character = touching.FindFirstAncestorOfClass("Model");
				if (!character) return;
				const player = Players.GetPlayerFromCharacter(character);
				if (!player) return;

				const now = os.clock();
				if (
					now - (this.slideCooldowns.get(player.UserId) ?? 0) <
					SCRAMBLE_SLIDE_COOLDOWN
				)
					return;
				this.slideCooldowns.set(player.UserId, now);

				const dir = ramp.CFrame.LookVector.add(new Vector3(0, -0.4, 0)).Unit;
				// Fire to client — only the client can reliably set
				// AssemblyLinearVelocity on its own character assembly.
				this.serverEvents.slideImpulse.fire(player, dir);
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
				if (this.matchActive) return;
				const character = touching.FindFirstAncestorOfClass("Model");
				if (!character) return;
				const player = Players.GetPlayerFromCharacter(character);
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

	private setupHachiRidePortal() {
		const portals = CollectionService.GetTagged(HACHI_RIDE_PORTAL_TAG);
		for (const portal of portals) {
			if (!portal.IsA("BasePart")) continue;
			portal
				.FindFirstChildOfClass("ProximityPrompt")
				?.Triggered.Connect((_player: Player) => {
					if (!this.onStartRequested) {
						warn(
							"[LobbyService] HachiRide portal triggered before onStartRequested registered",
						);
						return;
					}
					this.onStartRequested(MinigameId.HachiRide);
				});
		}
		print(`[LobbyService] Set up ${portals.size()} Hachi Ride portals`);
	}

	private setupHachiRide() {
		for (const hachi of CollectionService.GetTagged(HACHI_RIDE_TAG)) {
			const seat = (hachi as Model).FindFirstChild("VehicleSeat") as
				| VehicleSeat
				| undefined;
			if (!seat) continue;

			seat.GetPropertyChangedSignal("Occupant").Connect(() => {
				const occupant = seat.Occupant;
				if (!occupant) return;
				const character = occupant.FindFirstAncestorOfClass("Model");
				if (!character) return;
				const player = Players.GetPlayerFromCharacter(character);
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

		const scramblePortals = CollectionService.GetTagged(SCRAMBLE_PORTAL_TAG);
		for (const portal of scramblePortals) {
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
		print(`[LobbyService] Set up ${scramblePortals.size()} Scramble portals`);
	}

	private setupHachiSlideHandler() {
		this.serverEvents.requestHachiSlide.connect((player, dir) => {
			const character = player.Character;
			if (!character) return;
			const humanoid = character.FindFirstChildOfClass("Humanoid");
			const seatPart = humanoid?.SeatPart;
			if (!seatPart) return;
			const hachiModel = seatPart.Parent;
			if (!hachiModel) return;
			const body = hachiModel.FindFirstChild("Body") as BasePart | undefined;
			if (!body) return;

			const bv = body.FindFirstChildOfClass("BodyVelocity");
			if (bv) {
				// Temporarily zero MaxForce so our impulse isn't cancelled
				const origForce = bv.MaxForce;
				bv.MaxForce = new Vector3(0, 0, 0);
				body.AssemblyLinearVelocity = dir.mul(SCRAMBLE_SLIDE_SPEED);
				task.delay(0.5, () => {
					if (bv.Parent) bv.MaxForce = origForce;
				});
			} else {
				body.AssemblyLinearVelocity = dir.mul(SCRAMBLE_SLIDE_SPEED);
			}
		});
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
