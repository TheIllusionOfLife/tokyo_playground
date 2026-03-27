# Roblox Creator Documentation Research: Tokyo Playground Improvements

Research date: 2026-03-22
Source: https://create.roblox.com/docs

---

## 1. Environment and Lighting

### Lighting Technology

`Lighting.Technology` is deprecated. Use `LightingStyle=Realistic` + `PrioritizeLightingQuality=true` for equivalent of the old Future technology. Set these in Studio Properties panel (not scriptable).

| Property | Value | Notes |
|----------|-------|-------|
| LightingStyle | Realistic | Replaces Technology=Future |
| PrioritizeLightingQuality | true | High-fidelity shadows |
| GlobalShadows | true | Scriptable |
| ShadowSoftness | 0.4 | Scriptable |

### Lighting Properties

| Property | Recommended Value | Notes |
|----------|-------------------|-------|
| `LightingStyle` | Realistic | Required for ShadowSoftness to work |
| `ShadowSoftness` | 0.3-0.6 | Only works with Realistic style |
| `GlobalShadows` | true | Essential for depth in urban environments |
| `Brightness` | 1.0-2.0 (day), 0.5-1.0 (night) | Higher = more contrast |
| `ExposureCompensation` | -0.5 to 0.5 | Negative for darker night, positive for brighter day |
| `OutdoorAmbient` | Warm tones (day), Cool tones (night) | e.g., [255,150,50] day, [80,80,120] night |
| `EnvironmentDiffuseScale` | 0.5-0.8 | Enhances indirect lighting |
| `EnvironmentSpecularScale` | 0.6-0.9 | Makes glass/metal buildings reflect realistically |
| `PrioritizeLightingQuality` | true | Prioritize lighting quality over view distance |
| `ClockTime` / `TimeOfDay` | Script-driven | Must use scripts for day/night cycle; does NOT auto-advance |
| `GeographicLatitude` | 35.66 | Tokyo's actual latitude; affects sun angle |

### Light Sources for City Scene

**PointLight** - For bulbs, lanterns, vending machines.
- `Range`: 8-16 studs for street-level objects
- `Brightness`: 1-3
- `Shadows`: Enable only on important/large lights (performance cost)

**SpotLight** - For street lamps, headlights, directed lighting.
- `Face`: Bottom (for overhead lamps)
- `Angle`: 45-90 degrees
- `Range`: 20-40 studs

**SurfaceLight** - For billboards, screens, signboards, fluorescent panels.
- `Face`: Front
- `Angle`: 60-120
- `Range`: 10-20 studs

**Gotcha**: Enabling `Shadows` on many light sources is expensive. Limit shadow-casting lights to key fixtures (main street lamps, important signs). Disable shadows on small decorative lights.

### Atmosphere

The `Atmosphere` object goes under `Lighting` and controls environmental scattering.

| Property | Day Value | Night Value | Notes |
|----------|-----------|-------------|-------|
| `Density` | 0.3-0.4 | 0.2-0.3 | Higher = less visibility at distance |
| `Offset` | 0.25 | 0.0 | Higher creates horizon silhouettes |
| `Haze` | 1.0-1.5 | 0.5-1.0 | Controls atmospheric haziness |
| `Color` | [200,210,230] | [100,100,140] | Sets atmosphere hue |
| `Glare` | 0.3-0.5 | 0.0-0.1 | Sun glare; needs Haze > 0 |
| `Decay` | [255,230,200] | [50,50,80] | Hue away from sun |

**Gotcha**: Glare requires Haze > 0 to be visible. Decay requires Haze, Glare, and Decay values all above 0.

### Post-Processing Effects

All go under `Lighting` or `Camera`.

| Effect | City Application | Key Settings |
|--------|-----------------|--------------|
| **BloomEffect** | Neon signs, street lights glow | Intensity 0.5-1.0, Size 24-36, Threshold 0.8-1.2 |
| **ColorCorrectionEffect** | Night mood: cool tint, reduced saturation | TintColor [180,190,220], Saturation -0.1, Contrast 0.1 |
| **DepthOfFieldEffect** | Cinematic street views, lobby camera | FarIntensity 0.3-0.5, FocusDistance based on scene |
| **SunRaysEffect** | Streetlight rays through fog/haze | Intensity 0.1-0.3; moves with ClockTime |
| **BlurEffect** | Menu/loading screen focus | Size 10-24 |

