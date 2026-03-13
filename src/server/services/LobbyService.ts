import { OnStart, Service } from "@flamework/core";
import { CollectionService, Players, Workspace } from "@rbxts/services";
import { CAN_KICK_PORTAL_TAG, SCRAMBLE_PORTAL_TAG } from "shared/constants";
import { GlobalEvents } from "shared/network";

const LOBBY_SPAWN_TAG = "LobbySpawn";

@Service()
export class LobbyService implements OnStart {
	private lobbySpawns: BasePart[] = [];
	private readonly serverEvents = GlobalEvents.createServer({});

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
