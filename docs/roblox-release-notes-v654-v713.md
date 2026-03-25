# Roblox Studio Release Notes: v655-v670 (Skipping v654, v658, v662, v666)

## Rendering and Lighting

- **v656**: Fixed voxelization of invalid parts and meshes
- **v656**: Fixed rendering bounding box mismatch with physics bounding box for MeshParts
- **v657**: New `Decal.TextureContent` property enables EditableImage integration with decals (Pending)
- **v661**: Fixed Glass material rendering issue in Studio's "Unified Lighting" beta
- **v664**: Resolved quadratic time complexity in mesh render transcode for duplicate normal indices
- **v665**: Improved shader load times on DirectX
- **v667**: Removed lighting calculations from rendering (significant performance optimization)
- **v668**: Fixed Glass refraction issue with unified lighting enabled
- **v668**: Fixed Trail ScaleTo behavior: TextureLength unscaled in Stretch mode; WidthScale never scaled
- **v668**: Studio selections no longer incorrectly counted as Triangles and Drawcalls
- **v670**: SurfaceAppearance lowest LOD now uses specular value for roughness texture calculations

## Mesh and 3D Import

- **v655**: EditableMesh script write speed improved by 20-40%
- **v655**: Fixed inertia data corruption when applying `PartOperation:SubstituteGeometry()`
- **v656**: Bulk Importer error messages now display more information
- **v661**: `AssetService:CreateEditableMeshAsync()` now supports creating editable meshes from existing objects via `Content.fromObject()` (Pending)
- **v665**: Improved memory usage of EditableImage
- **v667**: New EditableMesh vertex accessor methods: `GetVertexFaceColor`, `GetVertexFaceNormal`, `GetVertexFaceUV`, and corresponding setters
- **v667**: Batch vertex retrieval: `GetVertexColors`, `GetVertexNormals`, `GetVertexUVs`, `GetVertexFaces`
- **v667**: Deprecated `GetVerticesWithAttribute` and `GetFacesWithAttribute` in favor of specialized alternatives
- **v668**: Users can specify body mesh, layered clothing, and rigid accessories for Avatar Setup input models
- **v670**: Animation support added to `AssetService.CreateAssetAsync` and `AssetService.CreateAssetVersionAsync`
- **v670**: `ContentProvider:PreloadAsync()` now supports `SurfaceAppearance` and `MaterialVariant` objects

## Streaming and Content Loading

- **v656**: Fixed part streaming causing animation retargeting glitches
- **v660**: New UGC characters support animation retargeting (existing ones do not)
- **v665**: `PreloadAsync` now properly fails on VideoFrame instances outside DataModel
- **v667**: Model LOD flickering on character unseating resolved

## Audio

- **v655**: Fixed `Sound.LoopRegion` malfunction when loop bounds span entire audio asset
- **v659**: Added `AudioAnalyzer.WindowSize` and `AudioPitchShifter.WindowSize` properties for responsiveness vs quality control
- **v659**: AudioPlayer now warns in Output console when sounds fail to load
- **v660**: New `AudioChannelMixer` and `AudioChannelSplitter` for channel layout conversions
- **v660**: New `:GetInputPins()` and `:GetOutputPins()` methods on audio API instances
- **v660**: New `AudioEmitter:GetAudibilityFor()` and `AudioListener:GetAudibilityFor()` methods
- **v660**: Deprecated `AudioPlayer.AssetId` (string) in favor of `AudioPlayer.Asset` (Content type)
- **v660**: Fixed `Sound.DidLoop` triggering multiple times after a loop
- **v661**: Added visual editor for `AudioCompressor` and `AudioLimiter` instances (Pending)
- **v664**: Fixed crash when modifying `AudioAnalyzer.WindowSize` during spectrum reading
- **v667**: Sound playback for frames shorter than one frame corrected
- **v667**: VoiceChatService gains property for default distance attenuation curve configuration

## Physics and Collision

- **v657**: `Workspace.FallHeightEnabled` now correctly toggles fallen height kill plane
- **v657**: Fixed CSG BasePart API crash with solid modeling improvements beta (Pending)
- **v665**: Enhanced `IKControl` solver performance for two-bone configurations
- **v665**: Enabled coordinated re-simulation of physics, datamodel, and scripts
- **v667**: IK tool performance improvements for Body Part mode in Animation Clip Editor
- **v669**: Mouse raycast check performance improved
- **v669**: Solid Modeling buttons now enable/disable correctly when selecting parts via Explorer
- **v670**: Three-phase rollout for updates to the physics sleep system

