# Roblox Creator Documentation Research

Research for Tokyo Playground: party mini-game set in Shibuya, photogrammetry city, targeting 9-15 year olds.

---

## 1. Game Design

### 1.1 Core Loops

**What it is:** The central repeatable gameplay cycle: action > reward > progression.

**Application to Tokyo Playground:**
- Minute-to-minute: exploring Shibuya, socializing in lobby, discovering mini-games
- Most repeated action: playing mini-games (kick ball, color tag, hide & seek)
- Progression engine: unlocking cosmetics, leveling Hachi, earning currency

**Key settings/values:**
- Without a progression system, experiences become "repetitive, boring, and shallow"
- Progression must produce tangible, visible changes from repeated actions

**Gotchas:**
- The core loop must feel complete even at first play. Don't gate the fun behind progression.
- Party games need the loop to work for both "tourists" (hop between experiences) and "locals" (dedicated players). Tourists need instant fun; locals need deep progression.

### 1.2 Onboarding / FTUE

**What it is:** First-Time User Experience. The first few minutes that determine whether players stay.

**Application to Tokyo Playground:**
- Players land in Shibuya lobby. Within 60 seconds they should: see other players, understand how to move, find a mini-game to join.
- Use visual elements (signs, arrows, spotlights) instead of text walls. This also reduces localization burden.
- Keep early thresholds low: first level-up should happen in the first session.

**Key settings/values:**
- D1 retention is THE metric for onboarding quality
- Player funnel: Tap Play > Start FTUE > Finish FTUE > Return. Measure each step.
- Give starter items and soft currency immediately so players experience the cosmetics/shop system early.

**Gotchas:**
- Players decide interest within minutes. Get to a mini-game FAST. Do not front-load tutorials.
- "Players generally don't like to read instructions and skip through text prompts to get to gameplay."
- Younger Roblox users (our target) prioritize exploration and socialization over competition.
- Design for streamers: can YouTubers make engaging content? Can they bring friends easily?

### 1.3 Onboarding Techniques

**Visual Elements (preferred for our target age):**
- Prominence: place guidance directly in player sight lines
- Highlights: spotlight desired actions, dim the rest
- Hints: subtle cues (footprints, glowing paths) let players feel clever discovering things
- Feedback: VFX flashes on hits, coin animations, screen effects for danger

**Contextual Tutorials (just-in-time):**
- Don't teach everything upfront. Teach the combination station when they have two items.
- Reduces cognitive load. Critical for 9-12 year olds.

**Timed Hints:**
- Show hints only to struggling players, after a delay determined by playtesting
- "Timed hints should be sufficient to help struggling players after only being shown once"

### 1.4 UI/UX Design

**What it is:** Interface design principles for cross-platform Roblox experiences.

