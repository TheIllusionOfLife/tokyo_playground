import React, { useEffect, useState } from "@rbxts/react";
import { GlobalEvents } from "shared/network";

const TIER_COLORS: Color3[] = [
	Color3.fromRGB(120, 80, 160), // 凶 purple
	Color3.fromRGB(160, 160, 160), // 末吉 grey
	Color3.fromRGB(100, 200, 100), // 小吉 green
	Color3.fromRGB(80, 160, 255), // 吉 blue
	Color3.fromRGB(255, 200, 50), // 大吉 gold
];

/**
 * Fortune card display when a player draws an omikuji.
 * Auto-dismisses after 5 seconds.
 */
export function OmikujiCard() {
	const [data, setData] = useState<
		| { fortune: string; fortuneJP: string; tier: number; points: number }
		| undefined
	>(undefined);

	useEffect(() => {
		const clientEvents = GlobalEvents.createClient({});
		const conn = clientEvents.omikujiResult.connect(
			(fortune, fortuneJP, tier, points) => {
				setData({ fortune, fortuneJP, tier, points });
			},
		);
		return () => conn.Disconnect();
	}, []);

	useEffect(() => {
		if (!data) return;
		const thread = task.delay(5, () => setData(undefined));
		return () => task.cancel(thread);
	}, [data]);

	if (!data) return undefined;

	const borderColor = TIER_COLORS[math.clamp(data.tier, 0, 4)];

	return (
		<frame
			key="OmikujiCard"
			Size={new UDim2(0.22, 0, 0.18, 0)}
			Position={new UDim2(0.39, 0, 0.4, 0)}
			BackgroundColor3={Color3.fromRGB(25, 20, 30)}
			BackgroundTransparency={0.05}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 8)} />
			<uistroke Color={borderColor} Thickness={3} />

			{/* Japanese fortune text */}
			<textlabel
				Size={new UDim2(0.9, 0, 0.4, 0)}
				Position={new UDim2(0.05, 0, 0.05, 0)}
				BackgroundTransparency={1}
				TextColor3={borderColor}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				Text={data.fortuneJP}
			/>

			{/* English translation */}
			<textlabel
				Size={new UDim2(0.9, 0, 0.2, 0)}
				Position={new UDim2(0.05, 0, 0.48, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(200, 200, 210)}
				TextScaled={true}
				Font={Enum.Font.Gotham}
				Text={data.fortune}
			/>

			{/* Points reward */}
			<textlabel
				Size={new UDim2(0.9, 0, 0.2, 0)}
				Position={new UDim2(0.05, 0, 0.73, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(180, 220, 180)}
				TextScaled={true}
				Font={Enum.Font.Gotham}
				Text={`+${data.points} Play Points`}
			/>
		</frame>
	);
}