## Mobile and Platform Performance

- **v655**: Fixed mobile touch jump button failures on character respawn
- **v655**: Fixed dual enter/leave callback invocations for DragDetector on touch devices
- **v655**: Stabilized macOS Studio crashes during monitor switching
- **v657**: Mobile lighting updates improved on PowerVR GPU devices
- **v657**: Android PowerVR GPU performance enhancements
- **v663**: Optimized join times for Android devices running OpenGL ES
- **v663**: `UserInputService.TouchEnabled` now set to `true` for Windows touch devices
- **v668**: Mac Studio now supports pinch-to-zoom
- **v669**: Fixed Explorer dragging state bug

## Performance (General)

- **v655**: Accelerated Studio startup with parallel translation loading
- **v656**: Instance property access overhead reduced by 24-45%
- **v657**: Windows startup time and memory usage reduction
- **v657**: Terrain reading performance improved for small boxes
- **v663**: Reduced memory footprint of paused VideoFrame instances
- **v665**: `FindFirstChildWhichIsA()` optimized by 20x for instances with many children
- **v665**: `Object:IsA()` optimized by 30%
- **v670**: Fixed memory consumption issue where certain code fragments caused infinite Luau analysis

## Terrain and Environment

- **v665**: Grass blade distribution now appears more random with reduced repetition
- **v665**: Fixed terrain rendering bug causing missing or shortened grass on straight lines
- **v665**: Continuous grass blade position updates during Studio terrain editing

## UI and Input

- **v655**: Fixed `UIDragDetector` to properly account for device screen insets
- **v656**: Increased Unreliable Remote Events payload max from 900 to 1000 characters
- **v659**: VideoFrame seeks to desired time positions more efficiently
- **v659**: Chromebook trackpad behavior improved
- **v663**: Camera angle reset issue when switching modes resolved
- **v663**: `DragDetector.RestartDrag` position correction implemented
- **v663**: TranslatePlaneOrLine/TranslateLineOrPlane now support mode switching via ModeSwitchKey
- **v664**: Updated dragging behavior with "Align Dragged Objects" disabled for flush object placement
- **v664**: Fixed UIPageLayout trackpad pan event sinking under Scroll Event Overhaul beta
- **v668**: Rope, Rod, and Spring constraints now visible by default when created via Beta tool
- **v670**: New `CFrame:AngleBetween(cf)` method calculates rotation angle between two CFrames
- **v670**: Added `ImageButton.HoverImageContent` and `ImageButton.PressedImageContent` properties

## API Changes and Deprecations

- **v656**: Added `buffer.readbits` and `buffer.writebits` functions
- **v656**: Added `math.lerp` method for number interpolation
- **v659**: New `ProductPurchaseChannel` field in ProcessReceipt API (Unknown, InExperience, ExperienceDetailsPage)
- **v660**: Deprecated `AudioPlayer.AssetId` in favor of `AudioPlayer.Asset`
- **v660**: Renamed `TestService.Is30FpsThrottleEnabled` to `TestService.ThrottlePhysicsToRealtime`
- **v660**: `WrapDeformer:SetCageMeshContent()` accepts optional CFrame parameter for cage origin alignment
- **v664**: New `Players` capability for Players/Teams services (capabilities system)
- **v667**: Deprecated `GetVerticesWithAttribute` and `GetFacesWithAttribute` on EditableMesh
- **v668**: New `@self` alias for `require-by-string` to access children directly
- **v668**: Deprecated special treatment of ModuleScripts named `Init` or `init`
- **v669**: Support for `deprecated` attribute in Luau functions and table methods
- **v669**: Deprecating WrapLayer/WrapTarget properties: `Puffiness`, `ShrinkFactor`, `Stiffness`
- **v670**: New `CFrame:AngleBetween()` method
- **v670**: `Ray:ClosestPoint()` and `Ray:Distance()` fixed to use unit vector projection
- **v670**: `RunService:IsRunMode()` no longer incorrectly returns true in Play mode servers

## Security

