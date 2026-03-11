export type AnalyticsEvent =
	| { name: "match_start"; gameType: string; playerCount: number }
	| { name: "round_end"; gameType: string; winnerId: number; duration: number }
	| {
			name: "reward_granted";
			playerId: number;
			amount: number;
			reason: string;
	  }
	| {
			name: "player_quit_mid_round";
			gameType: string;
			timeElapsed: number;
	  };