### Skybox

Insert a `Sky` object under `Lighting`. Six face properties: `SkyboxBk`, `SkyboxDn`, `SkyboxFt`, `SkyboxLf`, `SkyboxRt`, `SkyboxUp`.

| Property | Notes |
|----------|-------|
| `CelestialBodiesShown` | Toggle sun/moon/stars |
| `StarCount` | Increase for clear night sky; reduce for light-polluted city |
| `SunAngularSize` | 0 to hide sun but keep stars |
| `MoonAngularSize` | Set for Tokyo night ambience |
| `SkyboxOrientation` | Vector3 in degrees, Y-X-Z order. Use modulo 360 for animations. |

**Recommendation**: Use a custom Shibuya-themed skybox with Tokyo city light pollution at night. Low StarCount (200-500) to simulate urban light pollution.

### Clouds

`Clouds` object must be parented under `Terrain`.

| Property | Recommended | Notes |
|----------|-------------|-------|
| `Cover` | 0.3-0.5 | Partial cloud coverage |
| `Density` | 0.3-0.5 | Semi-translucent clouds |
| `Color` | Match time of day | Influenced by Lighting and Atmosphere |

Clouds respond to `GlobalWind` for drift direction and speed.

### Global Wind

`Workspace.GlobalWind` (Vector3) affects terrain grass, clouds, particles (with `WindAffectsDrag`), Fire, and Smoke.

Recommended for Shibuya: `Vector3.new(5, 0, 3)` for gentle city breeze. Script dynamic gusts for weather variety.

---

## 2. Streaming and Performance

### StreamingEnabled Configuration

**Critical for a 5000+ MeshPart city**. StreamingEnabled cannot be set by script; set in Studio on Workspace.

| Property | Recommended Value | Notes |
|----------|-------------------|-------|
| `StreamingEnabled` | true | **Mandatory** for large city |
| `StreamingMinRadius` | 128-256 | High-priority radius; higher = more memory |
| `StreamingTargetRadius` | 512-1024 | Max streaming distance; smaller = less server load |
| `StreamOutBehavior` | Opportunistic | Aggressively removes parts beyond target radius; **essential for 5000+ parts** |
| `ModelStreamingBehavior` | Improved | Models only sent when needed; faster join times |

### Per-Model Streaming (ModelStreamingMode)

| Mode | Use Case |
|------|----------|
| `Default` / `Nonatomic` | Most city buildings; stream parts individually |
| `Atomic` | Cohesive units: vehicles, NPCs, vending machines, signs. All parts stream together. |
| `Persistent` | **Sparingly**: spawn area, game UI anchors, always-needed objects. Never stream out. |
| `PersistentPerPlayer` | Player-specific persistent objects |

**Gotchas**:
- Avoid large Persistent models. "Avoid creating catch-all persistent models with a large number of sub-models."
- Minimize 3D content in `ReplicatedStorage`; it cannot stream and loads for everyone.
- Assembly behavior: all parts of an assembly stream in together, but won't stream out until ALL parts are eligible.
- Expect ~10ms delay between server creation and client replication. Use `WaitForChild()`.
- Call `Player:RequestStreamAroundAsync()` before teleporting characters.
- Monitor `Player.GameplayPaused` for custom loading UI.

### Level of Detail (LOD)

**SLIM Meshes (Beta)** - Automatic low-poly composites generated by Roblox.
- Set `ModelLevelOfDetail` to SLIM on Model instances
- Engine generates multiple complexity levels automatically
- Progressive quality based on camera distance
- Only works for static meshes (not skinned/animated)
- Best when models group spatially related parts (e.g., one building = one Model)

**StreamingMesh (Imposter)** - Low-res mesh shown when model is streamed out.
- Looks best at 1024+ studs
- No texture support; smooth mesh only
- Not collidable; no physics or raycasting
- Good for distant Shibuya skyline buildings

**Recommendation**: Use SLIM for important nearby buildings, StreamingMesh for distant skyline filler.

