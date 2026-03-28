import React, { useEffect, useState } from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { Players, SocialService } from "@rbxts/services";
import { GameStoreState } from "shared/store/game-store";
import { MatchPhase } from "shared/types";

export function InviteButton() {
	const matchPhase = useSelector((state: GameStoreState) => state.matchPhase);
	const [canInvite, setCanInvite] = useState(false);

	useEffect(() => {
		task.spawn(() => {
			const [ok, result] = pcall(() =>
				SocialService.CanSendGameInviteAsync(Players.LocalPlayer),
			);
			if (ok && result) {
				setCanInvite(true);
			}
		});
	}, []);

	if (!canInvite || matchPhase !== MatchPhase.WaitingForPlayers) {
		return undefined!;
	}

	return (
		<textbutton
			key="InviteButton"
			Size={new UDim2(0, 100, 0, 30)}
			Position={new UDim2(1, -10, 0, 86)}
			AnchorPoint={new Vector2(1, 0)}
			BackgroundColor3={Color3.fromRGB(50, 120, 200)}
			BackgroundTransparency={0.2}
			BorderSizePixel={0}
			TextColor3={Color3.fromRGB(255, 255, 255)}
			TextScaled={true}
			Font={Enum.Font.GothamBold}
			Text="Invite"
			ZIndex={10}
			Event={{
				Activated: () => {
					task.spawn(() => {
						pcall(() => SocialService.PromptGameInvite(Players.LocalPlayer));
					});
				},
			}}
		>
			<uicorner CornerRadius={new UDim(0, 15)} />
			<uipadding PaddingLeft={new UDim(0, 8)} PaddingRight={new UDim(0, 8)} />
		</textbutton>
	);
}
