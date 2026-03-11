# Roblox Ecosystem Research for Tokyo Playground

> Researched: March 2026

---

## 1. Roblox Studio & Luau

### Roblox Studio
- Official IDE: 3D level editor + script editor + asset manager + testing environment
- Proprietary desktop app (Windows/Mac)
- Build worlds visually, attach Luau scripts to objects
- Built-in client/server architecture: `ServerScriptService` (server), `StarterPlayerScripts` (client)
- Communication via `RemoteEvents` / `RemoteFunctions`
- Files stored as `.rbxl` (binary) or `.rbxlx` (XML)
- As of early 2026, native file sync to external folders is available (reducing Rojo dependency for basic sync)

### Luau Language
- Roblox's fork of Lua 5.1 with significant enhancements
- Gradual type system with type inference
- New Type Solver (late 2025): near-instant autocomplete and error detection
- Native Code Generation (AOT/JIT) on all platforms including Android — up to 50% speed boost
- Supports strict typing, generics, string interpolation, generalized iteration

---

## 2. roblox-ts (TypeScript → Luau Transpiler)

### Overview
- Actively maintained open-source TypeScript-to-Luau transpiler
- Near 1:1 parity with Luau features as of 2026
- Considered the professional standard for serious teams

### Pros
- Stronger type system, familiar to web developers
- Full VS Code + TypeScript toolchain support
- npm-like package ecosystem (`@rbxts/*` packages)
- Code lives as `.ts` files on disk — git-friendly
- Better for external editors, version control, CI/CD
- AI coding assistants (Claude Code) work effectively with TypeScript

### Cons
- Extra build step (transpilation)
- Debugging shows Luau output, not TypeScript source
- Community resources/tutorials mostly in Luau
- Some Roblox API patterns map awkwardly to TypeScript
- Still need Roblox Studio for the visual editor (roblox-ts handles scripts only)
- Smaller community = fewer examples, slower support

### Verdict for Tokyo Playground
roblox-ts is the recommended choice given:
- TypeScript familiarity
- Git-based workflow requirement
- Claude Code assistance for scripting/systems

---

## 3. Roblox Studio AI Tools

There are **three distinct AI tools** in Studio:

### 3.1 Roblox Assistant (Conversational Agent)
- Chat-based agent for planning, debugging, orchestrating tasks
- Example: "Analyze my script and tell me why the player isn't respawning"
- Good at boilerplate generation (DataStores, leaderboards)

### 3.2 Code Assist (Inline Autocomplete)
- GitHub Copilot equivalent for Luau
- Predicts next lines as you type inside the Script Editor
- Excellent for repetitive Get/Set logic and DataStore patterns

### 3.3 AI APIs (Cube Foundation Model)
Engine-level services for developers. Key capabilities:

| Feature | Status | Description |
|---------|--------|-------------|
| **3D/4D Model Generation** | Production | Text → multi-part mesh with physics, textures, and scripts. ~4 sec latency. Uses Schemas + Retargetable Scripts |
| **Terrain Generation** | Production | Up to 64K × 64K studs with biome-based materials |
| **Material/Texture Creation** | Production | PBR textures from text prompts |
| **Figma-to-Studio UI** | Production | MCP-based pipeline: Figma designs → ScreenGuis, Buttons, Frames |
| **Avatar Auto-Setup** | Production | Auto-rigs and skins custom 3D models |
| **Full Scene Generation** | Roadmap (Late 2026) | Coherent environment generation |
| **Real-time Environment Morphing** | Roadmap (2027) | Dynamic environment changes |
| **Speech-to-Text NPC Dialogue** | Roadmap (Late 2026) | Voice-driven NPC interactions |

### Marketing Claims vs Reality

| Feature | Marketing | Reality |
|---------|-----------|---------|
| Scene generation | "Build entire worlds in seconds" | Generates individual assets well; a coherent city requires multiple prompts + manual cleanup for clipping/alignment |
| 4D Objects | "Any object you can imagine" | Works well for known schemas (vehicles, NPCs); struggles with complex original mechanics |
| Code Assist | "Write games without coding" | Excellent for boilerplate, cannot architect complex performant backend alone |

