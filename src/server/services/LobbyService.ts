import { OnStart, Service } from "@flamework/core";
import { CollectionService, Players, Workspace } from "@rbxts/services";
import {
	CAN_KICK_PORTAL_TAG,
	CHARACTER_SCALE,
	DEFAULT_JUMP_HEIGHT,
	DEFAULT_WALK_SPEED,
	HACHI_RIDE_PORTAL_TAG,
	SCRAMBLE_PORTAL_TAG,
} from "shared/constants";
import {
	L_HINT_STARTING_CAN_KICK,
	L_HINT_STARTING_HACHI_RIDE,
	L_HINT_STARTING_SCRAMBLE,
} from "shared/localization/keys";
import { GlobalEvents } from "shared/network";
import { MinigameId } from "shared/types";
import { CooldownTracker } from "../utils/cooldown";
import { forceUnmount } from "../utils/hachiCostume";
import { safeHandler } from "../utils/safeConnect";
import { HachiAbilityService } from "./HachiAbilityService";

const LOBBY_SPAWN_TAG = "LobbySpawn";

@Service()
export class LobbyService implements OnStart {
	private lobbySpawns: BasePart[] = [];
	private readonly serverEvents = GlobalEvents.createServer({});
	private matchActive = false;
	private onStartRequested?: (minigameId: MinigameId) => void;

	constructor(private readonly hachiAbilityService: HachiAbilityService) {}

	setOnStartRequested(cb: (minigameId: MinigameId) => void) {
		this.onStartRequested = cb;
	}

	setMatchActive(active: boolean) {
		this.matchActive = active;
		this.hachiAbilityService.setMatchActive(active);
	}

	setMatchOni(userId: number) {
		this.hachiAbilityService.setMatchOni(userId);
	}

	onStart() {
		print("[LobbyService] Started");

		this.lobbySpawns = CollectionService.GetTagged(LOBBY_SPAWN_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);
		print(`[LobbyService] Found ${this.lobbySpawns.size()} lobby spawns`);

		Players.PlayerAdded.Connect((player) => {
			player.CharacterAdded.Connect((character) => {
				task.wait(0.5);
				// Clear stale Hachi mount state from previous life (e.g. died while riding)
				forceUnmount(player, true);
				const humanoid = character.WaitForChild("Humanoid") as Humanoid;
				humanoid.WalkSpeed = DEFAULT_WALK_SPEED;
				humanoid.UseJumpPower = false;
				humanoid.JumpHeight = DEFAULT_JUMP_HEIGHT;
				const scaleNames = [
					"BodyHeightScale",
					"BodyWidthScale",
					"BodyDepthScale",
					"HeadScale",
				];
				for (const name of scaleNames) {
					const nv = humanoid.WaitForChild(name, 2) as NumberValue | undefined;
					if (nv) nv.Value = CHARACTER_SCALE;
				}
				if (this.matchActive) return;
				if (player.Character) {
					this.teleportToLobby(player);
				}
			});
		});

		Players.PlayerRemoving.Connect((player) => {
			this.startRequestCooldowns.reset(player.UserId);
		});

		this.setupPortals();
		this.setupHachiRidePortal();
		this.setupMinigameStartRequest();
	}

	private setupHachiRidePortal() {
		const portals = CollectionService.GetTagged(HACHI_RIDE_PORTAL_TAG);
		for (const portal of portals) {
			if (!portal.IsA("BasePart")) continue;
			portal.FindFirstChildOfClass("ProximityPrompt")?.Triggered.Connect(() => {
				if (!this.onStartRequested) {
					warn(
						"[LobbyService] HachiRide portal triggered before onStartRequested registered",
					);
					return;
				}
				this.serverEvents.hintTextChanged.broadcast(L_HINT_STARTING_HACHI_RIDE);
				this.onStartRequested(MinigameId.HachiRide);
			});
		}
		print(`[LobbyService] Set up ${portals.size()} Hachi Ride portals`);
	}

	private readonly startRequestCooldowns = new CooldownTracker();

	private setupMinigameStartRequest() {
		const validIds = new Set<string>([
			MinigameId.CanKick,
			MinigameId.ShibuyaScramble,
			MinigameId.HachiRide,
		]);
		this.serverEvents.requestMinigameStart.connect(
			safeHandler("LobbyService.requestMinigameStart", (player, minigameId) => {
				if (this.matchActive) return;
				if (!this.onStartRequested) return;
				if (!validIds.has(minigameId as string)) return;
				if (!this.startRequestCooldowns.check(player.UserId, 3)) return;
				this.onStartRequested(minigameId);
			}),
		);
	}

	private setupPortals() {
		const portals = CollectionService.GetTagged(CAN_KICK_PORTAL_TAG);
		for (const portal of portals) {
			if (!portal.IsA("BasePart")) continue;
			const prompt = portal.FindFirstChildOfClass("ProximityPrompt");
			if (!prompt) continue;
			prompt.Triggered.Connect(() => {
				if (!this.onStartRequested) {
					warn(
						"[LobbyService] CanKick portal triggered before onStartRequested registered",
					);
					return;
				}
				this.serverEvents.hintTextChanged.broadcast(L_HINT_STARTING_CAN_KICK);
				this.onStartRequested(MinigameId.CanKick);
			});
		}
		print(`[LobbyService] Set up ${portals.size()} Can Kick portals`);

		const scramblePortals = CollectionService.GetTagged(SCRAMBLE_PORTAL_TAG);
		for (const portal of scramblePortals) {
			if (!portal.IsA("BasePart")) continue;
			portal.FindFirstChildOfClass("ProximityPrompt")?.Triggered.Connect(() => {
				if (!this.onStartRequested) {
					warn(
						"[LobbyService] Scramble portal triggered before onStartRequested registered",
					);
					return;
				}
				this.serverEvents.hintTextChanged.broadcast(L_HINT_STARTING_SCRAMBLE);
				this.onStartRequested(MinigameId.ShibuyaScramble);
			});
		}
		print(`[LobbyService] Set up ${scramblePortals.size()} Scramble portals`);
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
			const spawn = Workspace.FindFirstChildWhichIsA("SpawnLocation");
			if (spawn) {
				character.PivotTo(spawn.CFrame.add(new Vector3(0, 3, 0)));
				print(
					`[LobbyService] ${player.Name} teleported to lobby (fallback spawn)`,
				);
			} else {
				warn(`[LobbyService] No spawn found for ${player.Name}`);
			}
		}
	}

	teleportToMatchArea(player: Player, position: Vector3) {
		const character = player.Character;
		if (!character) return;
		character.PivotTo(new CFrame(position));
	}
}
