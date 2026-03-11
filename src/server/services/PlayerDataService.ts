import { OnStart, Service } from "@flamework/core";
import ProfileService from "@rbxts/profileservice";
import { Profile } from "@rbxts/profileservice/globals";
import { Players } from "@rbxts/services";
import { DEFAULT_PLAYER_DATA, PlayerData } from "shared/types";

const PROFILE_STORE_KEY = "PlayerData_v1";

@Service()
export class PlayerDataService implements OnStart {
	private profileStore = ProfileService.GetProfileStore(
		PROFILE_STORE_KEY,
		DEFAULT_PLAYER_DATA,
	);
	private profiles = new Map<Player, Profile<PlayerData>>();

	onStart() {
		print("[PlayerDataService] Started");

		Players.PlayerAdded.Connect((player) => this.onPlayerAdded(player));
		Players.PlayerRemoving.Connect((player) => this.onPlayerRemoving(player));

		// Handle players already in-game (Studio fast-start)
		for (const player of Players.GetPlayers()) {
			task.spawn(() => this.onPlayerAdded(player));
		}

		// Release all profiles on server shutdown to prevent data loss
		game.BindToClose(() => {
			for (const [, profile] of this.profiles) {
				profile.Release();
			}
		});
	}

	private onPlayerAdded(player: Player) {
		const profileKey = `Player_${player.UserId}`;
		const profile = this.profileStore.LoadProfileAsync(profileKey);

		if (profile === undefined) {
			print(`[PlayerDataService] Failed to load profile for ${player.Name}`);
			player.Kick("Failed to load your data. Please rejoin.");
			return;
		}

		profile.AddUserId(player.UserId);
		profile.Reconcile();

		profile.ListenToRelease(() => {
			this.profiles.delete(player);
			player.Kick("Your data was loaded on another server. Please rejoin.");
		});

		if (!player.IsDescendantOf(Players)) {
			profile.Release();
			return;
		}

		this.profiles.set(player, profile);
		print(
			`[PlayerDataService] Loaded profile for ${player.Name}: ${profile.Data.coins} coins`,
		);
	}

	private onPlayerRemoving(player: Player) {
		const profile = this.profiles.get(player);
		if (profile) {
			profile.Release();
			this.profiles.delete(player);
			print(`[PlayerDataService] Released profile for ${player.Name}`);
		}
	}

	getPlayerData(player: Player): PlayerData | undefined {
		return this.profiles.get(player)?.Data;
	}

	getCoins(player: Player): number {
		return this.profiles.get(player)?.Data.coins ?? 0;
	}

	addCoins(player: Player, amount: number) {
		const profile = this.profiles.get(player);
		if (profile) {
			profile.Data.coins += amount;
			print(
				`[PlayerDataService] ${player.Name} +${amount} coins (total: ${profile.Data.coins})`,
			);
		}
	}

	incrementGamesPlayed(player: Player) {
		const profile = this.profiles.get(player);
		if (profile) {
			profile.Data.gamesPlayed += 1;
		}
	}
}
