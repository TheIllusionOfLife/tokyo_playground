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
	  }
	| { name: "match_phase_changed"; phase: string; matchId: string }
	| { name: "role_assigned"; playerId: number; role: string }
	| { name: "player_caught"; catcherId: number; caughtId: number }
	| { name: "can_kicked"; kickerId: number; freedCount: number }
	| { name: "player_join_mid_match"; playerId: number; matchId: string }
	| { name: "player_leave_mid_match"; playerId: number; matchId: string }
	| {
			name: "mission_completed";
			playerId: number;
			missionId: string;
			pointsReward: number;
	  }
	| {
			name: "shop_purchase";
			playerId: number;
			itemId: string;
			price: number;
	  }
	| {
			name: "session_start";
			playerId: number;
			platform: string;
	  }
	| {
			name: "session_end";
			playerId: number;
			durationSeconds: number;
	  };