- **v663**: Sandbox escape vulnerability closed for parented items (tools, flags)
- **v669**: `Plugin` type and related Instance types now operate at plugin-level security
- **v669**: Script Capabilities sandboxing allows reading base class properties in derived classes

## Animation and Avatar

- **v657**: Fixed VideoFrame playback failure under CanvasGroup containers
- **v659**: Developers can preview layered clothing on Avatar Bodies created using WrapDeformer before publishing
- **v669**: `Humanoid:BuildRigFromAttachments()` now respects AvatarJointUpgrade rollout
- **v669**: Corrupted animation curves (encoding version 1) automatically repaired
- **v670**: Ragdoll death functionality integrated into Avatar Joint Upgrade
- **v670**: Avatar auto setup no longer uploads models as input, reducing duplicate moderation
# Roblox Studio Release Notes: v672-v689 (Skipping v671, v676, v680, v685, v690)

## 3D Import / Mesh / Modeling

- **v672**: `EditableMesh` skinning & FACS Studio beta introduced; fixed vertex detection, surface query accuracy, barycentric coordinates for EditableMesh
- **v672**: `PartOperation.SmoothingAngle` now affects all edges, not just part boundaries
- **v674**: SolidMesh pipelines now feature material box mapping matching previous versions
- **v674**: Import 3D button added to Next Gen Studio Preview Home tab
- **v678**: Fixes bugs where certain meshes were stuck in Default/Box collision fidelity; fixes initial 0,0,0 sizes forcing large ExtentsSize; optimizes MeshPart and TriangleMeshPart Size setting
- **v682**: New debug visualization for `WrapTarget` cage vertices pre/post-deformation (`WrapTargetDebugMode.PreWrapDeformerCage`)
- **v683**: Performance improvements when rendering skinned EditableMeshes
- **v683**: GeometryService operations now apply correct transformations to special mesh primitives
- **v687**: Convex decomposition technique upgraded for improved in-experience results
- **v687**: Added missing `EditableMesh` method documentation

## Collision / Physics

- **v672**: Pathfinding regression fixed (paths no longer stick to high-cost area edges)
- **v678**: Mesh collision fidelity bugs resolved (meshes stuck in Default/Box)
- **v681**: Pathfinding crash fix: WaypointSpacing zero/negative now clamped to minimum 0.1
- **v682**: Collision detection algorithms optimized, improving frame rates in large scenes and large selection dragging
- **v683**: Constraints now properly affect attachments in folders with ancestral BaseParts
- **v683**: Ray casts on convex decomposition now align with primitive behavior (rays starting inside mesh return no hit)
- **v684**: Optimized very large Atomic/PersistentPerPlayer models with streaming
- **v687**: Jump button deactivation resolved when modifying humanoid JumpPower
- **v689**: `Workspace.AirTurbulenceIntensity` property controls wind velocity field turbulence strength
- **v689**: False occlusion from inactivated terrain meshes eliminated

## Streaming / Networking

- **v679**: Resolved streaming slowdown caused by large model LoD usage
- **v681**: New Net Asset area added to Network Diagnostics Debug panel
- **v684**: Optimized very large Atomic/PersistentPerPlayer models with streaming
- **v688**: Multiple Replication Foci large-distance movements prevent transient stream-out

## Lighting / Rendering

- **v672**: `WireframeHandleAdornment.Thickness` enables variable line thickness
- **v679**: Fixed lighting property migration issues with "Unified Lighting" beta
- **v681**: Tuned scaling behavior of Unified Lighting
- **v681**: Resolved pixel shift on R15 humanoid heads in non-PBR cases
- **v682**: .rbxl files saved with Unified Lighting now use correct lighting technology on older clients
- **v683**: Particles now render at spawn location rather than one simulation step ahead
- **v683**: Light guides display correctly for detached attachments
- **v686**: `Enum.AdornShading` enum for Box/Sphere/Cone/Cylinder HandleAdornments
- **v686**: `Hollow` property added to `ConeHandleAdornment`
- **v687**: Glass material now receives higher quality shader rendering on mobile devices
- **v688**: HandleAdornments now correctly respect Z-index sorting
- **v688**: Resolved UIGradient flickering during specific setup configurations

## Materials / Textures

