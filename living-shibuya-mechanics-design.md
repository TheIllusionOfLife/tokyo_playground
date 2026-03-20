# Living Shibuya — Mechanics Design Document

Implementation-ready design spec for the three Living Shibuya pillars.
Targets the existing roblox-ts + Flamework + Rojo architecture.

---

## Table of Contents

1. [Day/Night Cycle](#1-daynight-cycle)
2. [Stamp Rally System](#2-stamp-rally-system)
3. [NPC Routine System](#3-npc-routine-system)
4. [Hachi Ambient Reactions](#4-hachi-ambient-reactions)
5. [Micro-Event System](#5-micro-event-system)
6. [New Network Events](#6-new-network-events)
7. [Data Schema Changes](#7-data-schema-changes)
8. [New Mission Types](#8-new-mission-types)
9. [Constants Reference](#9-constants-reference)
10. [Flamework Architecture](#10-flamework-architecture)
11. [Performance Budget](#11-performance-budget)
12. [Testing Criteria](#12-testing-criteria)

---

## 1. Day/Night Cycle

### Purpose
Sets the mood for the entire Living Shibuya experience. Affects NPC behavior, ambient audio, Hachi reactions, stamp availability, and visual atmosphere.

### Core Design
The cycle runs on **server time** (synchronized to all clients). One full day = **20 real minutes**. The cycle only runs during `GameState.Lobby` — matches use fixed lighting.

### Time Phases

| Phase | Server Clock Range | Duration | Lighting Profile |
|---|---|---|---|
| Morning | 0:00 – 4:00 | 4 min | Warm sunrise, long shadows, soft orange |
| Daytime | 4:00 – 10:00 | 6 min | Bright, clear, full saturation |
| Golden Hour | 10:00 – 12:00 | 2 min | Deep amber, warm highlights, lens flare |
| Evening | 12:00 – 15:00 | 3 min | Purple-pink sky, neon signs turn on |
| Night | 15:00 – 19:00 | 4 min | Dark blue, lanterns + neon, puddle reflections |
| Dawn | 19:00 – 20:00 | 1 min | Gradual brightening, transition to Morning |

### Implementation

**Server** (`DayNightService`):
- Heartbeat increments `serverClock` (0.0 – 20.0 minutes, wrapping)
- Broadcasts `timeOfDayChanged(phase: TimePhase, normalizedTime: number)` every time phase changes (6 events per cycle)
- Also broadcasts `timeSync(serverClock: number)` every 60 seconds for client interpolation drift correction

**Client** (`DayNightController`):
- Maintains local clock, interpolated from last server sync
- Tweens `Lighting` properties (Ambient, OutdoorAmbient, ClockTime, Brightness, ColorShift_Top) using predefined keyframes per phase
- Toggles tagged objects: `"NeonSign"` emissive on at Evening, `"Lantern"` PointLight on at Night, `"SunShaft"` beam on at Golden Hour

### Balance Parameters

| Parameter | Value | Range | Rationale |
|---|---|---|---|
| `DAY_CYCLE_MINUTES` | 20 | 10 – 30 | 20 min = ~3 full cycles per average 60-min session. Enough to notice change without feeling rushed |
| `GOLDEN_HOUR_DURATION` | 2 min | 1 – 3 | Short enough to feel special, long enough to find a stamp spot |
| `NIGHT_DURATION` | 4 min | 3 – 6 | Longest "mood" phase. Night events and NPC variants need breathing room |
| `LIGHTING_TWEEN_DURATION` | 8 sec | 4 – 15 | Smooth transition, not jarring pop |

### Interaction with Matches
When `GameState` transitions to `Playing`, the server sends `lightingOverride(preset: "match")` to freeze lighting at a neutral daytime preset. When returning to `Lobby`, client tweens back to current cycle position.

---

## 2. Stamp Rally System

### Purpose
Give exploration purpose and long-term collectibility. The スタンプラリー (stamp rally) mechanic is culturally resonant for Japanese players and maps naturally onto discovery gameplay.

### Core Design
30+ hidden spots across the Shibuya map, each marked by an invisible trigger zone. Walking Hachi (or your character) into the zone for the first time discovers the stamp. Stamps persist in player data. Completing stamp sets unlocks exclusive cosmetics.

### Stamp Spot Design

Each stamp spot is a `BasePart` tagged `"StampSpot"` with custom attributes:

| Attribute | Type | Description |
|---|---|---|
| `StampId` | `string` | Unique ID, e.g. `"alley_garden"`, `"rooftop_shrine"` |
| `StampSet` | `string` | Set this stamp belongs to, e.g. `"BackAlley"`, `"Rooftop"` |
| `DisplayName` | `string` | Shown in UI: "Hidden Garden" |
| `DisplayNameJP` | `string` | Japanese: "秘密の庭" |
| `Difficulty` | `number` | 1 = easy (ground level), 2 = medium (requires jump), 3 = hard (requires wall-run or obscure path) |
| `RequiredHachiLevel` | `number` | 0 = anyone, 2 = needs double-jump, 3 = needs wall-run |
| `SeasonOnly` | `string?` | `nil` = always available, `"spring"` / `"summer"` / `"autumn"` / `"winter"` |
| `TimeOnly` | `string?` | `nil` = any time, `"Night"` / `"GoldenHour"` |

### Discovery Mechanic

**Trigger:** Player's HumanoidRootPart enters within `STAMP_DISCOVERY_RADIUS` (12 studs) of a StampSpot part.

**Server validation pseudocode:**
```
function onPlayerNearStampSpot(player, stampSpot):
    stampId = stampSpot.StampId
    playerData = getPlayerData(player)

    // Already discovered?
    if stampId in playerData.discoveredStamps:
        return

    // Season check
    if stampSpot.SeasonOnly != nil and stampSpot.SeasonOnly != getCurrentSeason():
        return

    // Time-of-day check
    if stampSpot.TimeOnly != nil and stampSpot.TimeOnly != getCurrentTimePhase():
        return

    // Hachi level check (only if player is riding Hachi in lobby)
    if stampSpot.RequiredHachiLevel > 0:
        if not isRidingHachi(player):
            return  // Must be on Hachi to reach ability-gated spots
        // Lobby Hachi doesn't evolve — use player's highest-ever Hachi level
        if playerData.maxHachiLevel < stampSpot.RequiredHachiLevel:
            return

    // Grant stamp
    playerData.discoveredStamps.push(stampId)
    savePlayerData(player)

    // Fire client event
    fireClient(player, "stampDiscovered", stampId, stampSpot.DisplayName)

    // Check set completion
    checkStampSetCompletion(player, stampSpot.StampSet)

    // Mission progress
    progressMission(player, MissionId.DiscoverStamps, 1)
```

**Client feedback on discovery:**
1. Gentle chime sound (new SE: warm bell, ~1.5s)
2. Screen overlay: stamp card slides in from right, stamp animates (ink stamp press effect), displays name + set progress
3. Particle burst at spot location (cherry blossom petals / sparkles depending on set)
4. Stamp card auto-dismisses after 3 seconds

### Stamp Sets & Rewards

| Set Name | Stamps | Theme | Reward |
|---|---|---|---|
| Back Alley (裏路地) | 5 | Hidden passages, graffiti, cats | Hat: "Alley Cat Ears" |
| Rooftop (屋上) | 5 | Sky gardens, antennas, views | Trail: "Cloud Walk" |
| Night Shibuya (夜渋谷) | 5 | Neon spots, bars, night views (Night-only) | Hat: "Neon Visor" |
| Shrine Path (参道) | 4 | Torii, shrine, offerings | Emote: "Omamori Prayer" |
| Station (駅前) | 4 | Platforms, ticket gates, lockers | Trail: "Train Spark" |
| Golden Moments (黄金時) | 3 | Only visible during Golden Hour | Hat: "Sunset Crown" (rare) |
| Seasonal (四季) | 4 | 1 per season, rotate quarterly | Title: "Shibuya Explorer" |
| Complete Rally (全制覇) | ALL 30+ | Master completion | Hachi Skin: "Golden Hachi" |

### Hachi Level Gating for Stamps

This creates demand for Hachi evolution outside of competitive matches. Players need to play Hachi Ride to level up, then use those abilities to explore.

| Required Level | Ability Needed | Stamp Count | Example Spots |
|---|---|---|---|
| 0 (anyone) | Walk/basic jump | 18 | Ground-level alleys, interiors, benches |
| 2 | Double-jump | 6 | Mid-height rooftops, elevated platforms |
| 3 | Wall-run | 4 | Tall building sides, vertical shafts |
| 3+ (combo) | Wall-run + slide | 2+ | Complex routes requiring chained abilities |

**Key design note:** `RequiredHachiLevel` represents the player's **highest-ever evolution level** (persisted in PlayerData as `maxHachiLevel`), NOT the current match evolution. This prevents frustration — once you've evolved to Level 3 in any Hachi Ride match, you permanently unlock wall-run for exploration.

### Stamp UI (Client)

**Stamp Card Panel** — accessed via HUD button or pressing `Tab`:
- Grid layout organized by set
- Discovered stamps: full color with ink stamp visual
- Undiscovered stamps: greyed-out silhouette with "???" and difficulty stars
- Set progress bar at bottom of each row
- Completed set: gold border + reward preview
- Total progress: "17/30 stamps discovered"

**Minimap hints (optional Phase 2):**
- Difficulty 1 stamps show as faint glowing dots on minimap when within 50 studs
- Difficulty 2-3 stamps have no hint — pure exploration

### Balance Parameters

| Parameter | Value | Range | Rationale |
|---|---|---|---|
| `STAMP_DISCOVERY_RADIUS` | 12 | 8 – 16 | Generous enough that you don't need pixel-perfect positioning |
| `STAMP_DISCOVERY_POINTS` | 10 | 5 – 20 | Small reward per stamp; main reward is set completion cosmetics |
| `STAMP_SET_COMPLETION_POINTS` | 50 | 25 – 100 | Meaningful but not economy-breaking |
| `STAMP_MASTER_COMPLETION_POINTS` | 500 | 200 – 1000 | Prestigious achievement |
| `STAMP_CARD_DISPLAY_DURATION` | 3 sec | 2 – 5 | Long enough to read, short enough to not block play |
| `STAMP_HINT_RADIUS` | 50 studs | 30 – 80 | Only for easy stamps; too large trivializes discovery |

### Player Experience Goals
- **Curiosity**: "I wonder what's down that alley?" — the map should reward off-path wandering
- **Surprise**: Discovery should feel like stumbling onto something special, not checking boxes
- **Pride**: Completing a set should feel like a real achievement, especially the rare ones
- **Cultural resonance**: Japanese players instantly understand スタンプラリー; international players learn a fun real-world tradition

---

## 3. NPC Routine System

### Purpose
Make the city feel inhabited. NPCs are not quest-givers (that's a future system) — they're ambient life. Their presence makes Shibuya feel like a real place, not a game map.

### Core Design
8 NPCs at launch, each with a simple state machine driven by time-of-day. NPCs are **server-authoritative** (spawned/despawned by server) but **client-animated** (idle anims, reactions play locally to reduce network traffic).

### NPC Registry

| NPC ID | Name | Location | Active Phases | Interaction |
|---|---|---|---|---|
| `ramen_chef` | Ramen Chef | Food stall alley | Morning, Daytime, Evening | Waves at Hachi; tosses treat if player stops for 3s |
| `street_musician` | Street Musician | Near Hachiko statue | Evening, Night | Plays shamisen; Hachi sways nearby |
| `cat_colony` | Stray Cats (3-5) | Rooftop building B | Always | Behavior changes with Hachi level (see below) |
| `shopkeeper` | Konbini Clerk | Convenience store front | Daytime, Evening | Sweeps sidewalk; bows when player passes |
| `photographer` | Night Photographer | Scramble crossing | Night | "Takes photos" of passing players; gives 5 pts for posing |
| `delivery_cyclist` | Uber Eats Cyclist | Roaming (path loop) | Daytime, Evening | Zooms past; Hachi barks/startles |
| `shrine_keeper` | Shrine Maiden | Shrine area | Morning, Daytime | Sweeps; offers omikuji (fortune) once per day |
| `busker` | Beatboxer | Station underpass | Night | Beat performance; player proximity adds layers |

### NPC State Machine

Each NPC follows a simple state machine:

```
States: Inactive → Spawning → Idle → Interacting → Despawning → Inactive

Transitions:
  Inactive → Spawning:    when current TimePhase is in NPC's activePhases
  Spawning → Idle:        after spawn animation completes (fade-in, ~1s)
  Idle → Interacting:     when player enters INTERACTION_RADIUS
  Interacting → Idle:     when player leaves INTERACTION_RADIUS or interaction completes
  Idle → Despawning:      when current TimePhase exits NPC's activePhases
  Despawning → Inactive:  after despawn animation completes (fade-out, ~1s)
```

**Server responsibility:**
- Tracks which NPCs should be active based on current TimePhase
- Spawns/despawns NPC models (clone from ServerStorage)
- Detects player proximity for interaction triggers
- Grants rewards (points, treats, daily fortunes)

**Client responsibility:**
- Plays idle animations (loop)
- Plays interaction animations (wave, bow, toss)
- Plays Hachi reaction animations when near NPC
- Ambient audio per NPC (shamisen, sweeping, beatbox)

### Cat Colony — Special Behavior

The cat colony is the most complex NPC group and a key emotional hook:

| Player's maxHachiLevel | Cat Behavior |
|---|---|
| 0 | Cats hiss and scatter when Hachi approaches (12 stud radius) |
| 1 | Cats freeze and stare cautiously |
| 2 | One cat approaches slowly, sniffs Hachi |
| 3 | Two cats sit near Hachi, one rubs against leg |
| 4 | All cats nap on/around Hachi. One sits on Hachi's head |

This is a long-term relationship that players build through gameplay. Seeing all cats nap on your Hachi is an endgame flex.

### NPC Interaction Details

**Ramen Chef — Treat Toss:**
```
Trigger: Player within 10 studs for 3 continuous seconds (not moving fast)
Cooldown: 120 seconds per player
Action:
  1. Chef plays wave animation
  2. Projectile arc visual (treat object) from chef to Hachi
  3. Hachi plays "happy eat" animation (chomp + tail wag)
  4. Player gets "Hachi Treat" buff: +2 walk speed for 30s (cosmetic sparkle on Hachi)
  5. Chat message: "The ramen chef tossed Hachi a treat!"
Reward: 3 Play Points (first time per day: 10 points)
```

**Shrine Maiden — Daily Omikuji (おみくじ):**
```
Trigger: Player presses interaction button within 8 studs
Cooldown: Once per calendar day (tracked in PlayerData)
Action:
  1. Shrine maiden holds out omikuji box
  2. Player "draws" a fortune (random from pool of 12)
  3. Fortune displays as a small UI card with Japanese + English text
  4. Fortunes range from 大吉 (great blessing) to 凶 (bad luck)
  5. 大吉 grants 25 bonus points; 凶 grants "Cursed Hachi" trail (funny cosmetic, 10 min)
Reward: 5-25 Play Points depending on fortune tier
```

**Night Photographer — Pose Interaction:**
```
Trigger: Player enters 15-stud radius at night
Action:
  1. Photographer NPC aims camera at player
  2. UI prompt: "Strike a pose! Press [E]"
  3. Player presses E → character does equipped emote (or default pose)
  4. Camera flash VFX + shutter sound
  5. "Photo taken!" message
Reward: 5 Play Points. Mission progress for "Get Photographed 3 Times"
```

### Balance Parameters

| Parameter | Value | Range | Rationale |
|---|---|---|---|
| `NPC_INTERACTION_RADIUS` | 10 studs | 6 – 15 | Close enough to feel intentional, far enough for mobile players |
| `NPC_SPAWN_FADE_DURATION` | 1.0 sec | 0.5 – 2.0 | Subtle entrance, not jarring pop |
| `NPC_TREAT_COOLDOWN` | 120 sec | 60 – 300 | Often enough to feel generous, rare enough to not be farmable |
| `NPC_DAILY_INTERACTION_POINTS` | 10 pts | 5 – 20 | First interaction per day is worth more (encourages daily login) |
| `NPC_STREAMING_RADIUS` | 80 studs | 50 – 120 | Beyond this, NPC is hidden on client (performance) |
| `CAT_APPROACH_SPEED` | 4 studs/s | 2 – 8 | Slow, cautious, cat-like |

---

## 4. Hachi Ambient Reactions

### Purpose
Make Hachi feel like a living companion, not a vehicle. Ambient reactions happen automatically based on environment — the player doesn't control them, they just notice and enjoy them.

### Core Design
Client-side system that checks Hachi's proximity to tagged world objects and current game state, then plays appropriate animations and sounds. Runs only when player is in lobby and riding Hachi (or walking with Hachi nearby, if a "follow" mode is added later).

### Reaction Table

| Trigger | Tag / Condition | Radius | Animation | Sound | Cooldown |
|---|---|---|---|---|---|
| Near food stall | `"FoodStall"` | 15 studs | Nose wiggle + sniff (head bob forward) | Quiet sniff SFX | 30s per stall |
| Near cats | `"CatColony"` | 12 studs | Ears perk up + tail wag | Happy chirp | 20s |
| Near musician | `"Musician"` NPC active | 20 studs | Gentle body sway (synced to beat) | None (musician audio is playing) | Continuous while in range |
| Near water/fountain | `"WaterFeature"` | 10 studs | Paw dip animation (if stopped) | Splash SFX | 60s |
| Nighttime + idle | TimePhase == Night, velocity < 2 | — | Yawn → curl-up sleep pose (after 8s idle) | Quiet yawn SFX | Once per night phase |
| Rain event | Weather == Rain | — | Shake-off animation (on rain start), ears droop (continuous) | — | Once per rain event |
| Golden Hour | TimePhase == GoldenHour | — | Look up at sky, golden shimmer particle | Warm chime | Once per golden hour |
| Near another Hachi | Other player's Hachi within 8 studs | 8 studs | Nose-to-nose sniff with other Hachi | Happy bark × 2 | 45s per pair |
| Speed > 150 | Velocity magnitude check | — | Tongue out, ears back (wind animation) | Wind whoosh loop | Continuous |
| After collecting stamp | `stampDiscovered` event | — | Happy spin + bark | Bark + chime | Per stamp |

### Mood System (Lightweight)

Hachi has a **mood** value that affects idle animation selection. Mood is cosmetic only — no gameplay impact.

```typescript
enum HachiMood {
    Happy,      // default after interactions, collecting stamps
    Relaxed,    // during night, near music, after eating treat
    Excited,    // during events, near other Hachis, after evolving
    Sleepy,     // night + idle for 8+ seconds
}
```

**Mood transitions:**
```
Default mood: Happy

Near musician for 10s → Relaxed
Received treat → Happy (override any other mood for 30s)
Night + idle 8s → Sleepy
Micro-event starting → Excited (for event duration)
Near 2+ other Hachis → Excited

Mood decays back to Happy after 60s with no triggers.
```

**Mood affects idle animation pool:**
- Happy: tail wag, look around, pant
- Relaxed: slow tail sway, half-closed eyes, gentle breathing
- Excited: bounce in place, rapid tail wag, bark
- Sleepy: yawn, head droop, curl up (if idle long enough)

### Implementation Notes

**Client-only** — no server involvement for ambient reactions. This keeps network traffic zero for what is essentially cosmetic polish.

```
// HachiAmbientController — runs on Heartbeat when in lobby + riding Hachi

function onHeartbeat(dt):
    if gameState != Lobby or not isRidingHachi():
        return

    hachiPos = getHachiPosition()
    currentPhase = getCurrentTimePhase()

    // Check proximity triggers (throttled to every 0.5s)
    if timeSinceLastCheck < 0.5:
        return
    timeSinceLastCheck = 0

    for tag in AMBIENT_TRIGGER_TAGS:
        nearestPart = findNearestTagged(tag, hachiPos, TRIGGER_RADII[tag])
        if nearestPart and not isOnCooldown(tag, nearestPart):
            playReaction(REACTIONS[tag])
            setCooldown(tag, nearestPart, COOLDOWNS[tag])

    // Time-based triggers
    if currentPhase == Night and getHachiVelocity() < 2:
        idleTimer += dt
        if idleTimer > 8 and mood != Sleepy:
            setMood(Sleepy)
            playReaction("nightSleep")
    else:
        idleTimer = 0

    // Speed-based triggers
    speed = getHachiVelocity()
    if speed > 150 and not tongueOutActive:
        playLoopAnimation("tongueOut")
        tongueOutActive = true
    elif speed <= 150 and tongueOutActive:
        stopLoopAnimation("tongueOut")
        tongueOutActive = false
```

### Balance Parameters

| Parameter | Value | Range | Rationale |
|---|---|---|---|
| `AMBIENT_CHECK_INTERVAL` | 0.5s | 0.25 – 1.0 | Frequent enough to feel responsive, cheap enough for mobile |
| `MOOD_DECAY_DURATION` | 60s | 30 – 120 | Moods linger but don't stick forever |
| `SLEEP_IDLE_THRESHOLD` | 8s | 5 – 15 | Long enough that it feels natural, not instant |
| `TONGUE_OUT_SPEED_THRESHOLD` | 150 studs/s | 100 – 200 | Hachi Level 3+ speeds |
| `HACHI_PAIR_INTERACTION_RADIUS` | 8 studs | 5 – 12 | Close = intentional social moment |

---

## 5. Micro-Event System

### Purpose
Break the "queue → match → wait" loop with spontaneous, non-competitive world events that make the city feel unpredictable and worth staying in.

### Core Design
Server schedules one micro-event every 12-18 minutes (randomized). Events last 2-4 minutes. Events only fire during `GameState.Lobby`. All events are cooperative/passive — no winners or losers.

### Event Scheduler

**Server** (`MicroEventService`):

```
state:
    lastEventTime: number = 0
    currentEvent: MicroEvent | nil = nil
    nextEventDelay: number = randomRange(MICRO_EVENT_MIN_INTERVAL, MICRO_EVENT_MAX_INTERVAL)

function onHeartbeat(dt):
    if gameState != Lobby:
        return
    if currentEvent != nil:
        currentEvent.tick(dt)
        if currentEvent.isFinished():
            currentEvent.cleanup()
            currentEvent = nil
            nextEventDelay = randomRange(MIN_INTERVAL, MAX_INTERVAL)
        return

    lastEventTime += dt
    if lastEventTime >= nextEventDelay:
        lastEventTime = 0
        event = selectRandomEvent()
        event.start()
        currentEvent = event
        fireAllClients("microEventStarted", event.id, event.duration, event.data)
```

**Event selection** avoids repeating the last 2 events. Weighted random based on player count (some events work better with more players).

### Event Definitions

#### 5.1 Bon Odori (盆踊り)

| Property | Value |
|---|---|
| Duration | 90 seconds |
| Location | Scramble crossing (center) |
| Min players | 1 |

**Mechanic:**
- NPC circle of 8 dancers spawns at crossing center
- Music track starts (traditional matsuri drums + flute)
- Players who enter the 25-stud radius see a rhythm UI: arrows scroll upward, press matching direction on beat
- 4 directional inputs (WASD or mobile swipe), tempo ~100 BPM
- Scoring: Perfect (±100ms) = 3 pts, Good (±200ms) = 1 pt, Miss = 0
- At end, total points convert to Play Points (1:1, capped at 30)

**Client UI:**
- Minimal rhythm lane (single column, directional arrows)
- Beat accuracy feedback (particle burst on Perfect, subtle flash on Good)
- Hachi auto-dances beside player (cosmetic)

**Rewards:**
- Participation: 5 Play Points (just for entering the circle)
- Performance: up to 30 Play Points based on accuracy
- Temporary effect: "Festival Glow" trail for 5 minutes

#### 5.2 Food Truck Arrival

| Property | Value |
|---|---|
| Duration | 120 seconds |
| Location | Random from 5 predefined parking spots |
| Min players | 1 |

**Mechanic:**
- Server selects random parking spot, spawns food truck model
- Audio cue: distant jingle plays for all players (directional audio from truck position)
- No UI marker — players must follow the sound or explore to find it
- First 8 players to reach the truck (12-stud interaction radius) get a "Special Treat"
- Everyone who visits gets a small reward

**Discovery design:**
- Jingle volume scales with distance (audible up to 200 studs)
- Truck has a subtle particle emitter (steam/smoke) visible from moderate distance
- No minimap icon — pure audio/visual discovery

**Rewards:**
- First 8 arrivals: "Special Treat" — Hachi cosmetic food item on head for 10 min + 15 Play Points
- Late arrivals: 5 Play Points + "The truck was almost out!" chat message
- Mission progress: "Visit Food Truck" mission type

#### 5.3 Fireworks Show (花火)

| Property | Value |
|---|---|
| Duration | 90 seconds |
| Location | Sky above city (rooftop viewing spots tagged `"FireworkViewpoint"`) |
| Min players | 0 (runs regardless) |

**Mechanic:**
- Server announces via distant boom sound
- 4 rooftop viewing spots glow (pulsing particle ring visible from ground)
- Players who reach a viewpoint see the full fireworks display (ParticleEmitters in sky)
- Hachi looks up automatically, tail wags
- Players at viewpoints can see each other — social gathering moment

**Fireworks choreography:**
- 6 bursts, escalating in size and color variety
- Final burst: massive golden chrysanthemum (菊) pattern
- Sound: escalating whistle → boom for each, with stereo positioning

**Rewards:**
- Viewpoint attendance: 8 Play Points
- Watching from ground: 3 Play Points (proximity to any viewpoint within 40 studs)
- First fireworks ever watched: "First Hanabi" badge

#### 5.4 Street Art Live

| Property | Value |
|---|---|
| Duration | 150 seconds (2.5 min) |
| Location | Random from 4 predefined wall spots |
| Min players | 1 |

**Mechanic:**
- NPC artist spawns at wall with paint supplies
- Over 150 seconds, a pre-authored mural "paints" itself using decal layering (10 layers revealed progressively)
- Players who watch from within 20 studs for the full duration get a stamp
- Mural persists on the wall until server restarts (visible to all players, even those who missed the event)

**Visual design:**
- Each mural is a set of 10 Decal layers on the wall, revealed in sequence
- Layers go from sketch → line art → color blocks → details → highlights
- NPC artist plays painting animation throughout

**Rewards:**
- Full watch (within 20 studs, start to finish): Commemorative stamp + 12 Play Points
- Partial watch (any time within range): 3 Play Points
- Mission progress: "Watch Street Art" mission type

#### 5.5 Hachi Obstacle Course

| Property | Value |
|---|---|
| Duration | 180 seconds (3 min) |
| Location | Main street (temporary parts spawned) |
| Min players | 1 |

**Mechanic:**
- Temporary ramps, rings, and platforms materialize in the street (server clones from ServerStorage)
- Course marked with glowing trail on ground
- Timer starts when player enters start gate
- Checkpoints along the route (8 checkpoints)
- Finish line at end
- Uses existing Hachi movement (jump, double-jump, wall-run, slide) — but at lobby Hachi speeds (not match speeds)

**Lobby Hachi ability access:**
Lobby Hachi uses the player's `maxHachiLevel` to determine available abilities. Course is designed so Level 0 players can complete a basic path, but higher-level players can take shortcuts.

| Course Section | Basic Path (Level 0-1) | Shortcut (Level 2+) | Expert (Level 3+) |
|---|---|---|---|
| Section 1-3 | Ground ramps + basic jumps | Double-jump to skip ramp | — |
| Section 4-6 | Winding ground path | — | Wall-run to cut corner |
| Section 7-8 | Long ramp sequence | Double-jump chain | Slide + wall-run combo |

**Rewards:**
- Completion: 15 Play Points + "Parkour Pup" badge (first time only)
- Best time displayed on personal scoreboard (no leaderboard — keep it non-competitive)
- Repeat completions: 5 Play Points each

#### 5.6 Golden Hour (ゴールデンアワー)

| Property | Value |
|---|---|
| Duration | 180 seconds (3 min) |
| Trigger | Replaces normal Golden Hour lighting transition |
| Min players | 0 |

**Mechanic:**
- When the day/night cycle enters Golden Hour, there's a 40% chance it becomes a "Super Golden Hour" event
- Lighting becomes extra dramatic (deeper amber, visible god rays, lens flare)
- All stamps discovered during this window count as 2 discoveries for mission progress
- Hachi gets a temporary golden shimmer particle effect
- A lo-fi ambient music track fades in (soft piano + city sounds)

**Design intent:** This is the "vibes" event. No interaction required. It just makes the city feel magical for 3 minutes. Players who notice it and explore during it are rewarded with double stamp progress.

**Rewards:**
- Stamps discovered during event: double mission progress
- Hachi golden shimmer: cosmetic, 3 min duration
- No explicit point reward — the reward is the atmosphere + stamp bonus

### Event Balance Parameters

| Parameter | Value | Range | Rationale |
|---|---|---|---|
| `MICRO_EVENT_MIN_INTERVAL` | 720s (12 min) | 480 – 900 | Rare enough to feel special |
| `MICRO_EVENT_MAX_INTERVAL` | 1080s (18 min) | 900 – 1500 | Not so rare players never see one |
| `MICRO_EVENT_LOBBY_ONLY` | true | — | Events must not disrupt match flow |
| `BON_ODORI_RADIUS` | 25 studs | 15 – 35 | Large enough for multiple players |
| `BON_ODORI_BPM` | 100 | 80 – 120 | Accessible tempo for all ages |
| `BON_ODORI_TIMING_PERFECT` | ±100ms | ±80 – ±150 | Generous for casual players |
| `BON_ODORI_TIMING_GOOD` | ±200ms | ±150 – ±300 | Very forgiving |
| `FOOD_TRUCK_JINGLE_RANGE` | 200 studs | 100 – 300 | Audible across most of the map |
| `FOOD_TRUCK_EARLY_BIRD_SLOTS` | 8 | 4 – 12 | Enough for ~half of a full server |
| `FIREWORKS_VIEWPOINT_COUNT` | 4 | 3 – 6 | Multiple vantage points, no crowding |
| `OBSTACLE_COURSE_CHECKPOINTS` | 8 | 5 – 12 | ~20s between checkpoints at base speed |
| `GOLDEN_HOUR_EVENT_CHANCE` | 0.4 | 0.2 – 0.6 | Not every golden hour is "super" |
| `EVENT_HISTORY_NO_REPEAT` | 2 | 1 – 3 | Last 2 events won't repeat immediately |

---

## 6. New Network Events

### ServerToClient Additions

```typescript
// Day/Night
timeOfDayChanged(phase: TimePhase, normalizedTime: number): void;
timeSync(serverClock: number): void;
lightingOverride(preset: string): void;

// Stamps
stampDiscovered(stampId: string, displayName: string): void;
stampSetCompleted(setId: string, rewardItemId: string): void;
stampCardData(discovered: string[], totalCount: number): void;

// NPCs
npcSpawned(npcId: string, position: Vector3): void;
npcDespawned(npcId: string): void;
npcInteraction(npcId: string, interactionType: string, rewardPoints: number): void;
omikujiResult(fortune: string, fortuneJP: string, tier: number, points: number): void;

// Micro-Events
microEventStarted(eventId: string, duration: number, data: MicroEventData): void;
microEventEnded(eventId: string): void;
microEventProgress(eventId: string, data: unknown): void;
bonOdoriNote(direction: number, beatTime: number): void;
foodTruckFound(playerName: string, slotsRemaining: number): void;

// Hachi Ambient (client-only, no network events needed)
```

### ClientToServer Additions

```typescript
// Stamps
requestStampCard(): void;

// NPCs
requestNpcInteraction(npcId: string): void;
requestOmikuji(): void;

// Micro-Events
bonOdoriHit(direction: number, accuracy: number): void;
interactFoodTruck(): void;
obstacleCourseCheckpoint(checkpointIndex: number): void;
obstacleCourseFinish(totalTime: number): void;
```

---

## 7. Data Schema Changes

### PlayerData Additions

```typescript
// Add to PlayerData interface:
{
    // Existing fields unchanged...

    // NEW: Stamp Rally
    discoveredStamps: string[];       // Array of StampId strings
    maxHachiLevel: number;            // Highest evolution level ever achieved (0-4)

    // NEW: NPC Interactions
    lastOmikujiDay: number;           // Day number of last omikuji draw
    npcFirstInteractions: string[];   // NPCs interacted with for first time today
    lastNpcInteractionDay: number;    // Day tracker for daily first-interaction bonus

    // NEW: Micro-Events
    badges: string[];                 // Achievement badges ("FirstHanabi", "ParkourPup", etc.)
    obstacleBestTime: number;         // Personal best obstacle course time (seconds, 0 = never completed)
}
```

### DEFAULT_PLAYER_DATA Additions

```typescript
{
    // ... existing defaults ...
    discoveredStamps: [],
    maxHachiLevel: 0,
    lastOmikujiDay: 0,
    npcFirstInteractions: [],
    lastNpcInteractionDay: 0,
    badges: [],
    obstacleBestTime: 0,
}
```

### ProfileService Migration Note
Existing players will get default values for new fields on next load (ProfileService reconcile handles this automatically with the default template).

---

## 8. New Mission Types

Add to `MissionId` enum and `MISSION_DEFS`:

| MissionId | Label | Target | Reward |
|---|---|---|---|
| `DiscoverStamps` | "Discover 3 Stamps" | 3 | 40 pts |
| `CompleteStampSet` | "Complete a Stamp Set" | 1 | 75 pts |
| `VisitFoodTruck` | "Find the Food Truck" | 1 | 30 pts |
| `WatchFireworks` | "Watch a Fireworks Show" | 1 | 25 pts |
| `AttendBonOdori` | "Join the Bon Odori" | 1 | 35 pts |
| `GetPhotographed` | "Get Photographed 3 Times" | 3 | 30 pts |
| `DrawOmikuji` | "Draw Your Fortune" | 1 | 20 pts |
| `CompleteObstacleCourse` | "Complete Hachi Obstacle Course" | 1 | 45 pts |
| `VisitCatColony` | "Visit the Cat Colony" | 1 | 20 pts |
| `WatchStreetArt` | "Watch Street Art Being Made" | 1 | 35 pts |

These mix into the existing daily mission pool (3 per day). Weighting ensures players get at least 1 exploration mission per day alongside match missions.

---

## 9. Constants Reference

All new tuning constants for `constants.ts`:

```typescript
// Day/Night Cycle
export const DAY_CYCLE_MINUTES = 20;
export const LIGHTING_TWEEN_DURATION = 8;
export const TIME_SYNC_INTERVAL = 60;

// Stamp Rally
export const STAMP_DISCOVERY_RADIUS = 12;
export const STAMP_DISCOVERY_POINTS = 10;
export const STAMP_SET_COMPLETION_POINTS = 50;
export const STAMP_MASTER_COMPLETION_POINTS = 500;
export const STAMP_CARD_DISPLAY_DURATION = 3;
export const STAMP_HINT_RADIUS = 50;
export const STAMP_TOTAL_COUNT = 30;

// NPCs
export const NPC_INTERACTION_RADIUS = 10;
export const NPC_SPAWN_FADE_DURATION = 1.0;
export const NPC_TREAT_COOLDOWN = 120;
export const NPC_DAILY_INTERACTION_BONUS = 10;
export const NPC_STREAMING_RADIUS = 80;
export const CAT_APPROACH_SPEED = 4;
export const PHOTOGRAPHER_POSE_REWARD = 5;
export const OMIKUJI_POINTS = [5, 8, 12, 18, 25]; // 凶→大吉

// Micro-Events
export const MICRO_EVENT_MIN_INTERVAL = 720;
export const MICRO_EVENT_MAX_INTERVAL = 1080;
export const EVENT_HISTORY_NO_REPEAT = 2;

// Bon Odori
export const BON_ODORI_RADIUS = 25;
export const BON_ODORI_BPM = 100;
export const BON_ODORI_PERFECT_WINDOW = 0.1;
export const BON_ODORI_GOOD_WINDOW = 0.2;
export const BON_ODORI_MAX_POINTS = 30;
export const BON_ODORI_PARTICIPATION_POINTS = 5;
export const BON_ODORI_DURATION = 90;

// Food Truck
export const FOOD_TRUCK_JINGLE_RANGE = 200;
export const FOOD_TRUCK_EARLY_BIRD_SLOTS = 8;
export const FOOD_TRUCK_EARLY_BIRD_POINTS = 15;
export const FOOD_TRUCK_LATE_POINTS = 5;
export const FOOD_TRUCK_DURATION = 120;
export const FOOD_TRUCK_COSMETIC_DURATION = 600;

// Fireworks
export const FIREWORKS_DURATION = 90;
export const FIREWORKS_VIEWPOINT_REWARD = 8;
export const FIREWORKS_GROUND_REWARD = 3;
export const FIREWORKS_GROUND_PROXIMITY = 40;
export const FIREWORKS_VIEWPOINT_COUNT = 4;

// Street Art
export const STREET_ART_DURATION = 150;
export const STREET_ART_FULL_WATCH_POINTS = 12;
export const STREET_ART_PARTIAL_POINTS = 3;
export const STREET_ART_LAYERS = 10;
export const STREET_ART_WATCH_RADIUS = 20;

// Hachi Obstacle Course
export const OBSTACLE_COURSE_DURATION = 180;
export const OBSTACLE_COURSE_CHECKPOINTS = 8;
export const OBSTACLE_COURSE_COMPLETION_POINTS = 15;
export const OBSTACLE_COURSE_REPEAT_POINTS = 5;

// Golden Hour Event
export const GOLDEN_HOUR_EVENT_CHANCE = 0.4;
export const GOLDEN_HOUR_STAMP_MULTIPLIER = 2;
export const GOLDEN_HOUR_DURATION = 180;

// Hachi Ambient
export const AMBIENT_CHECK_INTERVAL = 0.5;
export const MOOD_DECAY_DURATION = 60;
export const SLEEP_IDLE_THRESHOLD = 8;
export const TONGUE_OUT_SPEED_THRESHOLD = 150;
export const HACHI_PAIR_INTERACTION_RADIUS = 8;
```

---

## 10. Flamework Architecture

### New Services (Server)

| Service | Responsibility |
|---|---|
| `DayNightService` | Server clock, phase transitions, lighting override during matches |
| `StampRallyService` | Proximity detection for stamp spots, data persistence, set completion checks |
| `NpcRoutineService` | NPC spawn/despawn lifecycle, interaction validation, reward granting |
| `MicroEventService` | Event scheduling, event lifecycle management, reward distribution |

### New Controllers (Client)

| Controller | Responsibility |
|---|---|
| `DayNightController` | Lighting tweens, tagged object toggling, ambient audio layer mixing |
| `StampRallyController` | Stamp card UI, discovery overlay animation, hint dot rendering |
| `NpcReactionController` | NPC idle/interaction animations, ambient audio per NPC |
| `HachiAmbientController` | Proximity-based Hachi reactions, mood system, animation blending |
| `MicroEventController` | Event-specific UI (Bon Odori rhythm lane, fireworks camera, etc.) |

### Dependency Graph

```
DayNightService
  ├── NpcRoutineService (needs current TimePhase for spawn/despawn)
  ├── StampRallyService (needs TimePhase for time-gated stamps)
  └── MicroEventService (Golden Hour event triggers from phase change)

MicroEventService
  └── GameStateService (only runs during Lobby)

StampRallyService
  └── PlayerDataService (persist stamps, maxHachiLevel)
  └── MissionService (progress stamp missions)

NpcRoutineService
  └── PlayerDataService (daily interaction tracking, omikuji)
  └── MissionService (progress NPC missions)
```

### Implementation Order (Recommended)

1. **DayNightService + DayNightController** — foundation everything else depends on
2. **StampRallyService + StampRallyController** — self-contained, immediately testable
3. **HachiAmbientController** — client-only, no server work, big cozy payoff
4. **NpcRoutineService + NpcReactionController** — needs day/night but otherwise independent
5. **MicroEventService + MicroEventController** — most complex, build last

---

## 11. Performance Budget

### Mobile Target: iPhone 11 / Android mid-range (2020)

| System | Budget | Strategy |
|---|---|---|
| Day/Night lighting | 0 extra draw calls | Tween existing Lighting properties; toggle tagged objects via `StreamingEnabled` radius |
| NPCs (8 max) | 8 rigged models max | Stream NPCs beyond `NPC_STREAMING_RADIUS` (80 studs). Use R6 rigs (cheaper than R15). Idle anims are lightweight |
| Stamp spots | 30+ invisible parts | Zero render cost (invisible triggers). Particle effects only on discovery (one-shot) |
| Hachi ambient | 0 network, client CPU only | Throttled to 2 Hz checks. Animation blending handled by Roblox Animator |
| Micro-events | Varies by event | Bon Odori: 8 NPC dancers (R6). Fireworks: ParticleEmitters (cap at 200 particles). Obstacle course: ~20 static parts |

### Worst Case: All systems active simultaneously
- 8 NPCs rendered + 1 micro-event active + day/night tweening + Hachi ambient running
- Estimated additional CPU: ~2ms per frame on mobile
- Estimated additional memory: ~15 MB (NPC models + event models)

### Mitigation
- `CollectionService` tag streaming: parts tagged for systems beyond streaming radius are automatically not replicated
- NPC models use shared `AnimationController` instances (not per-NPC Humanoids)
- Micro-event models are destroyed on cleanup, not just hidden

---

## 12. Testing Criteria

### Stamp Rally

| Test | Expected Result |
|---|---|
| Walk into stamp spot first time | Discovery animation plays, stamp saved to PlayerData |
| Walk into same spot again | No duplicate discovery, no animation |
| Walk into season-locked spot in wrong season | No discovery |
| Walk into time-locked spot in wrong TimePhase | No discovery |
| Walk into Hachi-gated spot without required level | No discovery |
| Complete a stamp set | Set completion notification, cosmetic reward granted |
| Rejoin server after discovering stamps | All stamps persisted, card shows correct state |

### NPCs

| Test | Expected Result |
|---|---|
| Enter NPC active phase | NPC fades in at correct location |
| Leave NPC active phase | NPC fades out |
| Approach ramen chef on Hachi, stand still 3s | Treat toss animation, Hachi eat reaction, points granted |
| Approach ramen chef again within 120s | No interaction (cooldown) |
| Draw omikuji twice in same day | Second attempt blocked |
| Cat colony with maxHachiLevel 0 vs 4 | Cats scatter vs cats nap on Hachi |

### Micro-Events

| Test | Expected Result |
|---|---|
| Wait 12-18 min in lobby | Event triggers |
| Event triggers during match queue | Event runs, queue notification takes priority |
| Match starts during micro-event | Event cleanly stops, models destroyed |
| Bon Odori: hit all Perfects | ~30 Play Points awarded |
| Food truck: 9th player arrives | Gets late-arrival reward (5 pts), not early-bird |
| Obstacle course: complete all 8 checkpoints | Completion reward, personal best tracked |
| Same event type twice in a row | Should not happen (no-repeat = 2) |

### Hachi Ambient

| Test | Expected Result |
|---|---|
| Ride Hachi near food stall | Sniff animation plays, cooldown starts |
| Stand idle at night for 8s | Sleepy mood, yawn animation |
| Ride Hachi at 170+ studs/s | Tongue-out animation loops |
| Two Hachis approach each other | Nose-to-nose sniff on both clients |
| Leave lobby (enter match) | All ambient reactions stop cleanly |

### Day/Night Cycle

| Test | Expected Result |
|---|---|
| Wait 20 real minutes | Full cycle completes, returns to Morning |
| Enter match during Night phase | Lighting overrides to neutral preset |
| Exit match | Lighting tweens to current cycle position |
| Client joins mid-cycle | Receives timeSync, snaps to correct phase |

### Player Experience Signals to Watch During Playtesting

- **Do players notice the day/night cycle?** If not, transitions may be too subtle
- **Do players explore off-path without prompting?** If not, stamp spots may be too hidden
- **Do players stop near NPCs?** If not, interaction radius may be too small or feedback too subtle
- **Do players stay in lobby between matches?** If yes, the system is working
- **Do players screenshot Hachi reactions?** If yes, the cozy factor is landing
- **Do players audibly react to micro-events?** (In voice chat / recorded playtests) If yes, surprise factor is working
