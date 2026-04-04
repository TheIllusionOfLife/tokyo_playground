# Roblox Platform Updates Audit (Dec 2024 - Mar 2026)

Reviewed against Shibuya Open World codebase.

---

## Already Using (No Action)

| Feature | Status |
|---------|--------|
| Unified Lighting (Realistic + Prioritized) | Active via `LightingStyle` |
| StreamingEnabled (target 512, min 256) | Active |
| Studio MCP Server (Phase 3+ native) | Active |
| AI Assistant / Cube 3D mesh generation | Active |
| Occlusion Culling | Automatic, no config needed |
| Texture Streaming | Automatic, no config needed |
| Content Maturity Questionnaire | Completed |

---

## Adopt Now

### SLIM (Scalable Lightweight Interactive Models)
- **Action:** Enable TeamCreate (File > Game Settings > Security). Enable "SLIM" in File > Beta Features. Set `city_and_roads.LevelOfDetail = Enum.ModelLevelOfDetail.SLIM` in Properties panel or server Script. Requires `Workspace.StreamingEnabled = true`.
- **Why:** Current StreamingMesh shows untextured blobs at distance. SLIM preserves textures and shape.
- **Prereqs:** TeamCreate enabled, StreamingEnabled = true, SLIM Beta Feature enabled.

### Light Range 120 Studs
- **Action:** Audit city PointLights/SpotLights. Replace clusters of 60-range lights with single 120-range lights.
- **Why:** Halves light count for same coverage, improves performance.
- **Risk:** Check scripts that set `.Range` between 61-120 (previously clamped to 60, now applied literally).

### Roblox Moments / CaptureService
- **Action:** Add `CaptureService:StartVideoCaptureAsync` triggers for: minigame wins, Hachi evolution, stamp discoveries.
- **Why:** Auto-captured party game highlights drive viral organic discovery via Moments feed.
- **Note:** Client-side API. Server fires network event on trigger, client controller calls CaptureService.

### Rewarded Video Ads
- **Action:** Enable in Game Settings > Monetization once 2,000+ monthly unique visitors.
- **Prereqs:** Creator 13+, 2FA enabled, ID verified.
- **Revenue:** eCPM-based, 90%+ completion rates reported.

### Regional Pricing
- **Status:** Already default for Game Passes as of 2026-03-30.
- **Action:** Enable for any future Developer Products.
- **Impact:** 26% more paying users reported.

---

## Deferred (Not This Round)

| Feature | Reason |
|---------|--------|
| 4K Texture Rendering | PLATEAU textures exported at ~1080, no benefit yet |
| Emissive Masks | No night mode or vending machine interiors currently |
| Server Authority | Major networking rewrite, not needed for party game scale |
| Text-to-Speech API | Nice-to-have for NPC dialogue, not priority |
| Input Action System | Current input handling works, migration not justified |

---

## Not Adopting (Out of Scope)

| Feature | Reason |
|---------|--------|
| IP Licensing | No brand deals planned |
| Paid Access / Subscriptions | Free-to-play model |
| Shopify Commerce | No physical merchandise |
| Homepage Feature Ads | Closed beta, brand-focused |

---

## Deprecations Addressed

| Deprecation | Status |
|------------|--------|
| `Lighting.Technology` | Already using `LightingStyle`, OK |
| Non-Async method deprecation | No usage found in codebase |

---

## Future Watch

| Feature | Timeline | Relevance |
|---------|----------|-----------|
| Emissive Maps | 2026 H1 | When we add night mode |
| SLIM v2 (avatar support) | 2026 | Hachi model LOD |
| Animation Graphs | 2026 | Could improve Hachi animations |
| Studio Device Simulator | 2026 | Mobile testing workflow |