- **v674**: New TerrainDetail properties: `ColorMapContent`, `MetalnessMapContent`, `NormalMapContent`, `RoughnessMapContent`
- **v677**: Same Content properties added to `MaterialVariant`
- **v677**: `SkyboxOrientation` property added to Sky
- **v679**: `Decal.TextureContent` property enables EditableImage usage with decals
- **v684**: `AssetService:CreateSurfaceAppearance()` renamed to `CreateSurfaceAppearanceAsync()` (now yieldable)
- **v686**: `VideoContent` property for `VideoFrame`
- **v688**: Decal and Texture classes now support Normal, Roughness, and Metalness maps (pending)
- **v688**: Decal UVs support scale and offset adjustments (pending)

## Audio

- **v672**: Preset selection added to AudioEmitter/AudioListener distance attenuation visual editor
- **v672**: Fixed AudioCompressor channel mismatch; fixed rapid AudioPlayer.Asset changes loading wrong asset
- **v674**: Acoustic Simulation area-density calculations reduced CPU usage by up to 20%
- **v674**: AudioRecorder garbage collection issue preventing AudioPlayer loading resolved
- **v677**: Fixed audio engine not properly prioritizing loudest AudioPlayers when thousands play simultaneously
- **v677**: Fixed TimePosition advancing when PlaybackSpeed is 0 for Sound and AudioPlayer (pending)
- **v681**: AudioGate: new instance to remove audio stream portions quieter than a threshold
- **v681**: Short volume ramp on newly-connected Wires to avoid pops and clicks
- **v681**: "Default" device option for input/output audio selection (pending)
- **v682**: Acoustic Simulation beta no longer causes frame drops when emitters/listeners move rapidly toward each other
- **v683**: AudioPlayer volume range expanded from 3 to 10; preview widget added to Asset property
- **v683**: Resolved corrupt audio recording issue
- **v684**: "OOF" reinstated as default death sound
- **v686**: Enhanced acoustic simulation muffling and filtering quality
- **v686**: Reduced per-frame processing time in Sound task with multiple Audio instances
- **v687**: Enhanced diffraction pathfinding for Acoustic Simulation beta near obstacles
- **v688**: Parallelized AudioPlayer, AudioEmitter, and AudioListener updates for significant framerate gains
- **v688**: Voice Chat echo cancellation intermittent failure addressed
- **v689**: `SoundService.AudioPlayerVolumeFix` rollout addresses incorrect AudioPlayer volume playback

## Mobile / Performance

- **v673**: Animation curve evaluation sped up via caching
- **v675**: ~15% performance improvement in Properties Widget for large selections
- **v678**: Textures displaying EditableImages switch to low resolution when system is low on memory
- **v682**: Collision detection algorithms optimized, improving frame rates in large scenes
- **v683**: Skinned EditableMesh rendering performance improved
- **v684**: Optimized very large Atomic/PersistentPerPlayer models with streaming
- **v687**: Glass material now receives higher quality shader rendering on mobile devices
- **v688**: Parallelized audio instance updates for significant framerate gains

## Animation / Rigging

- **v673**: Animation curve evaluation speed up via caching
- **v675**: New `Bone.LocalCFrame` and `Bone.WorldCFrame` properties for skeletal control
- **v688**: `BuildRigFromAttachments()` now respects the AvatarJointUpgrade rollout (pending)

## Input / Controls

- **v672**: Multiple controller support for Xbox and PlayStation
- **v675**: `UserInputService.PreferredInput` to detect user's primary input device
- **v675**: Persistent setting for adaptive camera speed
- **v677**: Gamepad X button now triggers closest *visible* dialog on screen
- **v678**: macOS crash fix when unplugging game controllers
- **v681**: Restored Xbox One wireless haptic support on macOS >=11.0; added Xbox 360 support on macOS >=15.0
- **v687**: Thumbstick InputBinding receives new `ResponseCurve` property
- **v688**: DragDetector callbacks for touch devices now fire single enter/leave sequences
- **v689**: New cursor icon content properties for UIDragDetector, ClickDetector, DragDetector, Mouse, BackpackItem
- **v689**: `HapticEffect` waveform data now correctly replicates server-to-client for Custom type

## UI

