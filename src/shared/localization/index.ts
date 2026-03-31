import { Players, RunService } from "@rbxts/services";
import { EN } from "./en";
import { JA } from "./ja";

const tables: Record<string, Record<string, string>> = {
	en: EN,
	ja: JA,
};

let resolvedLocale = "en";

if (RunService.IsClient()) {
	const raw = Players.LocalPlayer.LocaleId.lower();
	// Fallback chain: ja-jp -> ja -> en
	if (raw === "ja-jp" || raw === "ja_jp" || raw === "ja") {
		resolvedLocale = "ja";
	}
}

/** Return the localized string for the given key. Falls back to English. */
export function t(key: string): string {
	const localeTable = tables[resolvedLocale];
	const value = localeTable?.[key];
	if (value !== undefined) return value;
	const fallback = EN[key];
	if (fallback !== undefined) return fallback;
	if (RunService.IsStudio()) {
		print(`[i18n] Missing key: ${key}`);
	}
	return key;
}

/** Localize with parameter substitution. %1, %2, etc. are replaced by args. */
export function tf(key: string, ...args: string[]): string {
	let result = t(key);
	for (let i = 0; i < args.size(); i++) {
		// Escape % in replacement to avoid Lua gsub interpreting %0-%9 as captures
		const safeArg = args[i].gsub("%%", "%%%%")[0];
		result = result.gsub(`%%${i + 1}`, safeArg)[0];
	}
	return result;
}

/** Return the mission label by MissionId value. */
export function tMission(missionId: string): string {
	return t(`mission_${missionId}`);
}

/** Return the current locale code ("en" or "ja"). */
export function getLocale(): string {
	return resolvedLocale;
}
