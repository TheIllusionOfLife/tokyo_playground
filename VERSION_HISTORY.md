# Version History

| Version | Date | Summary |
|---------|------|---------|
| v0.1.0 | 2026-03-12 | PLATEAU spike: Shibuya buildings, Flamework game loop, persistence |
| v0.3.0 | 2026-03-14 | Shibuya Scramble minigame, crowd waves, rooftop slides, missions |
| v0.4.0 | 2026-03-15 | Hachi Polish: 3x speed, animations, slides/tubes, audio, world |
| v0.5.0 | 2026-03-17 | Equip system, portal-only matches, mobile landscape, anti-cheat |
| v0.5.1 | 2026-03-17 | Mobile jump fix, body bob, shared lobby/minigame Hachi logic |
| v0.5.2 | 2026-03-17 | SetStateEnabled jump fix attempt, StarterGui orientation attempt |
| v0.5.3 | 2026-03-18 | Rojo landscape property, Stepped jump prevention, bonus SE dedup |
| v0.6.0 | 2026-03-17 | Bonus items + Hachi mechanics |
| v0.7.0 | 2026-03-19 | Fun Pass & Game Feel: SFX, haptics, event feed, Oni reveal, streak bonuses, faster sessions, minigame depth |
| v0.8.0 | 2026-03-20 | Dismount fix: 5-layer defense prevents Hachi eject on all platforms. Instant jump via client prediction. HUD redesign: compact scoreboard, fullscreen shop, panel exclusivity |
| v0.9.0 | 2026-03-20 | Living Shibuya: day/night cycle, 30 stamps, 8 NPCs, 6 micro-events, lobby Hachi abilities, photo mode |
| v0.10.0 | 2026-03-20 | Visual enhancements: coin-spin item animation, 3 stamp hats + 2 trails, torii portals, booster chevrons, collectible glow rings, building PCD collision |
| v0.11.0 | 2026-03-22 | HUD cleanup + Hachi controls: compact HUD, GetMoveVector movement, BodyGyro rotation, 50% Hachi scale, start Lv.2, halved thresholds, no auto-start |
| v0.12.0 | 2026-03-28 | Real Shibuya city with textures, half-size characters, visual effects, Fabric material |
| v0.13.0 | 2026-03-28 | Hachi costume system, HUD toggle, native Humanoid movement, UI cleanup |
| v0.14.0 | 2026-03-29 | Minigame overhaul: sky-drop collectibles, Noob crowds, car waves, kick/catch FX, mission revamp |
| v0.15.0 | 2026-03-29 | Pre-release polish: bug fixes, localization, analytics, social features |
| v0.16.0 | 2026-03-29 | Mobile playtest fixes: boundary system, zone popups, ambient city life, train, SkySlide corridors |
| v0.17.0 | 2026-03-30 | Content quality pass: 16-item shop, Kitsune series, 5 new missions, economy rebalance |
| v0.18.0 | 2026-03-31 | Mobile playtest polish: missions UI, AI collectible meshes, 3-tier item distribution, train fade, zone popups, trail particles, Hachi JOIN button |
| v0.19.0 | 2026-03-31 | Playtest overhaul: scramble crossing traffic, polygon spawn, multi-jump evolution, green coins, fluffy aura, full JA localization, corridor redesign |
| v0.20.0 | 2026-04-01 | Pre-launch audit: AFK detection, platform analytics, profile retry, safeHandler, streaming pre-load, sound leak fixes, city optimization (2168 furniture Box collision, SLIM LOD) |
| v0.21.0 | 2026-04-01 | Cross-platform playtest: loading screen, auto-catch, Oni mounts Hachi, PoI discovery, engagement features (login streak, spin, leaderboard, badges), UI overhaul, immersive ads infrastructure |
| v0.22.0 | 2026-04-02 | Vehicles, badges, UI polish: 16 rideable vehicles with AnimProfile dispatch, cosmetics preview, 15 achievement badges with stat tracking, spin wheel visual overhaul, tabbed missions/PoI, mobile button layout fix |
| v0.23.0 | 2026-04-02 | Vehicle tuning + UI fixes: per-vehicle weld rotation/height/hip offsets for all 16 mounts, floating dragons, standing skateboard, topbar Spin/Ranks buttons, shop tab redesign, PoI sync fix, /balance debug command |
| v0.24.0 | 2026-04-02 | PoI zone name fix: spaced names matching Studio ZoneName attributes, MissionPanel fallback fix |
| v0.25.0 | 2026-04-02 | Sky dragon + Hachi Ride overhaul: divine sky dragon boss (airplane-scale, rainbow treasure, 60s trigger), evolution rebalance (Level 1 baseline, double jump everywhere), economy rebalance (flat 25pts base, 15pts/catch, streak 2x cap, solo guard), rooftop item calibration, particle cleanup, car tilt fix, shop price sort |
| v0.26.0 | 2026-04-03 | Weekly leaderboard + minigame overhaul: weekly Hachi Ride high score tab (atomic UpdateAsync, ISO week, JST Monday reset), badge batch 2 (5 new IDs), Hide & Seek rename + spirit wave/crowd/car removal + tagged hider spectating + anchored invisibility, Can Kick redesigned jail (4 walls + roof, no bars) + upright giant can + catch radius halved + auto-kick cooldown + jail spawn avoidance, reward fixes (streak multiplier per-line, tagged hiders no win bonus, Oni base 40pts), winner logic (filter eliminated hiders), mid-match respawn handlers (CharacterAdded for all minigames), UI overhaul (auto-size RewardPopup, scrollable scoreboard, centered SkillsPanel, role in intro overlay), dead code cleanup (level-up, spirit wave, car loop, DodgeCars mission) |
| v0.28.1 | 2026-04-04 | Critical hotfix: mobile touch controls (React mount into Folder isolates clearContainer from TouchGui), free Neko vehicle purchase (allow amount=0), live vehicle swap from shop, timer centering, Ride Hachi button alignment, "Equipped" label for vehicles, React error boundary (prevents permanent UI death on Android), equip rollback on failure |
| v0.28.0 | 2026-04-04 | Shibuya Open World rebrand + UI/UX overhaul: rename from Tokyo Playground, unified ActionBar (SVG icons, text stroke), compact vehicle cards, timer redesign with urgency colors, loading screen with logo/animation/streaming preload/BGM delay, spin panel redesign, mission panel polish, 22 SVG icon assets, logo generation prompts |
| v0.27.0 | 2026-04-04 | 30/60/90-day engineering review: Day 30 safety (safeHandler 17 handlers, BindToClose ordering, maxPlayers, badge IDs, POI rate limit, test infra, repo hygiene), Day 60 hardening (87 tests, CooldownTracker, teleport anti-cheat, typed microEventProgress, HachiAbilityService extraction), Day 90 decomposition (network.ts 4 modules, game-store.ts 5 slices, EconomyService + InventoryService, round resolution functions, HachiRide 4 helper modules -40%, architecture docs) |