- **v674**: Bold/italic tag switching now updates visuals correctly in Rich Text
- **v679**: Client-created parts now destroyed when hitting the killplane
- **v681**: Fixed table layouts not immediately rerendering after cell size updates
- **v684**: `UIContainerQuery` added to Studio Explorer with optimized frame-based rebuilding
- **v684**: TextChannel Metadata parameter max length increased from 200 to 1,000 characters
- **v686**: `GuiService.ViewportDisplaySize` for physical viewport size retrieval
- **v689**: ScrollingFrame scrollbar rendering issues with UICorner resolved
- **v689**: `StyleRule:SetProperty()` auto-converts BrickColor to Color3 and Color3 to ColorSequence

## API / Data / Scripting

- **v672**: `CapabilityControl` allows sandboxed scripts to modify instance capabilities safely
- **v675**: `MemoryStoreQueue:GetSize()` and `MemoryStoreSortedMap:GetSize()` added
- **v677**: `SocialService:GetEventRsvpStatusAsync()` and `PromptRsvpToEventAsync()` for in-experience events
- **v681**: `BasePart:GetRootPart()` deprecated
- **v675**: `TextFilterResult.GetChatForUserAsync` deprecated
- **v684**: DraggerService properties now configurable by plugins (grid snap, collision settings)
- **v686**: Restricted instances like `game.CoreGui` now return nil for scripts without permissions
- **v686**: Tag Editor now works with Rojo workflows
- **v689**: Autocomplete now suggests hot comments/comment directives
# Roblox Studio Release Notes Summary: v691-v713

Versions covered: 691, 692, 693, 694, 696, 697, 698, 699, 700, 701, 702, 703, 704, 706, 707, 709, 711, 712, 713
Skipped (already done): 695, 705, 708, 710

---

## Rendering & Graphics

- **Occlusion culling for lights** added (v691)
- **PointLight/SpotLight/SurfaceLight max range increased to 120** (v692)
- **SLIM rendering fixes**: UV issues, incorrect coloring, SpecialMesh/CylinderMesh compatibility (v696)
- **Emissive map support** added to SurfaceAppearance, MaterialVariant, and TerrainDetail (v697)
- **False culling fixed for skinned meshes** (v702)
- **Solid modeling removes unnecessary geometry**, reducing triangle counts (v707)
- **Spurious occlusion culling of parts far from origin** fixed (v707)
- **Occlusion culling for SpecialMeshes with negative scaling** corrected (v707)
- **MaterialVariant.AlphaMode** added with new Opaque enum value (v704)
- **Enum.Material.ForceField backface outlines** fixed on desktop and console (v694)
- **255 highlights allowed in one scene** (up from previous limit) (v694)
- **SurfaceLight excessive grass glow** on large parts fixed (v700)
- **Color gradients across triangles in solid modeling** fixed (v706)
- **Noisy cloud shadows during sunrise/sunset** fixed (v711)
- **Cylinder part UV rotation** (180 offset on back face) fixed (v711)
- **Normal map shading issues** resolved (v711)
- **SpecialMeshes now correctly display assigned materials and MaterialVariants** (v711)
- **Floating grass geometry** rendering corrected (v712)
- **Double-sided meshes** now render correctly in 3D thumbnails (v712)
- **False culling of parts and characters** fixed (v712)
- **VR false culling** resolved (v712)
- **Grass rendering**: optimized length/density calculations (v713)
- **Cylinder UV stretching on left face** resolved (v713)
- **ParticleEmitter.FlipbookBlendFrames** property added (v711)
- **Render texture debug visualization** variable added (v711)

## 3D Import & Mesh

- **Collisions with very small triangle meshes** (size < 0.05) fixed (v691)
- **Small cylinders/spheres** (diameter < 0.05 studs) no longer disappear when dragged (v692)
- **3D model import crash** fixed with missing/broken content (v702)
- **Smoothing Angle** now functions in Studio (v702)
- **Reimport now supports Decal instances** (v704)
- **WrapTextureTransfer algorithm improved** for better mesh cage fitting (v704)
- **ExtentsSize clamped to 2048 studs** for corrupted mesh collision data (v703)
- **UV scaling for wedge model textures** fixed (v701)
- **OBJ export crash** fixed with emissive maps beta enabled (v699)
- **OBJ export emissive appearance** fixed on some objects (v712)
- **AssetImporter scaling factor** added; stud-to-meter conversion updated from 20:1 to 25:7 (v713)

## Streaming & Replication

- **Entity-based culling enabled for Models with StreamingMesh** (v693)
- **Multiple replication foci no longer prevent region stream-outs** (v694)
- **Late-join animation loading** fixed with streaming enabled (v703)