---

## 3. 3D Import Pipeline

### 3D Importer

Supported formats: **FBX (.fbx)**, **glTF (.gltf)**, **OBJ (.obj)**.

| Format | Capabilities |
|--------|-------------|
| FBX | Multiple meshes, hierarchies, PBR textures, rigging, animation, vertex colors |
| glTF | Same as FBX (feature parity) |
| OBJ | Basic single mesh only |

**Key import settings for PLATEAU buildings**:
- `Scale Unit`: Studs (default)
- `Merge Meshes`: Enable for single-building imports to reduce part count
- `Anchored`: Enable for static city buildings
- `Import Only As Model`: Enable for organized hierarchy
- `Invert Negative Faces`: Check if normals are flipped
- `Set Pivot to Scene Origin`: Enable for consistent placement
- Bulk import queue for multiple buildings

### Mesh Specifications

| Limit | Value |
|-------|-------|
| Max triangles per mesh | **20,000** |
| Max texture resolution | **4096x4096** (with streaming) |
| Max bone influences per vertex | 4 |
| UV sets per component | 1 |
| UV coordinate space | 0:1 |
| Supported texture formats | .png, .jpg, .tga, .bmp |
| Geometry | Must be watertight, no N-gons |

### Texture Resolution Guidelines

| Object Size | Recommended Resolution |
|-------------|----------------------|
| 5x5 studs | 256x256 |
| 10x10 studs | 512x512 |
| 20x20 studs | 1024x1024 |
| Larger | Up to 4096x4096 |

Memory scales quadratically: 1024x1024 = 4x memory of 512x512.

### SurfaceAppearance (PBR)

Insert as child of MeshPart. **Cannot be modified by scripts at runtime** (engine pre-processes textures).

| Map | Property | Format | Notes |
|-----|----------|--------|-------|
| Albedo | `ColorMap` | RGB 24-bit | `_ALB` suffix; avoid baking lighting into it |
| Normal | `NormalMap` | RGB 24-bit | `_NOR` suffix; **OpenGL format only** (not DirectX) |
| Roughness | `RoughnessMap` | Grayscale 8-bit | `_RGH` suffix; add +0.1 roughness to compensate Fresnel |
| Metalness | `MetalnessMap` | Grayscale 8-bit | `_MET` suffix; use 0.0 or 1.0, avoid mid-values |

**AlphaMode options**: Opaque, Overlay, Transparency, TintMask.

**TintMask**: Use for color-variant buildings. Single grayscale ColorMap + Color property tinting = memory savings for recolored buildings.

**Gotcha**: Test PBR across multiple lighting conditions. "Avoid adjusting material values to look better in one specific lighting situation."

---

## 4. Physics and Collision

### CollisionFidelity Performance Ranking

| Fidelity | Speed | Accuracy | Use Case |
|----------|-------|----------|----------|
| **Box** | Fastest | Lowest | Small/anchored city props, decorations, distant buildings |
| **Hull** | Fast | Moderate | Simple convex shapes (benches, bollards) |
| **Default** | Moderate | Good | Buildings with doors/walkways (supports concavity) |
| **PreciseConvexDecomposition** | Slowest | Highest | Complex interactive geometry only |

**For 5000+ part city**: Use Box for the vast majority of buildings (especially ones players walk on top of or around). Use Default only for buildings with playable interiors (doorways, tunnels). **Never use PreciseConvexDecomposition at scale.**

### Collision Filtering

| Property | Default | Recommendation |
|----------|---------|---------------|
| `CanCollide` | true | Disable on decorative parts (signs, lights above head height) |
| `CanTouch` | true | **Set false** on non-interactive parts. Saves performance. |
| `CanQuery` | true | Set false on parts that don't need raycasting |

**CollisionGroups**: Use named groups for filtering. Example groups for the project:
- `Players` - player characters
- `Buildings` - static city geometry
- `Vehicles` - Hachi and other vehicles
- `Triggers` - invisible trigger volumes (CanCollide=false, CanTouch=true)
- `Decorations` - non-collidable props (CanCollide=false)

Parts within non-colliding groups pass through each other even if both have CanCollide=true.