### Limitations
- **Mesh topology quality**: AI meshes often have messy wireframes requiring manual retopologization
- **No art style memory**: Generated assets may look inconsistent with each other
- **Context-blind**: Cannot see your whole game; may place objects in wrong locations
- **Moderation filters**: Strict safety filters block some benign prompts (e.g., "broken glass")

### Impact on Tokyo Playground World-Building
Roblox AI **significantly reduces** but does not eliminate manual labor:
- Generate individual buildings, props, vending machines from prompts
- Generate terrain and ground materials
- Auto-rig NPCs
- Build UI from Figma designs
- **Still manual**: Arrangement, alignment, artistic consistency, scene coherence

---

## 4. Project PLATEAU (3D City Open Data)

### Overview
- Japan's national 3D city digital twin initiative by MLIT (国土交通省)
- Provides semantic 3D city models with metadata (building use, floor count, year built)
- **License: CC BY 4.0** — commercially usable in Roblox games
- **Attribution required**: "Source: Project PLATEAU by MLIT" in game credits

### Tokyo Coverage

| Area | LOD Level | Description |
|------|-----------|-------------|
| Shibuya | LOD2 | Accurate roofs + photogrammetry-based facade textures |
| Shinjuku | LOD2 | Roofs + facade textures |
| Ikebukuro | LOD2 | Roofs + facade textures |
| Marunouchi | LOD2 | Roofs + facade textures |
| Ginza | LOD2 | Roofs + facade textures |
| Other 23 wards | LOD1 | Flat-roofed box extrusions |

### LOD Levels

| LOD | Description | Availability |
|-----|-------------|--------------|
| LOD1 | Flat-roofed box extrusions | Most of 23 wards |
| LOD2 | Accurate roofs + facade textures | Major districts |
| LOD3 | Windows, doors, balconies | Very limited pilot areas |
| LOD4 | Indoor layouts | Landmark buildings only |

### Available Formats

| Format | Notes |
|--------|-------|
| **FBX** | Best for game dev; download directly |
| OBJ | Also available; game-compatible |
| CityGML 2.0 | Native format, not game-ready |
| glTF / 3D Tiles | Web viewers primarily |

### Roblox Import Pipeline

```
PLATEAU FBX
  → Blender
    → Reset origin to (0,0,0) (PLATEAU uses real-world geo-coordinates)
    → Decimate modifier (<20k triangles per chunk)
    → Chunk city into pieces
  → Export as .glb
    → Roblox Studio 3D Importer
```

### Key Considerations
- A single LOD2 city block can exceed **500,000 triangles** — must decimate aggressively
- Roblox hard limit: **20,000 triangles per mesh**
- Textures: LOD1 has none; LOD2 facade textures cap at 1024×1024 in Roblox (may look blurry)
- Recommended: LOD1 for distant/background, decimated LOD2 for playable areas
- Enable `StreamingEnabled` in Roblox Workspace

### Key Resources

| Resource | Purpose |
|----------|---------|
| PLATEAU VIEW (plateauview.jp) | Web viewer to scout areas before downloading |
| G-Spatial Information Center | Main download portal |
| PLATEAU SDK for Unity | Filter/export specific areas as FBX (useful even for Roblox) |
| PLATEAU GitHub (github.com/Project-PLATEAU) | SDKs, samples, tools |
| Blender | Essential middleware for conversion and optimization |

---

## 5. Asset Sources & Import Workflow

### Roblox Creator Marketplace — Japanese Assets
Search terms that yield results:
- "Modular Japanese City" / "Tokyo Building Pack"
- "Japanese Utility Poles" (iconic concrete poles with wire clusters)
- "Scripted Japanese Vending Machine" (interactive)
- "Japanese Signboard" (vertical neon signs)
- Glowing signage via SurfaceGui (text) or Decals (Japanese typography)

### External Sources

