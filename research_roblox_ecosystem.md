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

#### Pipeline 3: UI Design (Figma → Roblox Assistant → Studio)

```
Figma
  ↓ design UI screens (HUD, menus, scoreboards)
Roblox Assistant (Figma-to-Studio MCP)
  ↓ auto-generates ScreenGuis, Frames, Buttons
Roblox Studio
  ↓ refine layout, wire up to scripts
Claude Code (via MCP)
  ↓ writes LocalScripts that drive the UI
```

**Who does what:**
- **You**: Design UI in Figma
- **Roblox Assistant**: Converts Figma → Studio GUI objects
- **Claude Code**: Writes the UI logic scripts

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
  - Design in Figma → Roblox Assistant imports to Studio
  - Claude Code writes UI logic via MCP
```

#### What Lives Where

| Content | Location | Version Control |
|---------|----------|-----------------|
| Game scripts (.ts) | Filesystem → Rojo → Studio | Git (primary source of truth) |
| 3D world, meshes, lighting | Roblox Studio (.rbxlx) | Studio file (not git-tracked) |
| UI layouts | Roblox Studio | Studio file |
| Project config | Filesystem (tsconfig, rojo config) | Git |
| Design docs | Filesystem | Git |
| Figma designs | Figma cloud | Figma versioning |
| PLATEAU source data | Local download | Not tracked (too large) |

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

## 10. Feasibility Assessment for Tokyo Playground

### Strengths
- Mini-game platform pattern is proven on Roblox
- Tokyo theming + neon/stylization works within Roblox visuals
- PLATEAU provides real Shibuya geometry for free (CC BY 4.0)
- Roblox AI reduces prop/material/terrain creation labor
- Design doc already makes smart trade-offs (small MVP, modular systems)

### Risks
- PLATEAU → Roblox pipeline requires Blender proficiency
- AI-generated assets lack artistic consistency (manual curation needed)
- Mobile performance requires careful optimization of city-scale map
- Tokyo-specific assets (school interiors, station details) may need custom creation

### Verdict
**Absolutely achievable.** The combination of PLATEAU base geometry + Roblox AI for props/materials + Marketplace for Japanese items makes this far more feasible than building from scratch. The primary labor is the Blender decimation pipeline and final arrangement/polish in Studio.