## Collision & Physics

- **Players no longer push each other off moving platforms** when collision groups disabled (v702)
- **Three-phase rollout for fixed simulation frequency** (v702)
- **Simulation slowdown when adding/removing child instances** fixed (v693)
- **Move/Scale tools handle Snap to Parts correctly** for primitives < 0.05 studs (v700)
- **AirController adjusts to ControllerManager.UpDirection changes** while active (v693)
- **Physics data server-to-client forwarding vulnerability** patched (v706)
- **ParticleEmitter.LockedToPart** malfunction fixed (v711)
- **Jitter when disabling/re-enabling IKControl** with LookAt type resolved (v707)

## Audio

- **Sound:Stop() performance issue** with multiple Sound/AudioPlayer instances fixed (v691)
- **Acoustic Simulation adaptive reverb** causing long audio mix times fixed (v692)
- **Acoustic Simulation** no longer slows physics/framerate (v694)
- **AudioCompressor Sidechain** now allows Wire loops (v696)
- **AudioEmitter/AudioListener frame time reduced** with acoustic simulation (v697)
- **AudioPlayer.AutoPlay** property added for automatic playback on startup (v699)
- **AudioEmitter sleep system** implemented when inputs are silent, reducing CPU (v698)
- **AudioPlayer per-frame performance** improved while playing (v698)
- **AudioEmitter/AudioListener CFrames cached per-frame** for faster 3D panning (v700)
- **Acoustic Simulation** beta reduces overhead from moving parts (v700)
- **AudioFilter Lowpass6dB mode instability** resolved (v703)
- **Acoustic Simulation silence** with large pathfinding values fixed (v704)
- **Acoustic Simulation performance** improved in part-dense environments (v709)
- **Acoustic Simulation pathfinding** in open spaces improved (v701)
- **AudioListener clipping/distortion** removed when no feedback loops (v702)
- **Rapidly creating AudioEmitters/Listeners** no longer causes frametime spikes (v694)
- **Streaming disk assets no longer block** other audio APIs; Mac audio crash resolved (v713)
- **AudioPitchShifter** brief playback of previous audio eliminated (v713)
- **CompressorSoundEffect** invalid audio data issue resolved (v697)

## Performance & Memory

- **Attributes and tags stored more efficiently**, decreasing memory pressure (v691)
- **Instance size reduced by 8 bytes** on 64-bit systems, saving several MBs (v699)
- **Bone instance size reduced by 48 bytes** (v712)
- **GetChildren() 30-65% faster** (v701)
- **Instance returns 30% faster**, with extra gains for GetDescendants/QueryDescendants (v699)
- **QueryDescendants with ClassName matching 2x faster** (v699)
- **GetFullName() faster** and handles deep hierarchies (v711)
- **Property access up to 20x faster** for Vector2, CFrame, RaycastResult, UDim, Color3, NumberRange in native Luau (v701)
- **HttpService JSON** encoding 20-70% faster, decoding 20-140% faster (v700)
- **String concat on constants** now compile-time (v692)
- **Interpolated strings** with constants embedded at compile time (v692)
- **Function inlining improved** for calls with constant arguments (v702)
- **SLIM updateInstancedCluster2 cost lowered** (v702)
- **SLIM memory tracking stats** added (v701)
- **Layered clothing scaling** no longer retriggers fitting, major perf improvement (v713)
- **Layered clothing cache optimizations** property added (v711)
- **Frame rate cap options** added: 160, 165, 180, 200 FPS (v696)
- **MicroProfiler CPU overhead** eliminated when disabled after activation (v693)
- **Animation system optimized** for large articulated rigs (v702)
- **pcall/xpcall recursion depth** extended from 200 to 20,000 (v693)
- **Deferred event execution** limited per-source per frame to prevent crashes (v699)

## Lighting

- **SurfaceLight excessive grass glow** on large parts fixed (v700)
- **Shadow texture offset** handling corrected for transparent materials (v697)
- **Sky object**: 8 new texture content properties (MoonTextureContent, SkyboxBack/Down/Front/Left/Right/UpContent, SunTextureContent) (v703)

## UI & Input