### Physics Optimization

| Setting | Recommendation |
|---------|---------------|
| Physics stepping | Adaptive (default); do NOT use Fixed (4x compute) |
| Anchored | Anchor ALL static city geometry |
| Network ownership | Server-owned by default; only grant client ownership when needed |

---

## 5. Audio

### New Audio API (Recommended)

The modern audio system uses `AudioPlayer` -> `Wire` -> `AudioEmitter` -> `AudioListener`.

**Setup pattern for city ambient sounds:**

1. Create a `Part` or `Attachment` at the sound source location
2. Add `AudioPlayer` (the sound source) and `AudioEmitter` (spatializer) as children
3. Add `Wire` connecting AudioPlayer output to AudioEmitter input
4. AudioListener is auto-created on player cameras

**Key AudioEmitter properties:**

| Property | Description | City Use |
|----------|-------------|----------|
| `AcousticSimulationEnabled` | Occlusion, diffraction, reverb | **Enable** for realistic building sound blocking |
| `AudioInteractionGroup` | String; limits which listeners can hear | Zone-based audio (indoor vs outdoor) |
| `DistanceAttenuation` | Volume-over-distance curve | Customize per source type |
| `AngleAttenuation` | Directional volume | Speakers, announcements |

**Acoustic simulation**: When enabled on both emitter and listener, provides:
- **Occlusion**: Sound muffled through walls
- **Diffraction**: Sound bends around corners
- **Reverberation**: Automatic environment reverb

This is extremely valuable for Shibuya's dense building layout.

### Legacy Sound Objects

Still functional. Place as child of BasePart for positional audio.

| Property | Recommended |
|----------|-------------|
| `RollOffMode` | InverseTapered (natural city feel) |
| `RollOffMinDistance` | 10-20 studs (close sounds) |
| `RollOffMaxDistance` | 100-200 studs (ambient), 50-100 (point sources) |
| `Volume` | 0.3-0.8 (ambient), 0.5-1.0 (effects) |
| `Looped` | true for ambient sounds |

### Audio Dynamic Effects

| Effect | City Application |
|--------|-----------------|
| `ReverbSoundEffect` | Underground passages, alleyways, open streets (different reverb per zone) |
| `EqualizerSoundEffect` | Muffle sounds when underground or inside buildings |
| `CompressorSoundEffect` | Consistent volume across many simultaneous city sounds |
| `EchoSoundEffect` | Tunnels, underpasses, between tall buildings |

### City Soundscape Plan

- **Ambient loops**: Traffic hum, crowd murmur, train announcements (low volume, large RollOff)
- **Point sources**: Vending machines, arcade sounds, specific shop music
- **Zone-based**: Underground = reverb + EQ muffling; outdoors = open reverb
- **SoundGroups**: Group all ambient sounds for unified volume control

---

## 6. Visual Effects

### ParticleEmitter

| Property | Notes |
|----------|-------|
| `Rate` | Max 400/sec (100 on mobile). Keep low for performance. |
| `Lifetime` | 0-20 seconds |
| `LightEmission` | 1.0 for additive blending (neon glow, fire) |
| `LightInfluence` | 0 for self-lit particles (signs at night) |
| `Orientation` | FacingCamera (default), VelocityParallel for rain |
| `WindAffectsDrag` | true + Drag > 0 for wind-responsive particles |
| `Flipbook` | Grid4x4 or Grid8x8 for animated textures (fire, smoke) |

**City night effects:**

| Effect | Setup |
|--------|-------|
| Neon glow haze | LightEmission=1, large Size, low Rate, SpreadAngle [180,180] |
| Rain | Cylinder shape, downward Acceleration, VelocityParallel orientation, high Speed |
| Fog/mist | Large particles, low opacity, low Rate, WindAffectsDrag=true |
| Sparks/fireflies | Small Size, high Speed, short Lifetime, LightEmission=1 |

**Performance warnings:**
- Large particle Size = fill-rate cost on GPU
- Many overlapping transparent particles = overdraw
- Flipbook textures consume significant memory; reuse across effects
- Test on mobile Quality Level settings

### Beams

