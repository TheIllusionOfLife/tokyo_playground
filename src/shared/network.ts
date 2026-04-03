/**
 * Barrel module for Flamework networking.
 * Merges bounded-context event interfaces into unified types
 * and exports GlobalEvents for use across the codebase.
 */
import { Networking } from "@flamework/networking";
import {
	CommerceClientToServer,
	CommerceServerToClient,
} from "shared/network/commerce-network";
import {
	HachiClientToServer,
	HachiServerToClient,
} from "shared/network/hachi-network";
import {
	LivingCityClientToServer,
	LivingCityServerToClient,
} from "shared/network/living-city-network";
import {
	MatchClientToServer,
	MatchServerToClient,
} from "shared/network/match-network";

interface ServerToClientEvents
	extends MatchServerToClient,
		CommerceServerToClient,
		LivingCityServerToClient,
		HachiServerToClient {}

interface ClientToServerEvents
	extends MatchClientToServer,
		CommerceClientToServer,
		LivingCityClientToServer,
		HachiClientToServer {}

export const GlobalEvents = Networking.createEvent<
	ClientToServerEvents,
	ServerToClientEvents
>();
