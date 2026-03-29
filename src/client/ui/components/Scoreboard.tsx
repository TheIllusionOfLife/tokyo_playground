import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { t } from "shared/localization";
import {
	L_PLAYER,
	L_PTS,
	L_ROLE,
	L_STATS,
	L_WINS,
} from "shared/localization/keys";
import { GameStoreState } from "shared/store/game-store";
import { MatchPhase, PlayerRole, ScoreboardEntry } from "shared/types";

const ROLE_COLORS: Record<string, Color3> = {
	[PlayerRole.Oni]: Color3.fromRGB(220, 80, 80),
	[PlayerRole.Hider]: Color3.fromRGB(80, 150, 220),
	[PlayerRole.Spectator]: Color3.fromRGB(150, 150, 150),
};

export function Scoreboard() {
	const scoreboard = useSelector((state: GameStoreState) => state.scoreboard);
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);
	const summaryText = useSelector((state: GameStoreState) => state.summaryText);
	const winnerName = useSelector((state: GameStoreState) => state.winnerName);

	if (
		scoreboard.size() === 0 ||
		(matchPhase !== MatchPhase.RoundOver && matchPhase !== MatchPhase.Rewarding)
	) {
		return undefined!;
	}

	return (
		<frame
			key="Scoreboard"
			Size={new UDim2(0.5, 0, 0.5, 0)}
			Position={new UDim2(0.25, 0, 0.2, 0)}
			BackgroundColor3={Color3.fromRGB(15, 15, 30)}
			BackgroundTransparency={0.1}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 10)} />
			<uilistlayout
				SortOrder={Enum.SortOrder.LayoutOrder}
				Padding={new UDim(0, 2)}
			/>
			{winnerName !== undefined && (
				<textlabel
					key="WinnerName"
					Size={new UDim2(1, 0, 0, 36)}
					BackgroundTransparency={1}
					TextColor3={Color3.fromRGB(255, 215, 0)}
					TextStrokeColor3={Color3.fromRGB(0, 0, 0)}
					TextStrokeTransparency={0.2}
					TextScaled={true}
					Font={Enum.Font.GothamBlack}
					Text={`${winnerName} ${t(L_WINS)}`}
					LayoutOrder={-2}
				/>
			)}
			{summaryText !== undefined && (
				<textlabel
					key="SummaryText"
					Size={new UDim2(1, 0, 0, 28)}
					BackgroundTransparency={1}
					TextColor3={Color3.fromRGB(255, 220, 100)}
					TextStrokeColor3={Color3.fromRGB(0, 0, 0)}
					TextStrokeTransparency={0.4}
					TextScaled={true}
					Font={Enum.Font.GothamBold}
					Text={summaryText}
					LayoutOrder={-1}
				/>
			)}
			<ScoreRow
				rank="#"
				playerName={t(L_PLAYER)}
				role={t(L_ROLE)}
				stat={t(L_STATS)}
				points={t(L_PTS)}
				color={Color3.fromRGB(255, 220, 100)}
				order={0}
			/>
			{scoreboard.map((entry, i) => (
				<ScoreRow
					key={`score-${i}`}
					rank={tostring(i + 1)}
					playerName={entry.playerName}
					role={entry.role}
					stat={
						entry.role === PlayerRole.None
							? `${entry.catches} items`
							: entry.role === PlayerRole.Oni
								? `${entry.catches}C`
								: `${entry.rescues}R`
					}
					points={tostring(entry.points)}
					color={ROLE_COLORS[entry.role] ?? Color3.fromRGB(200, 200, 200)}
					order={i + 1}
				/>
			))}
		</frame>
	);
}

function ScoreRow(props: {
	rank: string;
	playerName: string;
	role: string;
	stat: string;
	points: string;
	color: Color3;
	order: number;
}) {
	return (
		<frame
			key={`Row${props.order}`}
			Size={new UDim2(1, 0, 0, 28)}
			BackgroundTransparency={1}
			LayoutOrder={props.order}
		>
			<Cell text={props.rank} pos={0} width={0.08} color={props.color} />
			<Cell
				text={props.playerName}
				pos={0.08}
				width={0.4}
				color={props.color}
			/>
			<Cell text={props.role} pos={0.48} width={0.2} color={props.color} />
			<Cell text={props.stat} pos={0.68} width={0.15} color={props.color} />
			<Cell text={props.points} pos={0.83} width={0.17} color={props.color} />
		</frame>
	);
}

function Cell(props: {
	text: string;
	pos: number;
	width: number;
	color: Color3;
}) {
	return (
		<textlabel
			Size={new UDim2(props.width, 0, 1, 0)}
			Position={new UDim2(props.pos, 0, 0, 0)}
			BackgroundTransparency={1}
			TextColor3={props.color}
			TextScaled={true}
			Font={Enum.Font.Gotham}
			Text={props.text}
		/>
	);
}