- **UIShadow component** added for drop shadows on parent UI instances (v713)
- **UIScale** correctly scales all UI instances (v700)
- **UIStroke line join mode** respected with rounded corners (v700)
- **UIScale correctly scales border stroke offset** (v698)
- **UIScale correctly scales parent ImageLabel/ImageButton** without affecting TileSize (v693)
- **UIGridLayout crash** when CellSize set to zero fixed (v696)
- **Enum.ScaleType.Fit** scaling past bounds on flipped images corrected (v698)
- **GuiObject.MouseEnter** no longer fires before MouseLeave when quickly moving between objects (v696)
- **Input Action System**: thumbstick deadzone override bug fixed (v693)
- **Mouse support added to iPadOS** (v707)
- **MouseDelta KeyCode** added for Input Action System (v709)
- **MouseWheel, TrackpadPan, TrackpadPinch KeyCodes** added (v711)
- **Gamepad thumbsticks/triggers** now reset properly in IAS (v713)
- **OnScreenKeyboardPosition** now uses DeviceSafeInsets coordinates (v692)
- **GuiService ViewportDisplaySize** corrected on large-screen devices (v713)
- **BillboardGui DistanceLowerLimit/DistanceUpperLimit deprecated** (v698)

## Particles & Effects

- **Custom flipbook layouts** for particles with custom column/row definitions (v694)
- **ParticleEmitter flipbook** now supports layouts without texture size limitations (v699)
- **Emitter particles** no longer disappear prematurely (v698)
- **Staggered particle emission** in continuous streams fixed (v702)
- **Transparent material thumbnails** (ice, etc.) render more accurately (v707)

## Avatar & Clothing

- **Smooth-skinned avatars no longer have seams** at part boundaries during WrapDeformer deformation (v696)
- **WrapDeformers can attach under layered clothing meshes** for deformation before clothing fitting (v696)
- **Layered clothing MeshParts deformed through WrapDeformer** can be published (v696)
- **SLIM support for Classic Clothing on Platform Avatars** (v709)
- **Layered accessory handling** corrected to rely on WrapLayer presence rather than metadata flag (v706)
- **Adaptive Animation**: root-attached parts animation fixed (v709)
- **Adaptive Animation**: model scaling root translation fixed (v713)

## Networking & Diagnostics

- **LR and ISR metrics** added to Network Stats diagnostic (v691)
- **Ping display** in Performance Stats now matches Player:GetNetworkPing() (v699)
- **Network traffic reduced**: direction updates only sent on nontrivial differences (v697)
- **Open Cloud HttpService rate limit**: new 2500 requests/minute tier (v700)
- **DataStore rate limits** now adjustable per DataStoreRequestType (v709)

## Developer Tools & APIs

- **QueryDescendants** method for descendant lookup using query selector strings (v697)
- **QueryDescendants**: :not(), :has(), [$AttributeExists] selectors added (v700)
- **QueryDescendants**: can match enum properties to string values (v712)
- **EncodingService**: Base64, Blake/MD5/SHA hashing, zstd compression (v697)
- **GenerationService:GenerateModelAsync()** added (v699)
- **@game alias** for require-by-string access (v700)
- **vector.lerp()** added to standard Luau library (v694)
- **math.isnan, math.isinf, math.isfinite** added (v701)
- **math.nan, math.e, math.phi, math.sqrt2, math.tau** constants added (v711)
- **const keyword** for Luau variable declarations (v713)
- **Generic type parameter instantiation syntax**: f<<T, U>>() (v702, v704)
- **MicroProfiler**: DPI-aware fonts, multiple font sizes (v696)
- **MicroProfiler**: Luau heap memory breakdown by DataModel (v694)
- **MicroProfiler**: frame range sync and highlighting (v698)

## Deprecations

- **Nearly all yielding methods not ending with Async** deprecated (v702)
- **BillboardGui.DistanceLowerLimit/DistanceUpperLimit** deprecated (v698)
- **DataStore:RemoveVersionAsync()** deprecated (v712)
- **DeveloperMemoryTag.PhysicsParts** renamed to BaseParts (v693)

## Studio Stability

- **Studio unresponsiveness when switching CollisionFidelity** on slow networks fixed (v692, v709)
- **Studio crash** with missing 3D import content fixed (v702)
- **Empty plugin loading** no longer causes crashes (v704)
- **Luau Type Solver memory** optimized, reducing script analysis time and crashes (v713)