| Source | Notes |
|--------|-------|
| **KitBash3D "Japanese Neighborhoods"** | Gold standard for city-scale architecture; needs decimation |
| **Unity Asset Store** | "Japanese Street Kit" (KraftMaru packs); extract FBX files |
| **Sketchfab** | Hero props (subway cars, ramen shops); search "Low Poly Japan" |
| **Blender-OSM plugin** | Import real Tokyo building footprints and terrain as layout reference |

### Roblox Mesh Import Limits

| Constraint | Limit |
|------------|-------|
| Triangles per mesh (3D Importer) | 20,000 |
| Triangles per mesh (Bulk Import) | 10,000 |
| Texture (standard) | 1024 × 1024 px |
| Texture (with Streaming) | 4096 × 4096 px |
| Max MeshPart size | 2048 × 2048 × 2048 studs |
| Open Cloud API file size | 20 MB |

### High-Poly → Roblox Optimization Workflow

1. Decimate in Blender (<20k triangles)
2. UV Unwrap (Smart UV Project)
3. Bake high-poly detail onto Normal Map (Cycles renderer)
4. Export low-poly mesh + PBR maps (Normal/Color/Roughness/Metalness)
5. In Roblox: `SurfaceAppearance` on MeshPart with uploaded PBR textures
6. **Result**: A 5,000-poly building can look like a 500,000-poly one

### Open Cloud API (Programmatic Upload)
- Endpoint: `POST https://apis.roblox.com/assets/v1/assets`
- Formats: `.fbx`, `.gltf`, `.rbxm`
- Max file size: 20 MB
- Use case: Python script that batch-uploads a folder of models and returns assetIds

---

## 6. Target Platforms & Performance

### Player Distribution
- **Mobile (iOS/Android)**: ~60–70% of player base — **design baseline**
- PC (Windows/Mac): minority but higher fidelity
- Xbox, PlayStation: console audience
- Meta Quest VR: small but growing

### Performance Budget (Mobile-First)

| Metric | Target |
|--------|--------|
| Draw calls | ~1,000 max |
| Memory | 600 MB – 1 GB |
| Triangles in view | <100k (recommended) |
| Per-mesh triangles | <20k (hard limit) |

### Key Techniques
- `StreamingEnabled`: Only loads what's near the player — critical for city-scale maps
- SLIM (Scalable Lightweight Interactive Models): Auto-optimizes distant assets
- Instance Streaming: Manages memory for large worlds
- Level of Detail (LOD): Use LOD1 for background, LOD2 for playable areas

---

## 7. Monetization & Economy

### In-Experience Revenue
- **Game Passes**: One-time purchases (VIP, permanent perks)
- **Developer Products**: Consumable purchases (coins, boosts)
- **Subscriptions**: Recurring monthly Robux charges
- **Premium Payouts**: Based on Premium subscriber time spent in-game

### DevEx (Developer Exchange)
- Rate: **$0.0038 per Robux** ($380 per 100,000 Robux) as of September 2025
- Creators receive ~24–29% of what players spend
- Eligibility: 13+, verified ID, minimum Robux balance

### Platform Trend
- 18–34 demographic growing fastest, monetizing at 40% higher rate
- Subscription-based and high-fidelity experiences are trending

---

## 8. Development Toolchain

### Recommended Stack for Tokyo Playground

| Layer | Tool |
|-------|------|
| IDE | Terminal (Claude Code) + Roblox Studio |
| Language | roblox-ts (TypeScript) |
| Sync | Rojo |
| Toolchain Manager | Rokit |
| Version Control | Git |
| Package Manager | npm (@rbxts packages) + Wally (Luau) |
| Linter | Selene |
| Formatter | StyLua |
| Testing | TestEZ |
| AI Assist (code) | Claude Code (via MCP → Studio) + Code Assist |
| AI Assist (3D) | Roblox Assistant + Cube AI APIs |
| 3D Pipeline | Blender (mandatory for PLATEAU/external assets) |

### Roblox Studio MCP Server (Built-in)