Beams render textures between two `Attachment` objects. Good for:
- Neon sign outlines
- Light shafts from windows
- Searchlight cones
- Laser effects

| Property | Notes |
|----------|-------|
| `Width0` / `Width1` | Taper for cone effects |
| `CurveSize0` / `CurveSize1` | Bezier curve for arcing beams |
| `FaceCamera` | true for always-visible beams |
| `LightEmission` | 1.0 for glow |
| `TextureLength` + `TextureMode` | Wrap for repeating, Stretch for single |

### Highlight

The `Highlight` object draws outlines and fill overlays on instances.

| Property | Notes |
|----------|-------|
| `FillColor` / `FillTransparency` | Solid overlay on objects |
| `OutlineColor` / `OutlineTransparency` | Silhouette outline |
| `DepthMode` | AlwaysOnTop or Occluded |

**Limit**: Max 255 simultaneous Highlights. Delete when not in use (disabled Highlights still occupy slots).

**Use in project**: Highlight interactable objects, mini-game targets, Hachi when selectable.

### Neon Material

Parts with `Material = Enum.Material.Neon` emit light and glow, especially with BloomEffect. Use for:
- Sign text elements
- Vending machine screens
- Traffic lights
- Club/arcade entrance lighting

Combined with BloomEffect, Neon parts create convincing city nightlife glow.

---

## 7. Terrain

### Using Terrain for City Gaps

Terrain uses 4x4x4 stud voxels. Useful for:
- Ground plane under/between buildings
- Small parks/green areas with animated Grass
- Water features (fountains, drainage channels)

| Property | Recommended |
|----------|-------------|
| `Decoration` | true (enables animated grass) |
| `GrassLength` | 0.3-0.5 (urban trimmed grass) |
| `WaterColor` | Dark blue-grey for urban water |
| `WaterReflectance` | 0.5-0.7 |
| `WaterTransparency` | 0.3-0.5 |
| `WaterWaveSize` | 0.1-0.3 (calm urban water) |
| `WaterWaveSpeed` | 10-30 |

### Custom Materials (MaterialVariant)

Create custom materials via `MaterialService` > `MaterialVariant`. Essential for a realistic Shibuya:

| Custom Material | Base Material | Use |
|----------------|---------------|-----|
| Wet asphalt | Asphalt | Main roads (custom ColorMap with dark wet look) |
| Sidewalk concrete | Concrete | Pedestrian areas |
| Crosswalk paint | Concrete | Shibuya crossing (white stripe pattern) |
| Park grass | Grass | Green areas between buildings |

**Setup**: Create MaterialVariant under MaterialService, assign PBR texture maps (ColorMap, NormalMap, RoughnessMap, MetalnessMap), set "Studs Per Tile" for tiling scale.

**For terrain**: Set as "material override" to globally replace a base material everywhere it appears.

**Adaptive materials**: Parts store material by name, so you can swap entire material sets (day/wet/night variants) without modifying parts.

**Physical properties priority**: Part CustomPhysicalProperties > MaterialVariant physics > Material override physics > Base material defaults.

---

## 8. Camera

### Camera Properties

| Property | Notes |
|----------|-------|
| `CameraType` | Set to `Scriptable` for full manual control |
| `CFrame` | Position and orientation; update every frame |
| `FieldOfView` | 1-120 degrees (default 70); lower = zoom, higher = wide angle |
| `Focus` | Point camera looks at; update every frame for optimal detail rendering |

### StarterPlayer Camera Settings

| Property | Recommendation |
|----------|---------------|
| `CameraMaxZoomDistance` | 25-50 for city exploration |
| `CameraMinZoomDistance` | 5-10 |
| `CameraMode` | Classic (allows zoom in/out) |
| `DevCameraOcclusionMode` | Zoom (camera moves closer when building blocks view) |

### Cinematic Camera Patterns

For lobby/intro sequences:
1. Set `CameraType = Enum.CameraType.Scriptable`
2. Animate `CFrame` using `TweenService` or manual interpolation
3. Use `DepthOfFieldEffect` for focus pulls
4. Lower `FieldOfView` to 40-50 for telephoto compressed city views
5. Higher `FieldOfView` (80-90) for dramatic wide shots

