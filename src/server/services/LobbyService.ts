import { OnStart, Service } from "@flamework/core";
import { CollectionService, Players, Workspace } from "@rbxts/services";
import {
	CAN_KICK_PORTAL_TAG,
	HACHI_RIDE_PORTAL_TAG,
	HACHI_RIDE_TAG,
	HACHI_SLIDE_FORCE_RESTORE_DELAY,
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

@Service()
export class LobbyService implements OnStart {
	private lobbySpawns: BasePart[] = [];
	private readonly serverEvents = GlobalEvents.createServer({});
	private readonly slideCooldowns = new Map<number, number>();
	private readonly tpCooldowns = new Map<number, number>();
	private readonly hachiSlideActive = new Set<number>();
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
			this.hachiSlideActive.delete(player.UserId);
		});

		this.setupPortals();
		this.setupHachiRide();
		this.setupHachiRidePortal();
		this.setupRooftopTPs();
		this.setupHachiSlideHandler();
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
			// Validate direction: reject NaN (fails > 0), zero, and Infinity (>= math.huge).
			const mag = dir.Magnitude;
			if (!(mag > 0 && mag < math.huge)) return;
			const safeDir = dir.Unit;

			// Rate-limit: reuse slideCooldowns; prevents rapid-fire requests and the
			// MaxForce race condition (second call can't arrive before restore fires).
			const now = os.clock();
			if (
				now - (this.slideCooldowns.get(player.UserId) ?? 0) <
				SCRAMBLE_SLIDE_COOLDOWN
			)
				return;
			this.slideCooldowns.set(player.UserId, now);

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
				// Guard against in-flight restore overwriting origForce.
				if (this.hachiSlideActive.has(player.UserId)) return;
				this.hachiSlideActive.add(player.UserId);
				const origForce = bv.MaxForce;
				bv.MaxForce = Vector3.zero;
				body.AssemblyLinearVelocity = safeDir.mul(SCRAMBLE_SLIDE_SPEED);
				task.delay(HACHI_SLIDE_FORCE_RESTORE_DELAY, () => {
					if (bv.Parent) bv.MaxForce = origForce;
					this.hachiSlideActive.delete(player.UserId);
				});
			} else {
				body.AssemblyLinearVelocity = safeDir.mul(SCRAMBLE_SLIDE_SPEED);
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