Roblox Studio ships with a native MCP server that lets Claude Code **directly interact with the open Studio session**.

**Setup:**
1. Open Roblox Studio → Assistant chat → … → Assistant Settings → MCP Servers tab
2. Toggle on "Enable Studio as MCP server"
3. In terminal: `claude mcp add Roblox_Studio -- /Applications/RobloxStudio.app/Contents/MacOS/StudioMCP`
4. Verify with `/mcp` in Claude Code

**Available MCP Tools:**

| Category | Tools | Description |
|----------|-------|-------------|
| Scripts | `script_read`, `multi_edit`, `script_search`, `script_grep` | Read, write, search scripts in the DataModel |
| Data Model | `search_game_tree`, `inspect_instance` | Explore instance hierarchy, inspect properties |
| Execution | `execute_luau` | Run Luau code directly in Studio |
| Playtesting | `start_stop_play`, `console_output` | Start/stop play mode, read console logs |
| Input Sim | `character_navigation`, `keyboard_input`, `mouse_input` | Simulate player input during playtesting |
| Session | `list_roblox_studios`, `set_active_studio` | Manage multiple Studio instances |

**Implications for development:**
- Claude Code can read/write scripts directly in Studio (not just filesystem)
- Can execute Luau code to test logic without manual play mode
- Can explore the game tree to understand existing structure
- Can search all scripts for patterns (grep across DataModel)
- Reduces context-switching between VS Code and Studio

### Complete Development Workflow

There are **4 distinct pipelines** that all converge in Roblox Studio:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ROBLOX STUDIO                                │
│                    (Central Hub — everything converges here)         │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Scripts   │  │ 3D World │  │ UI/GUI   │  │ Materials/Terrain │  │
│  │ (Luau)   │  │ (Meshes) │  │ (Screens)│  │ (PBR/Landscape)   │  │
│  └────▲─────┘  └────▲─────┘  └────▲─────┘  └────────▲──────────┘  │
│       │              │              │                  │             │
└───────┼──────────────┼──────────────┼──────────────────┼─────────────┘
        │              │              │                  │
   ┌────┴────┐    ┌────┴────┐   ┌────┴────┐    ┌───────┴────────┐
   │ PIPELINE│    │ PIPELINE│   │ PIPELINE│    │   PIPELINE 4   │
   │    1    │    │    2    │   │    3    │    │                │
   │  CODE   │    │  3D ART │   │   UI    │    │   AI ASSIST    │
   └─────────┘    └─────────┘   └─────────┘    └────────────────┘
```

#### Pipeline 1: Code (Claude Code → roblox-ts → Rojo → Studio)

This is the **primary scripting workflow**. All game logic lives here.

```
You (terminal)
  ↓ describe what to build
Claude Code
  ↓ writes .ts files
roblox-ts (transpile)
  ↓ generates .lua files
Rojo (sync)
  ↓ pushes into Studio DataModel
Roblox Studio
  ↓ runs the game
Claude Code (via MCP)
  ↓ inspects game tree, reads console, executes Luau, debugs
Git → GitHub
  ↓ version control + PRs
```

**Who does what:**
- **You**: Describe features, review code, make design decisions
- **Claude Code**: Writes TypeScript, manages project structure, debugs via MCP
- **roblox-ts**: Automatic transpilation (watch mode)
- **Rojo**: Automatic sync (watch mode)
- **MCP**: Claude Code reads/writes scripts in Studio, runs Luau, checks console

**Files on disk (git-tracked):**
```
src/
  server/        → ServerScriptService (server-side logic)
  client/        → StarterPlayerScripts (client-side logic)
  shared/        → ReplicatedStorage (shared modules)
```

#### Pipeline 2: 3D Assets (PLATEAU / Marketplace / External → Blender → Studio)

This is the **world-building pipeline**. Creates the Tokyo city environment.

```
Source A: Project PLATEAU
  ↓ download Shibuya FBX from G-Spatial
  ↓
Blender
  ↓ reset origin (0,0,0)
  ↓ decimate (<20k tris per chunk)
  ↓ bake normal maps from high-poly
  ↓ export .glb
  ↓