**Gotcha**: When using Scriptable mode, update `Camera.Focus` every frame for optimal visual detail rendering near the camera.

---

## 9. Mobile Optimization

### Performance Budgets

| Metric | Budget |
|--------|--------|
| Target FPS | 60 (16.67ms per frame) |
| ParticleEmitter Rate | Max 100/sec on mobile (400 on desktop) |
| Highlight instances | Max 255 total |
| Texture resolution | Prefer 256x256 for minor objects, 512x512 standard |

### Draw Call Optimization

The engine uses **instancing** to collapse identical MeshParts into single draw calls when they share the same mesh asset and texture.

**Actionable for our project:**
- Reuse the same MeshId across identical objects (street lights, bollards, railings, benches)
- Same MeshId + same TextureID = single draw call for all instances
- View draw calls: Shift+F2 (Render Stats > Timing)

### Texture Memory

- Memory scales quadratically: 1024x1024 = **4x** the memory of 512x512
- Most small objects: 256x256 max
- Standard objects: 512x512 max
- Only hero buildings/prominent features: 1024x1024
- Use SurfaceAppearance TintMask to reuse single textures with color variants

### MeshPart Optimization

| Setting | Recommendation |
|---------|---------------|
| `RenderFidelity` | **Automatic** (default). Engine reduces detail at distance. |
| `CollisionFidelity` | **Box** for most parts |
| `CastShadow` | **false** for small/distant parts |
| `CanTouch` | **false** for non-interactive parts |
| `CanQuery` | **false** for non-raycast parts |
| `Anchored` | **true** for all static geometry |

### RenderFidelity Distance Thresholds (Automatic mode)

| Distance | Detail Level |
|----------|-------------|
| < 250 studs | Highest |
| 250-500 studs | Medium |
| > 500 studs | Lowest |

### Humanoid Optimization

- Disable unused `HumanoidStateType` values to reduce overhead
- Use `AnimationController` instead of `Humanoid` for static NPCs
- Layered clothing avatars are computationally expensive; limit in dense scenes

### Physics Optimization

- Use **Adaptive** stepping (default). Fixed mode = 4x computation.
- Anchor all static geometry
- Box CollisionFidelity for non-interactive parts
- Disable CanTouch on parts that don't need Touched events

### MicroProfiler Scopes to Watch

| Scope | What It Indicates |
|-------|-------------------|
| `RunService.PreRender` | Script execution cost |
| `physicsStepped` / `worldStep` | Physics compute |
| `LightGridCPU` / `ShadowMapSystem` | Lighting/shadow cost |
| `updateInvalidatedFastClusters` | Avatar instantiation (>4ms = problem) |
| `Prepare` / `Perform` / `RenderView` | Overall rendering |

---

## 10. New/Recent Features (2025-2026)

### SLIM Meshes (Beta)

Scalable Lightweight Interactive Model. Roblox auto-generates progressive LOD composites for streamed-out models. Set `ModelLevelOfDetail` on Model instances. Dramatically improves distant city appearance without manual LOD creation.

### glTF Import Support

The 3D Importer now supports `.gltf` files with full feature parity to FBX (multiple meshes, PBR textures, rigging, animation, vertex colors). This opens up more pipeline options for PLATEAU data.

### AudioEmitter Acoustic Simulation

`AcousticSimulationEnabled` on AudioEmitter provides automatic occlusion, diffraction, and reverberation. Huge improvement for a dense city environment where sounds should be blocked by buildings.

### ModelStreamingBehavior: Improved

New streaming mode where models only send to clients when needed, potentially faster join times. Set on Workspace.

### Import Queue System

Bulk import multiple FBX/glTF files simultaneously with individual configuration and presets. Huge time saver for importing hundreds of PLATEAU buildings.

### StreamOutBehavior: Opportunistic

Aggressively removes regions beyond StreamingTargetRadius even without memory pressure. Essential for 5000+ part worlds.

### MaterialVariant / Adaptive Materials

Custom PBR materials with physical properties. Parts store material by name, enabling global aesthetic swaps (day/night/rain variants) without modifying individual parts.

### SkyboxOrientation

Animate skybox rotation with Vector3 degrees. Enables spinning/tilting sky for dramatic effects.