**Application to Tokyo Playground:**
- Mobile-first is mandatory. Most of our 9-15 target plays on mobile/tablet.
- "A clean, minimalist UI is particularly crucial for mobile interfaces"
- Show only contextually relevant buttons (don't show mini-game controls in lobby)
- Use consistent visual language: icons over text, familiar patterns (X to close)

**Key settings/values:**
- Follow Roblox UI conventions (bottom-screen inventory slots, etc.)
- Test against built-in Roblox UI elements (chat, player list) to avoid overlap

**Gotchas:**
- Avatar visibility is culturally important on Roblox. Users invest in customization and want to be seen. Don't obscure avatars unless justified.
- Younger audiences struggle with text-heavy interfaces. Prioritize iconography.

### 1.5 Quest Design

(Page returned 404, but covered in Content Updates and Subscription Design sections.)

Quests should include:
- Short-term: complete X mini-games today
- Mid-term: weekly challenges, mini-game mastery
- Long-term: seasonal collections, rare cosmetics, Hachi evolution milestones

### 1.6 Analytics Essentials

**Key KPIs to track:**

| Metric | What it tells you | Low value means |
|--------|-------------------|-----------------|
| D1 Retention | Onboarding quality | Bad FTUE |
| D7 Retention | Progression system health | No reason to continue |
| D30 Retention | Endgame depth | Insufficient goals |
| DAU | Daily health | Something is wrong |
| Avg Session Length | Content engagement | Updates may have hurt |
| ARPDAU | Spending system effectiveness | Shop not working |
| Conversion Rate | First purchase success | "Most important metric" - first purchase predicts future spending |
| ARPPU | Spend depth | Item values not optimized |

### 1.7 LiveOps Essentials

**What it is:** Post-launch content strategy to keep players returning.

**Application to Tokyo Playground:**
- Content cadence: release new content every 2-4 weeks
- Focus on simple art-based deliverables: cosmetics, furniture, pets, new mini-game maps
- "Simple variants on existing assets, like assets with only slight color changes, are ideal"
- Spend fewer than 3 weeks' effort per cadence release

**Content types:**
- Limited-time events (cherry blossom festival, summer matsuri)
- Seasonal cosmetics with FOMO
- New mini-game modes
- Community contests

**Gotchas:**
- "Holidays are not universal" -- understand JP vs global audience before implementing seasonal themes
- Content shouldn't be immediately consumed. Require time earning rewards.
- Listen to players via game groups and Discord.
- Prioritize developer wellbeing. Don't burn out on cadence.

### 1.8 Content Updates

**Sustainability approaches:**
1. Progression systems: add permanent content at endpoints where veterans exhaust objectives
2. Limited-time events: most players should need weeks to complete all objectives
3. Season passes: combine time-limited events with progression (quest series for tiered rewards)

### 1.9 Design for Roblox (Platform-Specific)

**Critical platform insights:**

- Users frequently hop between experiences. FTUE must be fast.
- Many users treat Roblox as a hangout space. Social mechanics are essential.
- Younger users (9-12): prioritize exploration, experimentation, socialization over competition. "Weirdness and creativity are culturally celebrated."
- Older users (13-15): invest more in engagement and monetization. Form community foundations.
- YouTubers significantly drive discovery. Design with streaming potential.
- Direct porting from other platforms fails. Must add Roblox-specific social features and streamlined tutorials.

---

## 2. Monetization

### 2.1 Revenue Share

| Channel | Creator Share |
|---------|-------------|
| In-experience Robux sales | 70% |
| Marketplace sales | 30% |
| Real-money transactions | Up to 90% |
| Subscriptions (month 1) | 70% |
| Subscriptions (month 2+) | 100% |

DevEx rate: 10,000 Robux = $38 USD. Eligibility: 13+, minimum 30,000 earned Robux.

### 2.2 Game Passes (One-Time Purchases)

**What it is:** Permanent one-time Robux purchase for lasting benefits.

**Application to Tokyo Playground:**
- VIP Pass: exclusive Shibuya areas, special lobby animations
- Double XP Pass: permanent 2x progression
- Hachi Customization Pack: exclusive skins/accessories for the dog companion
- Mini-game Creator Pass: ability to create custom mini-game variants

**Key settings/values:**
- Icon: 512x512px circular, .jpg/.png/.bmp
- Price range: 1 to 1 billion Robux (promotional pool requires 50-800 Robux)
- Use `MarketplaceService:UserOwnsGamePassAsync()` server-side to check ownership
- Use `MarketplaceService:PromptGamePassPurchase()` client-side to prompt

**Gotchas:**
- Roblox does NOT track purchase history per user. You must store this yourself if needed.
- Promotion pool eligibility: 50-800 Robux, must have thumbnail, no randomized rewards.
- Can sell outside the experience via Store tab.
- `RankProductsAsync` and `RecommendTopProductsAsync` enable personalized shop displays. Requires at least 1 sale in past 28 days.

### 2.3 Developer Products (Consumable/Repeatable Purchases)

**What it is:** Items users can buy multiple times (currency packs, power-ups, consumables).

**Application to Tokyo Playground:**
- Yen (soft currency) packs: 100/500/2000 Yen
- Extra lives/retries in mini-games
- Temporary power-ups: speed boost, shield, score multiplier
- Gacha tickets for cosmetic loot

**Key settings/values:**
- Must implement `ProcessReceipt` callback server-side (not `PromptProductPurchaseFinished`)
- Return `PurchaseGranted` or `NotProcessedYet` from callback
- Test mode products cost real Robux (no free testing)

**Gotchas:**
- "Do NOT use PromptProductPurchaseFinished event for processing" -- use ProcessReceipt exclusively
- Roblox does not record purchase history. Implement your own data storage.
- `RankProductsAsync` has strict rate limits. Load recommendations once at game start.

### 2.4 Subscriptions (Recurring Monthly)

**What it is:** Auto-renewing monthly benefits.

**Application to Tokyo Playground:**
- Tokyo Explorer Pass ($4.99/mo): monthly Yen stipend + exclusive cosmetic pack + early access to new mini-games
- Shibuya VIP ($9.99/mo): all Explorer benefits + exclusive area access + monthly rare item

**Key settings/values:**
- Max 50 subscriptions per experience
- Set in USD base price; mobile users pay more in local currency
- Month 1: 70% payout. Month 2+: 100% payout (huge incentive for retention)
- Name, price, cadence are NOT editable after creation
- API: `GetUserSubscriptionStatusAsync()`, `PromptSubscriptionPurchase()`, `UserSubscriptionStatusChanged` event

**Gotchas:**
- **JAPAN IS EXCLUDED.** Subscriptions are currently unavailable in: Argentina, Colombia, India, Indonesia, Japan, Russia, Taiwan, Turkey, UAE, Ukraine, Vietnam. This is a major limitation for a Tokyo-themed game targeting Japanese players.
- All subscriptions can be owned simultaneously (no mutual exclusivity). Design tiers accordingly.
- 30-day hold on earnings. Refunds outside this period deduct from balance.
- Phone or ID verification required to create.
- Must honor advertised benefits throughout term. Cannot gate benefits behind additional tasks.

### 2.5 Subscription Design Patterns

**Models that work for party games:**
1. **Currency Packs**: Monthly Yen stipend. Calculate: USD > Robux > soft currency ratios at $2.99/$4.99/$7.99/$14.99 tiers.
2. **Item Packs**: Curated monthly cosmetic collections. Balance durables carefully to avoid unsustainable design.
3. **Season Passes**: Quest-based with free + premium tracks. Subscribers can claim premium rewards even if subscribing mid-season.
4. **VIP/Membership**: Equivalent monthly value, not just a one-time gate.

**Alignment check before implementing:**
- Engagement: Do exclusive items motivate frequent core loop interaction?
- Retention: Is content deep enough for monthly trickle releases?
- Monetization: Concentrated (consistent demand) or diversified (curation highlights lesser-known items)?

### 2.6 Contextual Purchases

**What it is:** Strategic purchase prompts outside the main shop, at the right moment.

**Application to Tokyo Playground:**
- **Pre-play**: Elevator/train station shop before each mini-game (like "Doors" elevator shop)
- **In-play**: Extra life prompt after elimination in mini-games (only if gameplay can pause)
- **Lobby**: 3D vending machines in Shibuya displaying cosmetics (social pressure from crowded lobby)
- **Complementary**: Bundle speed boost + score multiplier as a combo deal
- **UI-based**: Loading screen offers between mini-games (but NOT on first session load)

**Gotchas:**
- Account for purchase flow completion time (several seconds). Only use in-play if gameplay can pause.
- Avoid multiple overlapping modal prompts.
- Clarify whether lobby shop shows complete catalog or partial.

### 2.7 Immersive Ads

**What it is:** In-experience advertising (billboards, video ads, portals) that earns you revenue.

**Application to Tokyo Playground:**
- Shibuya is famous for its billboards and screens. Ad billboards fit the setting perfectly.
- Video ads on building screens (autoplaying or click-to-play)
- Image ads on street-level billboards
- Portal ads as "sponsored store entrances" in the shopping district

**Key settings/values:**
- Billboard part size: 8-32 studs wide, 4.5-18 studs tall
- Add AdGui object to a Block part, select face, enable EnableVideoAds for video
- Click-to-play video: earns when user watches 15+ seconds
- Autoplay video: earns per impression (0.5s+ view, 1.5%+ viewport, up to 55 degree angle, 50%+ pixels visible)
- Payouts on the 25th of the following month

**Eligibility:**
- Public experience, age 13+, ID verified with 2FA
- Must complete Maturity and Compliance Questionnaire
- **Minimum 2,000 unique monthly visitors**
- Under-13 users see Roblox logo fallback. Use `PolicyService:GetPolicyInfoForPlayerAsync()` to check `AreAdsAllowed`.

**Gotchas:**
- Ad fraud detection is active. Don't inflate impressions.
- Ineligible users (under 13, outside targeting) see fallback logos. For a 9-15 target, a significant portion will see no ads.
- Metrics appear after 48 hours in Creator Dashboard.
- The Shibuya aesthetic actually makes ad placement feel natural rather than intrusive.

### 2.8 Creator Rewards (Engagement-Based Payouts)

Creators earn Robux based on engagement even without direct purchases. Available to all creators, "even those just getting started." This is baseline passive income proportional to play time.

---

## 3. Localization

### 3.1 Automatic Translation

**What it is:** Roblox auto-captures UI strings and translates them to 15 languages.

**Application to Tokyo Playground:**
- Source language: English (wider tooling support)
- Priority targets: Japanese, English (dual market)
- Automatic translation covers both Japanese and English

**Supported languages (15):**
Arabic, Chinese (Simplified), Chinese (Traditional), English, French, German, Indonesian, Italian, Japanese, Korean, Polish, Portuguese, Russian, Spanish, Thai, Turkish, Vietnamese.

**Key settings/values:**
- Enable "Capture text from experience UI while users play" in localization settings
- Studio capture: Window > Localization > Localization Tools > Enable Automatic Text Capture (results in 1-2 minutes)
- Live capture: strings may take "up to a few days" to appear
- Per-character, per-language quotas exist (reset monthly)
- Enable "Use Translated Content" in Settings, then toggle languages

**Gotchas:**
- Only captures text with `AutoLocalize` property enabled
- TextBox: only PlaceholderText captured, not Text (assumes player input)
- Does NOT capture: default Roblox leaderboards/chat, player-owned items, images with embedded text, badge/pass names
- Auto-translation never overrides manual translations
- Lock entries to approve translations (but locking prevents safety-related updates)
- Auto-cleanup removes stale auto-scraped entries. Can be disabled.
- **For a Tokyo game: bake Japanese text into the city environment as images/textures, not UI text. These won't be auto-translated, which is desired for atmosphere.**

### 3.2 Scripting Localization

**What it is:** Programmatic translation for dynamic content.

**Application to Tokyo Playground:**
- Use `LocalizationService:GetTranslatorForPlayerAsync()` for player-specific locale
- Use `FormatByKey()` with parameters for dynamic strings: "{1:int} points!", "Welcome to {AreaName}!"
- Use `Translate()` with context objects for ambiguous strings
- Monitor language changes with `GetPropertyChangedSignal("LocaleId")`

**Key patterns:**
```
-- Named parameters for dynamic content
translator:FormatByKey("Key_Prize", {AmountYen=500, NumItems=3})
-- Localization table: "You earned ${AmountYen:fixed} Yen and {NumItems:int} items!"
```

**Gotchas:**
- Wrap all async calls in `pcall()` for connectivity failures
- Create a TranslationHelper ModuleScript for reuse: handles errors, fallbacks, language switching
- Plan localization table keys early. Retrofitting is painful.

### 3.3 Localization Strategy for JP + EN

**Recommended approach:**
1. Write all source strings in English
2. Enable automatic translation for Japanese (and other languages)
3. Manually review/override critical Japanese translations (game name, key UI, shop items)
4. Use images with Japanese text for environmental flavor (signs, posters, menus) -- these should NOT be translated
5. Keep UI text minimal and icon-heavy to reduce translation burden
6. Assign Japanese-speaking translators via the Translator collaboration feature

---

## 4. Matchmaking

### 4.1 How Matchmaking Works

**What it is:** Roblox assigns players to servers via a weighted scoring algorithm.

**Flow:**
1. Player requests to join
2. System identifies eligible servers (excludes full, private, reserved, shutting-down)
3. Each eligible server gets a compatibility score
4. Player joins highest-scoring server

### 4.2 Default Signals (Built-in)

| Signal | Type | What it does |
|--------|------|-------------|
| Age | Numerical | Groups similar ages (max diff: 25 years) |
| Device Type | Categorical | Clusters same device players |
| Friends | Categorical | Binary: 1 if friends present, 0 otherwise |
| Language | Categorical | Ratio of same-language players |
| Latency | Numerical | Lower ping = higher score (max relevant: 250ms) |
| Occupancy | Numerical | Ratio of current players to capacity |
| Play History | Numerical | Groups similar experience levels (log-10 minutes, max diff: 4.6) |
| Voice Chat | Categorical | Matches voice chat settings |
| Text Chat | Categorical | Groups compatible text chat players |

### 4.3 Custom Matchmaking

**Application to Tokyo Playground:**

**Player Attributes (persistent, DataStore-backed):**
- Skill level / MMR per mini-game
- Total playtime
- Preferred language (JP/EN)

**Server Attributes (session-only, MatchmakingService):**
- Current mini-game mode
- Server language majority
- Lobby vs in-game state

**Custom signals to implement:**
1. **Skill-based**: Numerical signal comparing player MMR to server average. Weight high for competitive mini-games, low for casual ones.
2. **Language clustering**: Boost the default language signal weight to strongly group JP and EN speakers separately.
3. **Game mode matching**: Categorical signal clustering players who want the same mini-game type.

**API:**
- `MatchmakingService:SetServerAttribute(name, value)` -- set server-level attributes
- `MatchmakingService:GetServerAttribute(name)` -- read server attributes
- Player attributes via `DataStoreService`
- Signal weights configured in Creator Dashboard

### 4.4 Teleportation (Place-to-Place)

**What it is:** Moving players between places within a universe using `TeleportService`.

**Application to Tokyo Playground:**
- Lobby (start place) > Mini-game places (separate places for different games)
- Party teleportation: teleport entire friend groups together
- Reserved servers for private mini-game instances

**Key API:**
```lua
TeleportService:TeleportAsync(placeId, {player1, player2}, teleportOptions)
```

**TeleportOptions:**
- `ServerInstanceId` -- target specific public server
- `ReservedServerAccessCode` -- join reserved server
- `ShouldReserveServer = true` -- create new reserved server
- `SetTeleportData()` -- pass data (team composition, scores) between places
- `SetTeleportGui()` -- custom loading screen (Shibuya-themed train animation)

**Party teleportation:**
- `SocialService:GetPlayersByPartyId()` to get all party members
- `Team:GetPlayers()` for team-based teleportation

**Security settings:**
- "Limited to same universe": non-start places only accessible via in-universe teleports (recommended)
- "Secure within universe only": server-initiated teleports only (most secure)

**Gotchas:**
- TeleportService does NOT work in Studio. Must test in published client.
- Server-side execution only for security. Client-side `Teleport()` is discouraged.
- Wrap in `pcall()` with retry logic. Handle `TeleportInitFailed` event.
- Use `GetJoinData()` to retrieve teleport data on arrival.
- For secure data (currency, inventory), use DataStores, NOT teleport data.
- Custom teleport screens via `SetTeleportGui()` -- great opportunity for a Shibuya train loading animation.

---

## 5. Critical Findings and Non-Obvious Insights

### Subscriptions are unavailable in Japan
This is the single most important finding. For a Tokyo-themed game explicitly targeting Japanese players, the subscription monetization model will not work for the Japanese market segment. Rely on Game Passes, Developer Products, and Immersive Ads for JP players. Subscriptions work for the international audience only.

### Immersive Ads fit Shibuya perfectly
Shibuya's real-world identity is defined by massive billboards and screens. In-experience ads will feel native to the setting rather than intrusive. This is a unique advantage over other game settings.

### Under-13 players see ad fallbacks
A significant portion of the 9-15 target audience (ages 9-12) will not see ads. Plan monetization to not depend on ad revenue from this segment.

### Month 2+ subscription payout is 100%
If subscriptions become available in Japan later, the revenue share jumps from 70% to 100% after the first month. This makes subscriber retention extremely valuable.

### Language-based matchmaking is built-in
The default language signal already clusters same-language players. For a JP/EN game, simply boosting this signal's weight will naturally separate language communities without custom code.

### Mobile-first is non-negotiable
The target demographic primarily plays on mobile. UI must be minimalist, touch-friendly, and tested on small screens first.

### Tourists vs Locals mental model
Design the lobby for tourists (instant fun, wow factor, Shibuya atmosphere) and progression for locals (deep cosmetics, Hachi evolution, season passes). Most locals start as tourists.

### ProcessReceipt is the only safe callback
For Developer Products, never use `PromptProductPurchaseFinished`. Only `ProcessReceipt` is reliable. This is a common source of lost purchases.

### Teleport testing requires published builds
Cannot test TeleportService in Studio at all. Must publish and test in the live client. Plan testing workflow accordingly.

### Content cadence target: under 3 weeks effort
Roblox recommends spending fewer than 3 weeks on each content cadence release. Focus on art variants (recolors, seasonal cosmetics) that don't require programming.

### Custom loading screens via teleport
`SetTeleportGui()` lets you show a custom ScreenGui during teleportation. This is perfect for a Shibuya train/subway themed transition between lobby and mini-games.