Roblox Studio 3D Importer
  ↓ add SurfaceAppearance for PBR
  ↓ arrange in Workspace

Source B: Roblox Creator Marketplace
  ↓ search: "Japanese vending machine", "Tokyo building pack", etc.
  ↓ insert directly into Studio
  ↓ customize materials/colors

Source C: External Assets (KitBash3D, Sketchfab, Unity Asset Store)
  ↓ download FBX/OBJ
  ↓ optimize in Blender (same as PLATEAU pipeline)
  ↓ import to Studio
```

**Who does what:**
- **You**: Scout locations in PLATEAU VIEW, select marketplace assets, art direct
- **Blender**: Decimation, UV unwrap, normal map baking, chunking
- **Roblox Studio**: Import, arrange, set up SurfaceAppearance + StreamingEnabled

#### Pipeline 3: UI (Claude Code / Roact / Roblox Assistant → Studio)

Multiple approaches, no external design tool required:

```
Option A: Claude Code via MCP (fastest for iteration)
  Claude Code
    ↓ execute_luau to create ScreenGui/Frame/TextLabel hierarchy
    ↓ or writes Roact components in .ts files
  Roblox Studio
    ↓ UI appears, test and refine

Option B: Roact in roblox-ts (best for maintainability)
  Claude Code
    ↓ writes React-like UI components in TypeScript (@rbxts/roact)
  roblox-ts → Rojo → Studio
    ↓ UI is code-defined, git-tracked, version-controlled

Option C: Roblox Assistant (quick prototyping)
  You (in Studio)
    ↓ "Create a HUD with timer, score, and role indicator"
  Roblox Assistant
    ↓ generates GUI objects directly in Studio

Option D: Sketch mockups anywhere (reference only)
  Any tool (paper, Canva, Affinity, etc.)
    ↓ use as visual reference
  Build actual UI via Option A, B, or C
```

**Who does what:**
- **You**: Sketch rough mockups (any tool), make design decisions
- **Claude Code**: Writes UI components in TypeScript (Roact) or creates via MCP
- **Roblox Assistant**: Quick UI prototyping from natural language
- No Figma dependency

#### Pipeline 4: AI-Assisted Content (Roblox Assistant / Cube AI → Studio)

```
Roblox Assistant (in Studio)
  ↓ "Generate a Japanese vending machine with glowing buttons"
  ↓ "Create terrain: urban park with cherry trees"
  ↓ "Make this wall look like weathered concrete with graffiti"
  ↓
Roblox Studio
  ↓ AI generates mesh/terrain/material
  ↓ you review, adjust, place
```

**Who does what:**
- **You**: Prompt Roblox Assistant for props, terrain, materials
- **Roblox AI**: Generates 3D models (~4 sec), PBR materials, terrain
- **You**: Curate, arrange, ensure artistic consistency

#### Day-to-Day Workflow (All Pipelines Combined)

```
1. Open Roblox Studio (with MCP enabled)
2. Open terminal → start Claude Code
3. Start roblox-ts watch mode (auto-transpile on save)
4. Start Rojo serve (auto-sync to Studio)

CODING SESSION:
  - Tell Claude Code what to build
  - Claude writes .ts → auto-transpiles → auto-syncs to Studio
  - Claude inspects Studio via MCP, runs Luau to verify
  - You playtest in Studio, Claude reads console output
  - Git commit at milestones → push to GitHub branch → PR