### Highlight Object

Up to 255 simultaneous highlighted objects with fill and outline customization. DepthMode allows always-on-top or occluded rendering.

---

## 11. Game Design

### Onboarding
- Get players into a mini-game within **~60 seconds**. Visual hints over text.
- D1 retention is the key metric. If players don't play a mini-game in session 1, they don't return.
- Design for "tourists" (instant fun in lobby) and "locals" (deep progression). Most locals start as tourists.

### Session Design
- Mobile-first UI is non-negotiable for 9-15 age group. Minimalist, icon-heavy, contextual buttons only.
- Content cadence: under 3 weeks effort per release. Focus on art variants (recolors, seasonal cosmetics).

## 12. Monetization

### Critical Gotchas
- **Subscriptions are unavailable in Japan.** Rely on Game Passes, Developer Products, and Immersive Ads for JP players.
- **Under-13 players see ad fallbacks.** Ages 9-12 in the target range won't see ads.
- **ProcessReceipt is the ONLY safe callback** for Developer Products. Never use `PromptProductPurchaseFinished`.

### Opportunities
- **Immersive Ads fit Shibuya perfectly.** Real-world Shibuya is covered in billboards. Ads feel native.
- Month 2+ subscription payout jumps to 100% (from 70%). Subscriber retention is extremely valuable for international audience.
- Contextual purchases: pre-play shop (train station before mini-games), 3D vending machines in lobby.

## 13. Localization

- Automatic translation covers Japanese and English (15 languages total).
- Source in English, auto-translate to Japanese, manually review critical strings.
- Environmental Japanese text (signs, posters) should be **image-based textures, not UI text**, so they are NOT translated and preserve Shibuya atmosphere.

## 14. Matchmaking

- Language-based matchmaking is built-in as a default signal. Boost its weight to naturally separate JP and EN communities.
- Custom skill-based and game-mode signals via `MatchmakingService:SetServerAttribute()`.
- `TeleportService` does NOT work in Studio. Must test in published client.
- `SetTeleportGui()` enables custom loading screens. Perfect for Shibuya train/subway transition theme.

## 15. Art and Assets

### Mesh and Texture Specs
- Max triangles per MeshPart: **20,000**. Per rigid accessory: **4,000**.
- Geometry must be watertight, no backfaces. Photogrammetry cleanup is mandatory.
- Normal maps must be **OpenGL format**, not DirectX. Flip green channel if needed.
- `SurfaceAppearance` cannot be modified via scripts at runtime.
- **TintMask** alpha mode on SurfaceAppearance: recolor buildings per mini-game theme. Zero performance cost.

### Asset Upload Limits (per 30 days)
| Type | Verified Account | Unverified |
|------|-----------------|------------|
| Meshes | 200 | **10** |
| Images | 200 | 10 |
| Audio | 100 | 10 |

**Verify account immediately.** 10 meshes/month is impossible for a photogrammetry city.

### Packages System
- Convert buildings to Packages for versioning, auto-update, cross-experience sharing.
- Instance attributes at package root become "configurations" (preserved during updates).
- **Ownership cannot be transferred** after creation. Use group ownership for team projects.

## 16. Avatar and Animation

### Rigid Accessories (for cosmetics)
- Under 4,000 triangles. Party hats, festival masks, props.
- Material must be Plastic, Transparency must be 0.
- Use `_Att` suffix in Blender for auto-attachment conversion on import.

### Layered Clothing
- Requires mesh + rigging + inner cage + outer cage + textures.
- Fits all body types automatically. More work than rigid accessories but better results.
- Use for team uniforms, yukatas, Shibuya fashion items.

### Animation Priorities (highest to lowest)
1. Action4 (celebrations, wins)
2. Action3/Action2/Action (game actions)
3. Movement (walk, run)
4. Idle (lobby poses)
5. Core

### Animation Events
- `AnimationTrack:GetMarkerReachedSignal("EventName")` for syncing footstep sounds to surfaces.
- Looping gotcha: duplicate first keyframe as last for smooth loops.

### IK Controls
- `IKControl` for terrain adaptation on Shibuya slopes/stairs.
- Head tracking toward players or points of interest.
- Arms reaching for grab/tag mechanics.

