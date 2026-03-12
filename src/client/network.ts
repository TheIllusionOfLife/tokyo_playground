import { GlobalEvents } from "shared/network";

// Shared singleton — import this instead of calling createClient() per-module
// to avoid duplicate remote bindings across controllers and UI components.
export const clientEvents = GlobalEvents.createClient({});
