import { Flamework } from "@flamework/core";
import { createCosmeticAssets } from "./utils/createCosmeticAssets";

// Create placeholder cosmetic assets before services start
createCosmeticAssets();

Flamework.addPaths("src/server/services");
Flamework.ignite();