## 17. Performance Deep Dive (5000+ MeshParts)

### Draw Call Optimization
- **Instancing**: identical MeshParts (same MeshId + same texture) collapse to 1 draw call.
- Audit for duplicate geometry with different asset IDs. Maximize reuse for street furniture.

### CollisionFidelity Budget
| Setting | Cost | Use For |
|---------|------|---------|
| Box | Lowest | 95% of city parts |
| Hull | Medium | Simple convex shapes |
| Default | High | Concave walkable areas |
| PreciseConvexDecomposition | Highest | **Avoid at scale** |

Build invisible collision geometry from Box-fidelity parts for walkable surfaces.

### Critical Flags for Non-Interactive Parts
- `CanTouch = false` (saves Touched event overhead)
- `CanQuery = false` (saves raycast overhead)
- `CastShadow = false` on small/distant parts
- `Anchored = true` on ALL static geometry

### Streaming Configuration
| Property | Value | Why |
|----------|-------|-----|
| StreamOutBehavior | Opportunistic | Actively removes beyond target radius |
| ModelStreamingBehavior | Improved | Models only sent when needed |
| StreamingTargetRadius | 512 studs | Balance visibility vs memory for dense city |
| Per-model mode | Atomic | Buildings load/unload as complete units |

### Diagnostic Tools
| Tool | Shortcut | Purpose |
|------|----------|---------|
| MicroProfiler | Opt+Cmd+F6 | Frame timing breakdown |
| Developer Console | Cmd+F9 | Memory, network, scripts |
| Render Stats | Shift+F2 | Draw calls, triangle counts |

MicroProfiler colors: Orange=CPU, Blue=GPU, Red=GPU+Wait>2.5ms.

---

## Priority Action Items for Tokyo Playground

### High Priority (Do Now)

1. **Enable StreamingEnabled** with Opportunistic StreamOutBehavior, Improved ModelStreamingBehavior, 512 stud target radius
2. **Set CollisionFidelity to Box** on 95% of city parts. Build invisible collision geometry for walkable surfaces.
3. **Set CanTouch=false, CanQuery=false** on all non-interactive city geometry
4. **Set CastShadow=false** on small/distant decorative parts
5. **Use Realistic LightingStyle** (set in Studio)
6. **Set RenderFidelity to Automatic** on all MeshParts (engine handles LOD)
7. **Anchor ALL static geometry**
8. **Verify Roblox account** for 200 mesh uploads/month (unverified = 10)

### Medium Priority (Next Sprint)

9. **Group buildings into Atomic Models** for streaming. Each building loads/unloads as complete unit.
10. **Onboarding flow**: get players into first mini-game within 60 seconds
11. **Add Atmosphere + DepthOfFieldEffect** to mask LOD transitions and streaming pop-in
12. **Add post-processing**: BloomEffect (neon glow), ColorCorrectionEffect (mood)
13. **Set up AudioEmitter spatial audio** with city ambient sounds (traffic, crowds, trains)
14. **Maximize mesh instancing**: ensure identical street furniture shares MeshId
15. **Immersive Ads**: fits Shibuya billboards naturally. Set up ad portals/image ads.
16. **Localization**: source in English, auto-translate to Japanese. Keep sign textures as images (not UI text).

### Lower Priority (Polish)

17. **Matchmaking**: boost language signal weight to separate JP/EN communities
18. **Custom MaterialVariants** for wet asphalt, sidewalk concrete, crosswalk paint
19. **Add Clouds** under Terrain with GlobalWind for atmospheric drift
20. **Cinematic camera** for lobby intro (Scriptable CameraType, FieldOfView 40-50 for telephoto city shots)
21. **Animation events** for footstep sounds on different Shibuya surfaces
22. **IK controls** for terrain adaptation on slopes/stairs
23. **Day/night cycle** with ClockTime + lighting transitions
24. **TintMask** on SurfaceAppearance for recolorable building variants per mini-game
25. **Rigid accessories**: party hats, festival masks, Shibuya fashion items (under 4k tris)
26. **SetTeleportGui** for train/subway themed loading screens between mini-games
