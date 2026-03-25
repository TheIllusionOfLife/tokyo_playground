# Roblox Studio Release Notes Research (v654-v710, Jan 2025 - Mar 2026)

Research extracted from release notes pages on [create.roblox.com/docs/release-notes](https://create.roblox.com/docs/release-notes/).
Versions sampled: 654, 658, 662, 666, 671, 676, 680, 685, 690, 695, 705, 708, 710.

## 3D Import (FBX/glTF)

- **v705**: Improved support for importing emissive maps from `.fbx` files. Enhances material property support during FBX import.
- **v710**: `Texture`/`Decal` now have a `Rotation` property for UV map rotations. Shared assets can be loaded to Editables.

No major Universal Importer overhaul, glTF import improvements, or mesh splitting features were found across the sampled versions. The import pipeline remains largely unchanged for this period.

## Streaming and Large Worlds

- **v658**: Fixed sitting characters disconnecting from seats when remote clients stream them out and back in. This is relevant for any seated interactions in a streaming-enabled world.
- **v666**: Streaming LoD meshes now more accurately represent `SurfaceAppearance` alpha blend modes. Important for city buildings using SurfaceAppearance with photogrammetry textures.
- **v710**: Fixed skinned meshes "exploding" when positioned far from origin. Fixed incorrect culling from rapidly changing part CFrame. Fixed trails far from origin rendering with fewer segments.

No changes to `ModelStreamingBehavior`, `StreamOutBehavior`, or core `StreamingEnabled` behavior were found. The streaming system appears stable with no major feature additions in this period.

## Performance

- **v666**: Improved experience join times (general).
- **v676**: Optimized module script loading, reducing memory usage (especially Windows). Improved replication of simulated physics.
- **v680**: Improved Studio performance with large selections. `bulkMove` method is now more performant for moving large instance selections (relevant for dragging city chunks in Studio).
- **v685**: **Raycast optimization: 25-50% faster** across all part types. Significant animation step optimizations. Fixed occlusion culling bug with SpecialMesh/BlockMesh offsets.
- **v695**: Fixed false culling for skinned meshes. Fixed `CanCollide` changes not being respected when a part is inside another's bounding box. Bounding boxes for cylinders/spheres now render logical extent.
- **v705**: Binary size reduction across platforms.
- **v710**: Fixed incorrect culling from rapidly changing part CFrame. Improved texture memory accounting in Developer Console.

### Collision (PreciseConvexDecomposition)

- **v654**: `EditableMesh` improved handling of perfect plane geometries (related to collision mesh generation).
- **v685**: Raycast 25-50% faster against all part types (directly benefits collision checks).
- **v695**: Fixed `CanCollide` changes not being respected when parts overlap bounding boxes. Fixed `PhysicsService:CollisionGroupSetCollidable()` detection issues for nearby objects.
- **v671**: Improved `GeometryService` CSG API robustness.

No specific PreciseConvexDecomposition performance improvements were found. The collision system received bug fixes but no fundamental changes.

## Lighting (Unified Lighting)

- **v658**: Fixed crash in OpenGL with Unified Lighting enabled (stability fix).
- **v685**: Fixed forcefield outlines not appearing on `LightingStyle::Soft` in Desktop.
- **v695**: Changed sun behavior to slowly fade in/out during sunrise/sunset (visual improvement).
- **v710**: Removed invisible sun reflection artifacts on glass with highlights applied.

No major Unified Lighting feature additions or Technology property deprecation was found in this range. Unified Lighting appears to be in maintenance mode with stability fixes.

## Audio

- **v654**: `AudioEcho` updated to use less memory.
- **v671**: **New `AudioRecorder` instance** enabling in-experience audio stream recording with playback via `AudioPlayer`. New `Enum.AudioFilterType.Lowpass6dB` for gentler muffling. Fixed volumetric sound loudness when unparented from parts.
- **v676**: `AudioEcho.RampTime` uses **50% less CPU**. Fixed audible clicking in freshly-created `AudioEmitter`/`AudioListener` with custom attenuation curves. Fixed `Sound` playback failures from rapid Stop/Play calls.
- **v685**: **Dramatically improved `AudioAnalyzer` memory usage.** Fixed timing bug with `AudioPlayer`/`AudioTextToSpeech` ignoring connected wires. Fixed lag spikes when `AudioEmitter`/`AudioListener` are deleted.
- **v690**: New `AudioTremolo` instance (works with `AudioPlayer`/`Wire`). Improvements to adaptive reverb (Acoustic Simulation beta). Audio Discovery Tool now supports randomized assetIds and AudioPlayers.
- **v695**: `AudioFilter` 6dB lowpass is **25% faster**. Fixed `AudioEmitter` spatial offset bug for systems with high channel count.
- **v705**: Fixed audio input device selection resetting between play sessions. Fixed `AudioPlayer:GetWaveformAsync()` skip-ahead/rewind on compressed assets.
- **v708**: **Doppler simulation** added to Sounds (behind "Sound as a Shim" beta). Fixed Acoustic Simulation diffraction pathfinding crash.

## Mobile Performance

- **v695**: **OpenGL ES 2.0 deprecated** (legacy mobile graphics API). This drops support for very old mobile devices.
- **v676**: Fixed GPU mesh rendering on some GPUs running GLES3.
- **v695**: Fixed MicroProfiler drag with touch input.

No mobile-specific performance optimizations were found. The OpenGL ES 2.0 deprecation signals Roblox is moving to a higher baseline for mobile GPUs.

## Materials and Rendering

- **v666**: New `Enum.AlphaMode.TintMask` alpha blend mode for `SurfaceAppearance`.
- **v680**: `AssetService:CreateSurfaceAppearance()` exposed as Studio beta feature (programmatic SurfaceAppearance creation).
- **v708**: **`MaterialVariant.AlphaMode`** beta feature added to Studio, with pending fixes for transparency behavior with Opaque mode and SurfaceAppearance interaction.
- **v710**: `Texture`/`Decal` `Rotation` property added. Fixed water voxel downsampling removing thin voxels. Fixed `ParticleEmitter` orientation in VelocityPerpendicular mode.

## Deprecations and Breaking Changes

- **v695**: **OpenGL ES 2.0 deprecated** (affects oldest mobile devices).
- **v658**: CFrame networking fix: removed restriction clamping networked CFrame positions to +/-1M studs (a positive change for large worlds, though unlikely to matter at city scale).
- **v662**: `Enum.MatchmakingType` added to DataModel (XboxOnly, PlayStationOnly).
- **v680**: `GuiBase2d` child order now preserved consistently across network (could affect UI if relying on arbitrary ordering).

## Miscellaneous (Potentially Relevant)

- **v671**: `ReactionForceEnabled` property added to `LinearVelocity` constraint (relevant for physics-based mini-games).
- **v680**: Camera snapping to 45-degree and 10-degree increments for panning/tilting (Studio workflow improvement).
- **v690**: New `TextGenerator` instance providing LLM-generated text capability. Right-to-left text support permanently enabled.
- **v705**: Fixed network exploit allowing position update blocking between players (security patch, relevant for multiplayer).
- **v710**: Luau intersection types now support extending Roblox API shapes (e.g., `Accessory & { Handle: BasePart }`), useful for roblox-ts type definitions.

## Summary of Impact on Tokyo Playground

**High relevance:**
- Raycast 25-50% faster (v685): directly benefits client-side OBB proximity checks and collision detection
- Audio system improvements across the board: AudioRecorder, AudioTremolo, Doppler, better memory/CPU usage
- SurfaceAppearance alpha mode improvements (v666, v708): affects how photogrammetry textures render on city buildings
- OpenGL ES 2.0 deprecation (v695): can safely assume GLES3+ baseline for mobile players

**Medium relevance:**
- bulkMove performance (v680): helps Studio workflow when moving city chunks
- Streaming LoD mesh alpha mode fix (v666): ensures city buildings stream in/out correctly
- CFrame networking +/-1M stud limit removed (v658): eliminates theoretical large-world constraint
- MaterialVariant.AlphaMode beta (v708): future option for per-building material customization

**Low relevance / No changes found:**
- No Universal Importer or glTF import improvements
- No ModelStreamingBehavior or StreamOutBehavior changes
- No PreciseConvexDecomposition performance changes
- No major Unified Lighting overhaul or Technology property deprecation
- No SLIM mesh or advanced LOD features