WORLD-BUILDING SESSION:
  - Import PLATEAU chunks / marketplace assets into Studio
  - Use Roblox Assistant to generate props and materials
  - Arrange, light, polish in Studio
  - Save .rbxlx (Studio's place file — not git-tracked)

UI SESSION:
  - Sketch mockup (paper/any tool) as reference
  - Claude Code creates UI via Roact (.ts) or MCP execute_luau
  - OR use Roblox Assistant in Studio for quick prototyping
```

#### Team Collaboration

Roblox has **Team Create** — built-in real-time collaboration in Studio (like Google Docs for 3D).

| Concern | Solution |
|---------|----------|
| Code collaboration | Git + GitHub (via Rojo, roblox-ts) |
| 3D world collaboration | **Team Create** (built into Studio) |
| Reusable assets | **Packages** (Studio's asset versioning system) |
| Game publishing | Roblox cloud (Studio publishes directly) |

**Team Create features:**
- Multiple people edit the same place simultaneously in Studio
- See each other's cursors/selections in real-time
- Auto-saves to Roblox cloud
- Built-in version history with rollback
- No merge conflicts — Roblox handles concurrent edits

**2-person team split (Tokyo Playground):**

| Role | Tools | What they do |
|------|-------|-------------|
| **Person A (systems/code)** | Terminal + Claude Code + MCP | Writes all scripts in roblox-ts, debugs via MCP, manages git/GitHub |
| **Person B (art/level design)** | Roblox Studio (Team Create) | Imports PLATEAU/marketplace assets, uses Roblox AI, arranges/lights/polishes the 3D world |

Both see each other's changes in real-time. Code and world never conflict — Rojo syncs scripts, Team Create syncs everything else.

#### What Lives Where

| Content | Location | Version Control |
|---------|----------|-----------------|
| Game scripts (.ts) | Filesystem → Rojo → Studio | Git + GitHub |
| 3D world, meshes, lighting | Roblox Studio | Team Create (Roblox cloud) |
| UI layouts (if Roact) | Filesystem (.ts) | Git + GitHub |
| UI layouts (if manual) | Roblox Studio | Team Create (Roblox cloud) |
| Reusable assets | Studio Packages | Roblox Packages versioning |
| Project config | Filesystem (tsconfig, rojo config) | Git |
| Design docs | Filesystem | Git |
| PLATEAU source data | Local download | Not tracked (too large) |

#### Testing & Build Process

**Build speed (roblox-ts + Rojo):**
```
Save .ts file
  → rbxtsc --watch: incremental transpile (50-200ms per file)
  → Rojo serve: WebSocket sync to Studio (immediate)
  → Total round-trip: ~500ms from save to Studio update
```
Hot-reload libraries (Rewire) can sync changes into a running playtest without full restart.

**Playtesting modes in Studio:**

| Mode | How | Use case |
|------|-----|----------|
| **F5 (Play)** | Server + client in one window | Quick single-player testing |
| **Local Server** | Separate windows: Server + N simulated clients | Multiplayer testing locally (with network lag simulation) |
| **Team Test** | Hosts on actual Roblox servers, devs join from Studio | Real-world network/performance testing |

**Automated testing:**

| Tool | Where it runs | Best for |
|------|--------------|----------|
| **Lune** | Terminal (no Studio) | Unit tests of pure logic — fast, CI-friendly |
| **TestEZ** | Inside Studio | Integration/E2E tests with actual game state |
| **MCP (execute_luau)** | Claude Code → Studio | Ad-hoc verification: run Luau assertions, read console |

**MCP for testing workflow:**
- `execute_luau`: Run assertions against game state
- `start_stop_play` / `console_output`: Start playtest, capture logs
- Not a full test framework, but useful for quick verification after changes

#### Publishing & Deployment

**Experience visibility settings:**

| Visibility | Who can access |
|-----------|---------------|
| **Private** | Only you and collaborators |
| **Friends** | Your friends list |
| **Beta** (2025+) | Searchable/linkable but excluded from Recommended — standard soft-launch |
| **Public** | Fully live |

**Audience throttling**: Limit beta access by percentage or region before global rollout.

**CI/CD via Open Cloud API (GitHub Actions):**
- **Universe/Place API**: Push builds to staging or production on PR merge
- **Asset Management API**: Upload images, meshes, audio programmatically
- **DataStore API**: Seed test data or verify player state from CI

#### Publishing & Moderation

**No App Store-style review.** Publishing is instant and free.

**Step-by-step:**
1. Build in Roblox Studio
2. File → Publish to Roblox (set name, description, icons — AI-scanned)
3. Answer ~10-question Maturity Questionnaire (mandatory — unrated games are hidden from under-13)
4. Set visibility (Private → Beta → Public)
5. Game goes live

**Fees:** None to publish. Badges cost 100 Robux each beyond 5/day. Revenue split: developer 70% / Roblox 30%.

**Moderation:** Hybrid AI + human reviewers. Assets are AI-scanned on upload. High-traffic games get post-publish human audits. Violations → game set to Private + account strikes.

**Banned content (all ratings):** Sexual content, gore, real-world tragedies, simulated gambling.

**Developer requirements:**
- ID Verification mandatory for Team Create, selling UGC, 18+ content
- DevEx (cash out): must be 18+, 30,000+ earned Robux, Roblox Premium subscriber

**Child safety (legal obligations):**
- `PolicyService` API: mandatory — hides loot boxes in restrictive regions, social links for under-13
- `TextService` filter: mandatory for any player text input
- Odds disclosure: must show drop rates for randomized paid items

**Japan-specific:** No restrictions on Tokyo themes. Comp-Gacha Ban applies (cannot require collecting all rare paid items to unlock a prize).

#### Age Rating Strategy

**Roblox Experience Guidelines ratings:**

| Rating | Content | Who can play |
|--------|---------|-------------|
| **All Ages** | Minimal violence | Everyone |
| **9+** | Mild fantasy violence | Everyone |
| **13+** | Moderate violence, blood | Everyone (but invisible to parental-restricted under-13 accounts) |
| **18+** | Heavy violence, language | ID-verified 18+ only |

**Under-13 players = ~40% of daily active users:**

| Age Group | Share of DAU |
|-----------|-------------|
| Under 9 | ~20% |
| 9-12 | ~20% |
| 13-16 | ~16% |
| 17+ | ~44% |

**Why ratings matter for discovery:**
- Parents can set a hard ceiling (e.g., "All Ages only") — higher-rated games become completely invisible
- All Ages / 9+ games appear on Home and Charts for **100% of users**
- 13+ games are invisible to under-13 accounts with parental restrictions
- Unrated games are hidden from ALL under-13 users by default

**Tokyo Playground target: 9+**
- Captures entire 9-12 bracket (~20% of platform) without parental consent issues
- No visibility penalty with any age group
- Mild cartoon violence (tag, dodgeball, can kick) is fine at 9+
- Eligible for all ad targeting including under-13
- Game content has nothing that requires 13+
- Complete the Maturity Questionnaire before launch

---

## 9. Reference Games

| Game | Relevance |
|------|-----------|
| **Hello! Tokyo Friends** | Tokyo city in Roblox (by Tokyo Metro Gov + Fleeverse). Photogrammetry + pro 3D modeling |
| **Brookhaven** | Proves city roleplay games work. Solo dev, custom low-poly assets |
| **Livetopia** | Studio team, custom modular kits in Blender |
| **Frontlines / RIVALS** | Visually impressive Roblox games (military FPS) |
| **Doors / Beyond the Dark** | Excellent lighting/atmosphere |
| **Wish Master** | AI-generated player items (64% playtime increase) |

---

## 10. Pre-Development Readiness Review

### Critical Assessment (Codex + Gemini, March 2026)

**Top-line verdict:** Strong concept, but the plan underestimates Roblox-specific production risk. Not ready to code yet — need scope reset and technical spike first.

### MVP Scope: Too Ambitious

Design doc's MVP (3 mini-games + lobby + 12 systems) is **2-3x overscoped** for a 2-person team new to Roblox.

**Realistic MVP for 2 people:**
- 1 polished mini-game (Can Kick) + simple lobby + match loop + persistence + analytics
- Add mini-game #2 only after retention and performance are validated

### Recommended Library Stack (roblox-ts, 2026)

| Layer | Library | Purpose |
|-------|---------|---------|
| Framework | **Flamework** | Dependency injection, Components, Services |
| UI | **@rbxts/react** + **@rbxts/flipper** | React-like UI with spring animations |
| Networking | **Zap** or **Blink** | Buffer-based, type-safe (NOT raw RemoteEvents) |
| State | **@rbxts/reflex** | Redux/Zustand-like state management |
| Data | **ProfileStore** | Session locking, auto-migration, prevents double-spend |
| Cleanup | **Janitor** | Memory leak prevention (event/thread/instance cleanup) |

### Mini-Game Platform Architecture (FSM)

Professional teams use a finite state machine:
```
VotingState → LoadingState → ActiveState → ResultsState → CleanupState
```
Maps to design doc's `Prepare → AssignRoles → StartRound → Tick → EndRound → RewardPlayers → Cleanup`.
Formalize with Flamework Services before writing game logic.

### Roblox-Specific Gotchas

| Gotcha | What to do |
|--------|-----------|
| **Client-server security** | Client sends intent only. Server validates everything (distance, cooldowns, outcomes) |
| **DataStore cooldown** | 6-second-per-key. Use ProfileStore caching layer, not raw DataStore |
| **Connection leaks** | `.Connect()` doesn't auto-cleanup. Use Janitor for all event/thread disposal |
| **StreamingEnabled** | Parts can stream out. Code defensively. Use `RequestStreamAroundAsync` for teleports. Design in from day one — retrofitting is painful |
| **Replication lag** | ~100ms+. Play animations locally first, confirm server-side |
| **Teleport testing** | Cannot test in Studio. Need live/private server testing |
| **Script-per-object trap** | Use CollectionService tags + centralized Flamework Components |
| **Network ownership** | Physics can be exploit vectors if not server-validated |
| **Auto-generated collisions** | Too heavy on imported meshes. Use simplified collision meshes |
| **UI on mobile** | Use Scale (not Offset) — mobile screens vary wildly |
| **Streaming + buildings** | Use `ModelStreamingMode = Atomic` so buildings load entirely or not at all |

### Missing Workflow Items

| Item | Status |
|------|--------|
| Dev/staging/prod place IDs | Not set up |
| CI pipeline (compile + lint + tests) | Not set up |
| Analytics event schema | Not defined |
| Rollback plan / feature flags | Not planned |
| Economy model (earn rate vs spend rate) | Not designed |
| Performance budget / Definition of Done | Not defined |
| Branch strategy tied to place IDs | Not documented |

### Asset Pipeline Risks (Untested)

- Coordinate scale/orientation mismatches when importing PLATEAU data
- Too many unique materials/textures → GPU memory spikes
- Huge monolithic imports hurt streaming and occlusion culling
- Need chunking strategy by district/cell with distance-based visibility
- **Must test one Shibuya chunk on low-end mobile before committing to content production**

### Monetization Timing

- Don't ship monetization first
- Don't leave monetization architecture to post-launch either
- **Right approach:** Design economy hooks now, keep offers disabled. Implement commerce plumbing by late MVP (entitlements, catalog, purchase telemetry). Activate after core loop proves fun.

### First 3 Steps Before Any Code

**Step 1: Scope Reset (half day)**
- Cut to 1 mini-game MVP (Can Kick)
- Define non-negotiable quality bar
- Create "defer" list for everything else

**Step 2: Technical Risk Spike (2-3 days)**
- Set up roblox-ts + Rojo + Flamework project
- Build one vertical test: match flow → persistence → save/load
- Import one PLATEAU Shibuya chunk → test on low-end mobile
- Prove the pipeline works end-to-end

**Step 3: Production Foundation (1 day)**
- Dev/staging/prod place separation
- CI pipeline (compile + lint)
- Analytics event schema definition
- ProfileStore data model design

### Feasibility (Revised)

**Achievable, but must respect the learning curve.** The combination of PLATEAU + Roblox AI + Marketplace makes world-building feasible. The real risk is not art — it's the Roblox-specific systems engineering (client-server security, DataStore, streaming, matchmaking) that trips up first-time developers. The technical spike will reveal how steep the curve actually is.
