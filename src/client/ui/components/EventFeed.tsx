import React, { useEffect, useState } from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { FeedMessage, GameStoreState } from "shared/store/game-store";

const MAX_VISIBLE = 4;
const FADE_DURATION = 5;

export function EventFeed() {
	const feedMessages = useSelector(
		(state: GameStoreState) => state.feedMessages,
	);
	const [now, setNow] = useState(os.clock());

	// Tick every 0.5s to drive fade-out
	useEffect(() => {
		const conn = game.GetService("RunService").Heartbeat.Connect(() => {
			setNow(os.clock());
		});
		return () => conn.Disconnect();
	}, []);

	const visible = feedMessages
		.filter((m) => now - m.timestamp < FADE_DURATION)
		.filter((_, i, arr) => i >= arr.size() - MAX_VISIBLE);

	if (visible.size() === 0) return undefined;

	return (
		<frame
			key="EventFeed"
			Size={new UDim2(0.3, 0, 0, visible.size() * 26)}
			Position={new UDim2(0.01, 0, 0.55, 0)}
			BackgroundTransparency={1}
		>
			<uilistlayout
				SortOrder={Enum.SortOrder.LayoutOrder}
				Padding={new UDim(0, 2)}
			/>
			{visible.map((msg, i) => (
				<FeedEntry key={`feed-${i}`} message={msg} now={now} order={i} />
			))}
		</frame>
	);
}

function FeedEntry(props: {
	message: FeedMessage;
	now: number;
	order: number;
}) {
	const age = props.now - props.message.timestamp;
	const alpha =
		age > FADE_DURATION - 1 ? math.clamp(FADE_DURATION - age, 0, 1) : 1;

	return (
		<textlabel
			Size={new UDim2(1, 0, 0, 24)}
			BackgroundColor3={Color3.fromRGB(0, 0, 0)}
			BackgroundTransparency={1 - 0.5 * alpha}
			TextColor3={Color3.fromRGB(255, 255, 255)}
			TextTransparency={1 - alpha}
			TextStrokeColor3={Color3.fromRGB(0, 0, 0)}
			TextStrokeTransparency={1 - 0.6 * alpha}
			Font={Enum.Font.GothamBold}
			TextSize={14}
			TextXAlignment={Enum.TextXAlignment.Left}
			Text={`  ${props.message.text}`}
			LayoutOrder={props.order}
		>
			<uicorner CornerRadius={new UDim(0, 4)} />
			<uipadding PaddingLeft={new UDim(0, 6)} />
		</textlabel>
	);
}
