import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { GameStoreState } from "shared/store/game-store";
import { MatchPhase, PlayerRole } from "shared/types";

const ROLE_COLORS: Record<PlayerRole, Color3> = {
	[PlayerRole.None]: Color3.fromRGB(255, 255, 255),
	[PlayerRole.Oni]: Color3.fromRGB(220, 50, 50),
	[PlayerRole.Hider]: Color3.fromRGB(50, 130, 220),
	[PlayerRole.Spectator]: Color3.fromRGB(150, 150, 150),
};

const ROLE_LABELS: Record<PlayerRole, string> = {
	[PlayerRole.None]: "",
	[PlayerRole.Oni]: "ONI",
	[PlayerRole.Hider]: "HIDER",
	[PlayerRole.Spectator]: "SPECTATOR",
};

export function RoleIndicator() {
	const role = useSelector((state: GameStoreState) => state.role);
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);

	if (role === PlayerRole.None || matchPhase !== MatchPhase.InProgress) {
		return undefined;
	}

	const color = ROLE_COLORS[role];
	const label = ROLE_LABELS[role];

	return (
		<textlabel
			key="RoleIndicator"
			Size={new UDim2(0.15, 0, 0.05, 0)}
			Position={new UDim2(0.425, 0, 0.09, 0)}
			BackgroundColor3={color}
			BackgroundTransparency={0.2}
			BorderSizePixel={0}
			TextColor3={Color3.fromRGB(255, 255, 255)}
			TextScaled={true}
			Font={Enum.Font.GothamBold}
			Text={label}
		>
			<uicorner CornerRadius={new UDim(0, 6)} />
		</textlabel>
	);
}
