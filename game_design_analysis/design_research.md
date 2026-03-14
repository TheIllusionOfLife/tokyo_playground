# Roblox人気ゲーム10本の包括的ゲームデザイン分析

Robloxプラットフォームで最も成功した10タイトルのゲームデザインを徹底解剖する。本レポートは、**sandbox roleplay、life simulation、pet collecting、tycoon、competitive PvP、asymmetric multiplayer**という6つの異なるジャンルにまたがるゲーム群を分析し、各ゲームのcore loop、monetization設計、social mechanics、技術実装を実装レベルの粒度で記述する。ゲーム開発者が類似のメカニクスを自身のプロジェクトに導入する際の直接的な参考資料として活用できるよう、具体的な数値、システム名称、パラメータを可能な限り明記した。

---

## 1. Brookhaven RP — 自由放任が生んだ史上最大のRobloxゲーム

### Core game loop とメカニクス

Brookhaven RPの最も急進的な設計判断は、**明示的なcore loopを一切持たない**ことにある。progression system、leveling、skill tree、win/loss条件は存在しない。プレイヤーのmoment-to-momentの行動は「Spawn → Customize（avatar/house/vehicle選択） → Explore（compact mapの探索） → Roleplay（他プレイヤーとの即興劇） → Discover（secret/easter egg発見） → Repeat」という完全なsandbox循環である。

**Housing system**では、プレイヤーは約73%が無料の事前構築済みhouse templateから選択する。house typeはfamily home、military facility、laboratory、castle、penthouse、island propertyなど多岐にわたり、swap cooldownは無料プレイヤーで10分（VIPは即時）。Blackhawk、Oaks、Crown Pointなどの名前付きcommunityにplot claimが可能で、各houseにはsecret roomやhidden passageが意図的に配置されている。重要な設計原則として、**secretsは無料houseにのみ配置**され、有料house purchaserへの偏重を避けている。

**Vehicle system**はcar、SUV、motorcycle、bus、helicopter（Premium専用）、jet（Premium専用）、horseなど幅広く、default speed capは55 mph、Speed Passで200 mphまで拡張可能。**Job/Role system**はpolice officer、doctor、firefighter、teacher、criminal等のroleplay categoryであり、機能的なincomeやtask completionは伴わない。**Props & Items system**は70以上のpropsが単一updateで追加されることもあり、decorativeとroleplay aidの両方を網羅する。**Emote**は24種のCasual & Fashion Emotesが最近追加され、「Dress to Impress」とのcollaboration poseも含まれる。

**Bank Heist mechanic**（green keycard取得 → vault爆破 → money bag奪取 → 脱出）やDisaster system（fire、earthquake、flood、alien invasion、zombie attackなどのon-demand event、Disaster Pack 500 Robux）が、emergent roleplayのシナリオ生成装置として機能する。**Cinematic Mode**（Shift+P）はfreecamをtoggleし、YouTuberによるcontent creation基盤となっている。

### Player experience とsession設計

平均session長は**約15-16分**。retention hookとして特筆すべきは、Brookhavenが**daily reward、streak、FOMO timerを一切使用しない**点である。retentionは完全にorganic要因—identity attachment（customization）、social network effect、weekly content update（通常金曜12:00-3:00 PM EST）、YouTube/TikTokのcontent creator flywheel—に依存する。seasonal eventはHalloween、Christmas/Winter Festival、Easterなどで、map上の既存locationを一時的に置き換える形式（urgency + novelty）を採用している。

onboardingは**意図的にminimal**で、tutorial、walkthrough、NPC guideは存在しない。UIはicon-basedで直感的に設計されており、learning curveは極めて低い。

### Social & multiplayer設計

public serverは**約30名/instance**、private serverは100 Robux/月で同じく最大30名。private server controlsにはprop管理、admin設定、weather/lighting変更、time制御が含まれる。mapは**意図的にcompact**に設計されており、これはBloxburg、Livetopiaより小さい。開発者の設計哲学として「RPGの本質はプレイヤー同士のinteractionであり、広大なmapに迷うことではない」という考えが反映されている。leaderboard、scoring、PvP rankingは存在せず、全てのcompetition/cooperationはemergentに発生する。

### Monetization

**in-game currencyは存在しない**。trading systemも未実装。全economyはRobux gamepasses（15種、合計約5,612 Robux）に集約される。主要gamepassはPremium（275 Robux）、VIP Pack（999 Robux）、Vehicle Pack（799 Robux）、Land Unlocked（500 Robux）、Disaster Pack（500 Robux）。**Watch Ad for Rewards system**により、無料プレイヤーは一時的（10-30分）にpaid featuresをpreview可能。**ARPDAU（Average Revenue Per Daily Active User）は$0.02**という極めて低い水準だが、120M+ MAU・500K+ CCUの規模がtop-5 grossingを実現している。brand collaboration（Ed Sheeran、Wicked、LEGO、Minions、Milano Cortina 2026 Olympics）も無料コンテンツとして提供しつつsponsored revenueを生成する。

### 成功要因と開発者への教訓

Brookhavenの成功を決定づけた設計判断は、**F2P generosityによるscale最大化**、**mandatory objectivesの排除（player imaginationがcontent）**、**customizationによるidentity attachment（daily rewardより強力なorganic retention）**、**compact mapによるencounter frequency最大化**、そして**children向けに最適化された全設計判断**（大人からの「やることがない」という批判は対象外demographic）である。2020年4月のCOVID-19 lockdown期にlaunchした timing、Adopt Me!のRP audienceのmigration受け皿となったことも見逃せない。2025年2月、Voldexが買収し、15名以上のdeveloper teamがupdate pipelineを加速させている。

---

## 2. Welcome to Bloxburg — The Simsの精神を受け継ぐbuilding masterpiece

### Core game loopとメカニクス

Bloxburgのprimary loopは「**Work jobs → Build & customize → Manage needs → Socialize → Level skills → Repeat**」。Roblox Staffが公式に確認したこの循環は、sandbox progressionとlife simulationの融合である。

**Job system**は14種の職業を持ち、Pizza Baker、Delivery Person（最高earning potential: $3K-$4K/delivery at high levels）、Fast Food Worker（Cashier/Stocker/Chef 3役）、Mechanic、Fisherman、Woodcutter、Miner、Hairdresser、Janitor、Seller等がある。v0.12.6の大規模overhaulにより、pay構造が**job-specific payからuniversal pay（全job同等）**へ変更された。earningはOverall Work Experience Level（max 100）、Efficiency bar（最大100%）、Mood stateに依存する。Mood multiplierは全mood 80%超で100%、最低mood 50-80%で85%、51%未満で70%となる。Bloxburg High Schoolの卒業でpermanent pay bonus（Freshman +5% → Senior +20%）が付与される。

**Skill system**は8種実装済み（Cooking、Gardening、Music、Athletic、Gaming、Intelligence、Painting、Writing）で各max level 10。Cookingは31以上のrecipeをunlockし、interactive QTE（chop、stir、fry、bake）を伴う。Gardeningはreal-time成長でfruitの収穫・販売が可能。各skill level 10達成でunique trophyが授与される。

**Mood/Needs system**は4種（Hunger、Energy、Fun、Hygiene）で、全てpassiveに減少する。**Friend proximity bonus**（v0.7.0+）は友人の近くにいるとall mood decayが遅延する仕組み。全moodが約10%以下になるとfainting timerが開始される。Build ModeではMoodがfreezeされるため、建築中はneed管理が不要という重要な仕様がある。

**Building system**はRoblox上で最も洗練されたものの一つで、Large/Medium/Small grid（Jキー切替）、Walls/Floors/Doors/Windows/Roofs/Fences/Chimneys/Pools/Stairs/Basic Shapes等のstructural要素、数百のfurniture category、Paint Tool、Scale Tool（Advanced Placing必須）、Clone Tool、Transform Tool（Transform Plus必須）を備える。キーボードショートカットは豊富で、SPACE=top view、H=grid toggle、G=sell tool、F=paint tool、C=clone、V=scale、T=transform、R=realign。sell valueはplaced items 70%、same-session items 95%、undo 100%。

### Player experienceとsession設計

typical sessionはcasualで30-60分、builder sessionで1-6時間以上。high level Pizza Deliveryでは30分で$104,000、1時間で$181,000のearningが報告されている。**Daily Rewards**は5日cycleで Day 1: $100 → Day 5: B$20（Premium倍額）。**Login Streak Trophies**は7日（$10,000）、14日（$30,000）、30日（$75,000 + B$20）。**Daily Objectives**（v0.13.2+）で最大$8,000/日。seasonal eventsはValentine's Day、April Fools、Halloween、Christmas/Winter、New Year'sで、event currency（Winter Tickets、Halloween Tickets）を使用した限定品取得が可能。

onboardingはv0.12.7でin-game tutorialが追加されたが、それ以前は完全にorganic learning。building systemのlearning curveはmoderate—basic buildsは accessible だが、split-level、custom shape、advanced placement tricksは significant practice を要する。

### Social & multiplayer設計

standard serverは**12名max**、Neighborhoods（private server代替）は**最大75名**（voice chat有効時50名）。Neighborhood rental pricingは149 Robux/月、399 Robux/3ヶ月、699 Robux/6ヶ月、1,099 Robux/年。**Donation system**で$1-$10,000（Premium: $50,000）を他プレイヤーに送金可能（24時間cooldown）。**Family Tree Feature**でroleplay用family structureを構築可能。emergentな「builder hire economy」では、skilled builderがin-game money（通常25k-60k）で雇われてhouse建設を請け負う非公式economyが発生している。

### Monetization

3種のcurrency: **Money ($)**（jobs、daily rewards等で獲得）、**Blockbux (B$)**（premium items、color wheel B$600、追加house slots B$300等に使用、Robux購入可能）、**School Credits ($H)**（school decorative items）。exchange rateは1 B$ ≈ 20 Money。gamepasses（合計約4,075 Robux）にはBasements（100R）、Marvelous Mood（180R、mood decay半減）、Advanced Placing（200R）、Excellent Employee（300R、+50% job pay）、Multiple Floors（300R、5階まで）、Large Plot（400R、30×30→50×50）、Premium（400R）、Transform Plus（600R）がある。**Subscription model**（Monthly Currency Pack: Mini / Essential）はmonth 2,3でloyalty bonusが増加し、cancelでbonus resetされる。

**Paid access history**: 2016-2024年6月まで25 Robux one-time purchase。2024年6月15日にF2P化。paid access時代にRoblox上で最もvisitedなpaid-access gameとなり、2022年にCoffee Stain Studios（Embracer Group）が推定**$100M+**で買収。**House bills**（house value 0.6%、Premium 0.3%）がmoney sinkとして機能する。

**2026年roadmap**: Pets system、Elder age morph、Hospital building、Mini-map featureが確認されている。v1.0（2025年6月28日）で完全なmap revampが実施済み。

### 成功要因

「The Sims on Roblox」としてのgap fill、Roblox上最高峰のbuilding system depth、**dual-loop design（Building + Jobs + Roleplay）**による3種のplayer motivation同時対応、Mood systemによるengagement driver（passive playの防止）、community-driven content ecosystem（YouTube/TikTok house builds）、そして全systemがinterlinked（Moods → job pay → building → roleplay spaces → social engagement → mood decay減少）である設計が成功の核心。

---

## 3. Adopt Me! — Pet economyが生んだRoblox史上最大のcultural phenomenon

### Core game loopとメカニクス

Adopt Me!のprimary loopは「**Earn Bucks → Buy Eggs → Hatch Pets → Age Up Pets → Trade Pets → Repeat**」。moment-to-momentでは、equip中のpetのneeds（feeding、drinking、sleeping、walking等）を満たしてBucksとXPを獲得し、NurseryでEggsを購入、task completionでhatch、aging stagesを経てtrade marketで価値を最大化する。

**Pet rarity tiers**は5段階: Common、Uncommon、Rare、Ultra-Rare、Legendary。**Pet aging system**はNormal: Newborn → Junior → Pre-Teen → Teen → Post-Teen → Full Grown、Neon: Reborn → Twinkle → Sparkle → Flare → Sunshine → Luminous。rarity別の必要task数はCommon 56、Uncommon 80、Rare 120、Ultra-Rare 160、**Legendary 305 tasks**（2025年9月rebalance後）。

**Neon/Mega Neon system**は、同種4体のFull Grown petをNeon Cave（bridge下）で合成しNeon pet（neon color発光）を作成、さらに4体のLuminous NeonでMega Neon（rainbow cycle発光）を作成する。Mega Neon作成には合計16体のFull Grown petが必要で、Legendary petの場合**1,100 tasks**を要する。

**Egg system**: permanent eggsはCracked Egg（350 Bucks）、Pet Egg（600 Bucks）、Royal Egg（1,450 Bucks、Legendary 5%確率）。Golden Egg（660 Star Rewards到達で獲得、確定Legendary）、Diamond Egg（さらに660 Stars）。rotating/limited eggsは歴史的にSafari、Jungle、Farm、Aussie、Fossil、Ocean等40種以上。**Pet Pen system**（2025年9月）では最大4体が passive aging（online 800 XP/hr、offline 200 XP/hr）するが、1 level分のXP蓄積でclaim必須。**Pet Releaser system**（2025年9月）では不要petをrelease→point獲得→Basic Egg（500pt）/Crystal Egg（4,500pt）に交換可能。

### Player experienceとsession設計

sessionは柔軟で、5-10分（daily reward claim + 数tasks）から30-60分以上（pet aging grinding、trading、events）。**Daily Reward system**は15時間毎にclaim可能で、5日間escalating rewards（Day 5: Gift + 12-20 Stars）。2日連続miss してもaccumulated starsはresetされない（forgiving design）。**Star Rewards**は660 stars→Golden Egg、さらに660→Diamond Eggの長期目標。Task Board（4 daily tasks）、Pet Needs Cycle（Tamagotchi的urgency）、Pet Pen passive aging、seasonal events（4-8週毎）、2x Weekends、Galactic Pass / Battle Pass的systems が retention を駆動する。

**Guide system**（2025年12月）はPets/Explore/Houseの3 categoryのnon-repeatable achievementsで、新規プレイヤーのonboardingを structured に行う。learning curveは「Minutes 1-10: starter egg hatch → First week: egg types・rarity・basic trading理解 → Weeks 2-4: Neon system・strategic trading → Months+: player-driven economy mastery」。

### Social & multiplayer設計

server capacityは**48名**。**Family/Adoption system**ではParent（赤色chat）/Baby（青色chat）を選択し、nearby playerをfamilyに招待可能。ParentはBabyのneedsを満たしstrollerで運搬できる。**Trading system**はclick→Trade選択→secure trade window（各side最大9 items）→双方Accept。**Trading License**（2024年）ではsafety quizを完了してadvanced trading featuresにaccess。**Lemonade/Hotdog/Cotton Candy Stands**でplayer-operated commerceが可能（price設定0-50 Bucks）。

### Monetization

**Bucks**（free、earnable）はpet needs fulfillment、jobs（9種、15 Bucks/分）、daily rewards等で獲得。**Robux**でBucks直接購入（24 Robux = 50 Bucks ～ 3,910 Robux = 10,000 Bucks）。主要Robux items: Ride-A-Pet Potion（150R）、Fly-A-Pet Potion（295R、trade value大幅増）、VIP Gamepass（750R）、Hatch Now!（45R/egg）。**Pets Plus Subscription**（$2.99/月）は2 pets同時装備、daily Bucks cap増加、Streak Saver（streak never resets）、monthly Legendary Treat、全VIP perks含む。

player-driven economyでは**公式price listは存在せず**、community-driven value sites（AdoptMeTradingValues.com等）とDiscord serversが価格形成。limited-time petsは時間経過で価値上昇（例: Shadow Dragon 2019 Halloween、当時1,000 Robuxが現在top-tier value）。Neon/Mega Neon versionは部品合計の指数的価値増。annual revenue $60M、team size約40-48名、peak CCU **1.92M**（2025年12月「Dress Your Pets」update時）。

### 成功要因

最重要の設計判断は**2019年のbaby adoption → pet collectingへのpivot**。「Economy > Content」—well-designedなplayer-driven economyがdeveloper-created contentを超えるengagementを提供。emotional attachment（cute pets + nurturing）がretentionを駆動。scarcity creates value（game離脱itemsの価値上昇）。social systemsが全mechanicをreinforce（trading requires players、families require players、stands require customers）。collection depth: 数百pets × 5 rarity tiers × 6 age stages × Normal/Neon/Mega Neon × Fly/Ride variants = 数千のcollectible states。

---

## 4. Pet Simulator X / Pet Simulator 99 — Dopamine最適化のclicking empire

### Core game loopとメカニクス

Pet Simulator X（PSX、2021年7月release、8.96B visits）とその後継Pet Simulator 99（PS99、2023年12月release、2.33B visits）のcore loopは「**Collect currency → Hatch eggs → Upgrade pets → Unlock new biomes → Trade → Repeat**」。BIG Games Pets（developer Preston）が開発。

moment-to-momentでは、biome内のbreakable objects（coins、stacked coins、chests）をclick/tapし、equip中のpetsがauto-attackして drops を collect。**tap combo system**で rapid clicking → combo multiplier → bonus coins。higher-tier biomesは指数的にcurrencyが増加。

**Egg hatching**はpet獲得の唯一の方法（trading除く）。各biomeにbiome-specific egg stationがあり、probability tableに基づく: Basic 84-93%、Rare 4-12%、Epic 1-2%、Legendary <1%、Mythical（extremely rare）。**Pet rarity tiers**はBasic → Rare → Epic → Legendary → Mythical → Exclusive → Huge → Titanic（PS99ではGargantuanが追加）。variantはNormal → Golden（7x power）→ Rainbow（~49x）→ Dark Matter（~20x normal）。

**Pet conversion machines**: Golden Machine（1-6 normal pets投入、6体=100%成功）、Rainbow Machine（golden→rainbow）、**Dark Matter Machine**（rainbow→dark matter、常に成功だがTIME消費: 1体=5日、6体=30分、Robux 799Rで即時skip）。**Fusing Machine**で同type複数pet合成→higher-tier pet生成。**Enchanting system**ではLegendary tier+にrandom enchant付与（Coins I-V、Strength I-V、Best Friend等）。

PS99での主要変更: pets autonomous obstacle breaking、**Rebirth system**（最大9回のprestige）、Charms system（TNT Charm、Lightning Charm等）、Potions（tier 9まで upgradeable）、Flags（Shiny Flag、Rainbow Flag、Strength Flag）、minigames（Fishing、Digging、Hoverboard）、Quests system（Quest Points → Quest Shop）。

**World構造**: PSXは10 major worlds/60+ biomes（Spawn World → Fantasy World → Tech World → The Void → Axolotl Ocean → Pixel World → Cat World → Limbo → Doodle World → Kawaii World → Dog World）。PS99は**274 unlockable areas across 4 worlds and 8 sub-worlds**。各worldに独自currency（Coins、Fantasy Coins、Tech Coins、Rainbow Coins、Cartoon Coins）。

### Player experienceとsession設計

PS99の平均session長は驚異的な**74.45分**（Roblox内でextremely high）。AFK mechanics（Auto Hatch、Auto Farm gamepasses）がsession time引き上げに寄与。retention hookはRank Rewards（6時間毎にclaim）、Dark Matter Machine timers（30分-5日のreturn-to-game loop）、limited-time events、Huge Rotation（ultra-rare pets定期入替）、Clan Battles（1週間のtimed competitions）、Codes（promotional）、Merch Codes（McDonald's Happy Meal toys）。

onboardingは極めて低friction: spawn→starter pet選択→命名→地面のcoins click→pet runs to collect→即座にfeedback loop確立。初回eggは数分で購入可能。

### Social & multiplayer設計

PSX: **12名/server**、PS99: **10名/server**（private server 35名）。Trading PlazaとPro Trading Plaza（PS99）は dedicated server。Trading Booths（vendor booths設置、price設定、PS99では新listing 3秒countdown で sniping防止）。**Clans**（PS99、Clan Ticket 300R or earned）はDiamond donation → clan leaderboard → clan upgrades → Clan Battlesに参加。Boss Chests等のcooperative要素と、leaderboard/trading競争のcompetitive要素が共存。

### Monetization

**極めてaggressive**。PSX gamepasses: Pet Storage!（70R）→ Mythical Hunter!（1,799R）の12+種。PS99: Auto Farm!（175R）→ Huge Hunter!（3,250R、最高額）。**Exclusive Pets Egg**（400R/1egg、1,200R/3、3,200R/10）は毎content updateで内容rotate→recurring spending incentive。Diamond Robux購入、Dark Matter instant skip（variable Robux）、Boost Packs。PS99は Subscriptions も追加。core gameplayは free-to-play だが、competitive play/efficient progressionはpaying playersを strongly favor。update velocityはPS99で**72 updates in ~2年**（ほぼ weekly）。

### 成功要因

「Simple core loop, deep metagame」—click-to-collectはtrivially simpleだが、surrounding systems（trading、fusing、enchanting、collecting）が endless depth。**perfectly tuned dopamine loop**（click → collect → hatch → rarity result → upgrade）。astronomical scale of collection（1,000-2,000+ pets × 4-5 variants = tens of thousands）。multi-layered progression（biome unlocking → egg hatching → pet conversion → fusing → enchanting → ranking → rebirthing → collection index）。timer-based mechanicsとRobux skipがengagementとmonetization双方を serve。NFT controversy（2021年）、P2W criticism、server crash historyはrisk factorsとして認識すべき。

---

## 5. Theme Park Tycoon 2 — Solo developerが9年間580+ updatesを届け続けたtycoon game

### Core game loopとメカニクス

Den_S（Dennis）が開発するTPT2のcore loopは「**Build → Earn → Optimize → Expand → Refine**」。プレイヤーは$11,000の starting money と own plot で開始し、rides、stalls（food/drink/souvenir）、restrooms、pathsを設置。guestsが入場料・ride料金・stall購入で in-game money ($) を生成。guest happinessをmonitorし、pricing調整、cleanliness管理（trash can配置）、park layout改善を繰り返す。

**Ride system**は5 categories: Gentle Rides（Spinning Tea Cups、Merry-Go-Round等）、Intense Rides（Top Spin、Roto Drop等）、**Roller Coasters**（Junior Coaster → Hydraulic Launch Coaster → Single Rail Coaster等25種以上、max 5 trains/coaster、1-7 cars/train）、Water Rides（Swan Boats、Log Flume、River Rapids等）、Transportation Rides（Transport Train、Monorail）。

**Coaster Builder**が本ゲーム最大の differentiator で、**Basic Editor**（pre-designed track pieces、4 gradient levels）と**Advanced Editor**（full 3D spline manipulation、Spherical Manipulation [green=X/red=Y/blue=roll]、Move/Rotate Spline Node、auto-smooth yaw & pitch toggle、max track length 2,500m）の2モード。track typesはnormal、chainlift、station、brakes、booster、rapids、waterfall等。**Switch Tracks**（2025年追加）は6種のcoaster typeで分岐・合流track構築が可能。

**Park Rating system**は0-5 Starsで、0.5 Star（1 ride + 1 food stall + 1 drink stall + 1 restroom）から5 Stars（全food/drink stall type 3個以上、全souvenir stall 1個以上、3つの大規模roller coasters、high average guest happiness、path dead-end無し等）まで段階的要件が定義されている。

**Leveling system**（v520、2024年11月導入）はmax level 88、XPはguest actions、mission完了、achievement達成で獲得。各levelでrideを1つ選択unlock。**Missions system**（2024年1月）は同時3 missions、1日最大5 missions、Credits とXP をreward。**Achievements**は28種（star-rating milestones、creative challenges「To the Moon」coaster 190 km/hr等）。

### Session設計とsocial

sessionは30分から数時間（AFK money farmingも一般的、最適化designで$3M+/day生成可能）。**6名/server**で各自own plot。park visiting、park likes（social validation）、**co-op building**（building permissions grant）が social mechanics。**Blueprint community**（themeparktycoon2.com）で数千のfree blueprintsが共有され、YouTube builders（Disneyland完全再現等）のcommunity ecosystemが content pipeline を拡張。

### Monetization

**5 active gamepasses**（合計746 Robux、height boosters除く）: Increased Height Limit（74R、20m/購入、最大7回）、Enable Ride Operations（74R）、24 Extra Expansion Plots（374R）、**Disable Collisions（224R、最人気—items重ね配置、grid snapping [1/8まで]、rotation snapping [11.25°まで] 解禁）**、Extra Colors（74R）。Credits（premium currency）はmissionsとachievementsで獲得、Robuxでも購入可能。**Non-pay-to-win**: 全gamepassがcreativity/convenience enhancement、5 Stars達成とall achievements完了はRobux無しで可能。

### 成功要因

「Creative + Social Hybrid」—Den_S 自身が明言する通り、casual players向けのsimple park building と advanced players 向けのhighly sophisticated creationsの両立。**580+ updates over 9+ years from a solo developer**は驚異的commitment。localization（Spanish翻訳でSpanish audience倍増 & playtime大幅増）。rides don't break downという simplified management。Den_S のDevForumでの発言「Keep scope under control」「Actually finish and release games」は開発者への直接的教訓。

---

## 6. Hide and Seek Extreme — 11年間ほぼ更新なしで3.3B visitsを達成したevergreen design

### Core game loopとメカニクス

Tim7775開発のHide and Seek Extreme（2015年1月release、3.33B visits）は、universal gameであるかくれんぼをRobloxに最適化。**1名のSeeker（"It"）vs 最大13名のHiders**。Hiding Phase（60秒、Seekerは ice cube に frozen で Hiders を観察可能）→ Seeking Phase（4分、physical tagで capture）→ Round End。Hider全員tag→Seeker win、timer切れ→surviving Hiders win。

**Seeker Abilities**は4種: **Glue**（trap設置、8秒stun、30秒CD）、**Camera**（surveillance camera最大2台設置）、**Sprint**（4秒speed burst、25秒CD）、**Stun**（Yeti exclusive、50 Robux、AoE shockwave、13秒CD）。全Seeker characterはdefaultでHidersより移動速度が若干速い。

**6 permanent maps**: Bedroom、Kitchen、Workshop、Store、Backyard、Attic。全mapが「**tiny character in a giant world**」concept—プレイヤーはtoy sizeに縮小され、日常的なhousehold/neighborhood locationが巨大exploration zoneとして機能。各mapにはcoins散布、**Teleporters**（黒い丸/hidden spots）、**Bounce pads**（黒い四角）、head-boost spots が配置。

Hider側UIには**stud-distance counter**（Seekerまでの距離表示）と**Seeker POV spectate**機能があり、情報優位がHiderに付与されている。**Taunt system**（Tキー）ではHiderが自発的に音/emoteで位置を暴露でき、voluntary difficulty increaseとして機能。

### Session設計とretention

single roundは**約5分**、average session playtime **9.33分**（約2 rounds）。**Zero tutorial** — universally understood real-world rules。retention hookは短round length（「one more round」心理）、random map/Seeker selection、emotional core（**tension & relief**: distance counterのリアルタイム不安、spectate機能でSeekerの接近を目撃、tauntingの humor）。

### Monetization

Coins/Credits（free currency）: Hider survive +10、Seeker catch +5/人、map coin pickup +1（Triple Coins pass で+3）。gamepasses: Boombox（300R）、Yeti Character（50R）、Triple Coin Value（30R）、Seeker Chance Multiplier（100R）、Map Selection（6R/use consumable）。**Very light monetization** — fully playable without spending。**更新はextremely infrequent**（last update約1年前）だが、evergreen core loopの強さで sustain。

### 成功要因

**Simplicity scales** — universally recognized concept（hide-and-seek）でzero onboarding friction。**Perfect session design**（5分rounds）。**Asymmetric role design** with random selection。「**Tiny in a Giant World」level design** — mundane spacesをadventure playgroundに変換。**Emotional design > mechanical depth** — hiding/seekingのtensionがminimal mechanicsで memorable experience を創出。**Low monetization pressure** が Roblox の young demographic に accessible。COVID-19 lockdown 期（2020年4月 peak CCU 42,320）でfriend connection tool としての需要急増。「1つのことをextremely well に実行する」アプローチの exemplar。

---

## 7. Tower of Hell — No checkpointsが生んだrage/satisfaction cycleの傑作

### Core game loopとメカニクス

YXCeptional Studios（uwuPyxl & ObrenTune）開発のTower of Hell（2018年6月release、**27.4B visits**、Roblox 4位）は、round-based obstacle course（obby）game。**358 total sections**（330 regular + 28 secret）のpoolから、Noob Tower は6 sections、Pro Tower は12 sectionsを**random selectしvertical stack**する procedural assembly方式。**No checkpoints** — 落下でbottom（またはlower section）に戻る。8分timer（Noob）/10分timer（Pro）。first player が tower top の white clear gate に touch で win。tower完了で**timer speedが倍速化**し、残りのclimbersにpressure。

**Core mechanics**: parkour platforming（spinning obstacles、disappearing blocks、moving barriers、kill bricks、conveyors、monkey bars等）、momentum management、shift-lock movement、wall hopping（advanced technique）、corner cutting。**Pure skill-based** — stat advantageなし。

**Section difficulty categories**: Easy（20種）、Medium（60+種）、Hard（80+種）、Intense/Extreme、Secret Sections（28種、very low spawn weight）。sections は community builders が create し game に add される。

**Gears**（personal equipment、Pixy's Shopで coins購入）: Hook（grappling hook）、Hourglass（time stop）、Fusion Coil（Gravity + Speed Coil mix）、Trowel（mid-air walkable platform生成）、Gravity Coil、Speed Coil。全gears は **Skill Tree** で upgradeable（80 skill points で max → Pink Halo + Maxed badge獲得、**34,846名のみ**）。

**Mutators**（server-wide effects、coins/Robuxで round毎に購入）: Double Jump、Checkpoints（2 stage毎）、Extra Time（+2分）、Double Coins、Lengthen（+1 section）、Invisibility、Foggy、Speed、Invincibility、Low/Zero Gravity等。**全playerに影響**するため、自分のcoins/Robuxで他者を支援するcooperative dynamic が発生。

**Coin earning**: quadratic formula ⌊MaxCoins × (m/n)²⌋（m=completed sections、n=total sections）。Noob tower完了=100 coins、Pro=250 coins。**XP = coins earned**、Level cap **1,000,000**。Badges: Newbie（first noob tower win、61.3M awarded、**0.8% win rate**）、Pro（first pro tower win、15.1M awarded、**0.1% win rate**）、Certified Beast（THE Tower of Hell完了、**1,427名のみ**）。

### Session設計

average playtime **3.73分**（多くのプレイヤーが join → attempt → fail → leave を迅速に繰り返す）。short round structure が bite-sized sessions を支援。retention hooks は「one more try」loop（next tower が easier かもしれない）、skill mastery progression（genuine skill improvement）、**rage/satisfaction cycle**（brutal no-checkpoint mechanic で frustration → eventual success の深い satisfaction）、cosmetics collection（Halos: Pink/Red/Blue/Teal/Green — prestige items）。

### Monetization

Coins（primary、gameplay earned）+ Robux。Double Coins Game Pass（195R）、Private Servers（250R）、Robux Effect Boxes（15R/個、exclusive cosmetics）、Skill Reset（50R）。**Skill-based, not pay-to-win**: free players が consistently outperform 可能。revenue は volume-based（27B+ visits）。

### 成功要因

**「No checkpoints」が single most important design decision** — core emotional loop そのもの。Procedural assembly（358 sections × random selection × random ordering = effectively infinite unique towers）。visible competition（同tower内で他player climbing/falling/succeeding を観察）。timer acceleration mechanic。Content creator friendliness（speedruns、rage compilations、clutch finishes が inherently entertaining）。community builders による section contribution で content pool が scalable に成長。**「Frustration is a feature, not a bug」** — no-checkpoint mechanic は most hated かつ most beloved。

---

## 8. Mad City — Superpowerが差別化したcops-and-robbers sandbox

### Core game loopとメカニクス

Schwifty Studios（Taylor Sterling）開発のMad City（2017年12月create、2019年1月front page、~2.6B visits）は、open-world action cops-and-robbers。**5 teams**: Prisoner（default、prison escape）→ Criminal（heists実行、cash/XP獲得）、Police（arrest/kill criminals、bounty-based payout + paychecks $1,500/prisoner at midnight）、Hero（限定~6名/server、superpowers保有）、Villain（Hero kill + Power Crystal取得で変身）。

**8 Primary Heists**: Bank（max $7,500/$15K VIP）、Resort/Casino（$10,000/$20K VIP、laser/spotlight回避）、Jewelry Store（$9,000/$18K VIP、drill + glass case破壊 + laser rope [Q/E controls]）、Pyramid（$11,000/$22K VIP、6種obstacle courses + treasure room + skydive exit）、Nightclub、Cargo Ship、Cargo Plane、Mall（stealth or guns-blazing、security cameras shoot + guards kill + vault drill）。**Mini-heists**としてCafé、Gas Stations、Convenience Store、House Heists、Restaurantも存在。

**Hero/Villain system**が最大のdifferentiator。Heroes は Helicarrier で7種のpowersから選択（flight、laser beams、super speed、lightning等）。VillainsはVolcano下のVillain Lairで powers取得（Raven: dark orbs、Phantom/Dutchman: lightning + flying等）。**Power Crystal mechanic**は元々accidental bug だったがcore featureとなった。

**Progression**: XP-based Rank system（season毎にreset）、season rewards every 5/15/20 ranks（exclusive vehicles、skins、emotes）、**Prestige system**（Chapter 2、Rank 100後最大5回）。Bounty system（10,000+で arrest → prison送り）。Daily Challenges（750 XP）、Weekly Challenges（1,500 XP）。**Vehicle system**は140種（109 land、23 aerial、7 sea）、Nitro boost、vehicle customization、weaponized vehicles。

### Chapter 2の教訓

**Chapter 2（2022年7月launch）**はPvP changes、bugs、lagにより mixed reception。2024年6月に資金不足・DAU減少で development halted。**2024年9月にChapter 1 re-release**（Season 4ベース）。peak CCU 244,350（2020年5月）→ current ~900-1,100（Chapter 2）。**「Major overhauls carry enormous risk」** — Chapter 2 の sweeping changes（new physics、combat、maps）がplayer exodusを引き起こした cautionary tale。

### Monetization

Cash ($) がprimary currency（heists、police arrests/kills、paychecks、challenges等で獲得）。8 gamepasses（合計3,100 Robux）: VIP（2x cash）、Double XP、Heavy Weapons（RPG/AWP、**P2W要素**）、SWAT等。XP購入（399R-4,949R）。Chapter 1 re-release では most gamepasses が**free化**。Crate system（Chapter 2、30秒毎にrandom spawn、Robux購入可能）。**P2W criticism**: Heavy Weapons passがpaying playersに significant combat advantage を付与。

### 成功要因と教訓

Jailbreakとの差別化（superpower system、elaborate heists、5-team structure、stronger lore/narrative、140 vehicles）。emergent gameplay（Power Crystal accidental mechanic）。seasonal content system。しかし**技術的安定性の欠如**（mobile performance issues、memory leaks）がDAU減少に直結。**Chapter 2 overhaul failure**はgame development全般への重要教訓: incremental improvement > sweeping overhaul。nostalgia has value（Chapter 1 re-release の成功）。funding sustainability の課題（2.6B visits にも関わらず development halt）。

---

## 9. BedWars — Weekly updates で築いたRoblox最大のcompetitive PvP

### Core game loopとメカニクス

Easy.gg（SnickTrix / Luke Chatton）開発のBedWars（2021年5月beta release、**11.1B visits**、peak CCU 334,747）は、Hypixel BedWarsのRoblox adaptation。core loop: 「**Spawn → Collect iron → Purchase items → Build bed defenses → Bridge to shared generators → Purchase team upgrades → Attack enemy beds → Eliminate teams → Last team standing wins**」。

**Resource Generator system**: Team Generator（Iron every ~1s、Gold slower、upgradeable Iron Forge → Golden → Emerald → Molten Forge [200%]）、Diamond Generator（between team islands、~30s/diamond、team capturable ~10-15秒→90秒lock）、Emerald Generator（map center、~70s/emerald）。

**Win condition**: last team with at least 1 player alive。bed破壊後は respawn不可。**Sudden Death**: ~20分後に全remaining beds auto-destroy。

**Kit system**: **110+ kits**（Fighter/Defender/Economy/Support categories）。pricing 399 Robux or 10,000 BedCoins（older）/ 479 Robux or 12,000 BedCoins（newer）。free kits: Isabelle、Ragnar、Marcel。**weekly free rotation**: 毎金曜3 kits入替（level 20で4 kits）。notable kits: Archer（15% projectile damage boost）、Barbarian（Rageblade）、Builder（fortifying hammer）、Beekeeper Beatrix（bee hive for extra resources）、Crypt（souls collection → skeleton minions summon）、Pyro（Embers-powered flamethrower）、Alchemist（spell crafting）。

**Weapon system**（2023年6月Forge Update後）: Swords（wood→emerald 5 tiers）、Bows、Crossbows、Headhunters、Gauntlets。Armor: Leather→Iron→Diamond→Emerald→Warrior→Void。**Team Upgrades**: Armor Protection I-IV、Damage/Sharpness、Generator Forge、Heal Pool、Traps（Alarm、Mining Fatigue、Tesla Coil）、Bed Alarm。

**Block types**: Wool（cheap、fast bridges）、Stone Brick、Oak Wood Plank、Obsidian（blastproof）、Blastproof Ceramic。Explosives: TNT、Fireball、Siege TNT。Utility: Telepearl、Gloop、Balloons。

**Game modes**: Classic Solos/Doubles/Squads、**Ranked**（5v5、elo-based matchmaking、Bronze→Nightmare 7 tiers）、**30v30**、Custom Match（最大700名、25 teams）、Creative Mode、30+種のrotating LTMs（Lucky Block、SkyWars、Infected、Capture the Flag、Gun Game等）。

### Session設計とretention

average session **~13.86分**。typical classic match 8-15分。**Battle Pass**（seasonal、799 Robux、50 levels + 5 epilogue levels、~16週間/season）。**Daily/Weekly Missions**でBP XP + BedCoins。**Player Level system**（max 50、XP cap 52k/day、first 5k XPに2.5x multiplier）。**Clan system**（2022年3月追加、creation 399R or VIP free）: clan tags、chat、officers/admins、Clan Coins、Clan Shop、Clan Wars。**Weekly updates every Friday at 3PM PDT/6PM EDT** — Roblox上で最もconsistentなupdate scheduleの一つ。**200+ content updates**。

**Ranked system**: account age 7+ days & player level 20+ 必須。7 tiers（Bronze→Silver→Gold→Platinum→Diamond→Emerald→Nightmare）。win 8-25 RP/match。seasonal rewards（community vote で Victorious kit skin決定）。

Tutorial（2024年7月追加、launch後3年以上遅延）は Scholar title + free rental ticket報酬。Roblox版ではMinecraft版よりbridging difficultyが significantly reduced（block placementがblock frontを見る必要なし）、skill floor低下。

### Monetization

**Dual currency**: Robux + **BedCoins**（2024年8月Season 11導入、matches playで最大1,000/day、VIP/Roblox Premium +15% bonus）。BedCoins で kits 購入可能（10,000-12,000 BC）→ **F2P path** 確立。Battle Pass 799R（individual level skip 300R/level）。VIP Gamepass 400R（green [VIP] prefix、50% Armor Trim XP multiplier、20% BedCoin multiplier）。**Kit system as monetization engine**: 110+ kits × 399-479R each = enormous revenue potential。weekly rotation が「try before you buy」incentive。

### 成功要因

**Proven genre adaptation**: Hypixel BedWars formula を Roblox audience 向けに最適化（bridging difficulty低減）。**relentless update cadence**（4年以上weekly Friday updates）。**Kit system as dual-purpose tool**: gameplay variety + monetization。**Multi-layered progression**: Player Level + Battle Pass + Ranked + Clan Level + BedCoins。**massive mode variety**（30+ game modes）。BedCoins追加による P2W criticism への対応。Creative Modeによる UGC platform化。

Kit balance volatilityが constant challenge（110+ kits）。peak CCUからの decline（334K→~40-50K）はnatural lifecycleだが significant。Battle Pass pause（2025年8月）はmonetization model evolution を示唆。

---

## 10. Flee the Facility — Asymmetric horrorの緊張感をRobloxに最適化

### Core game loopとメカニクス

A.W. Apps（MrWindy）開発のFlee the Facility（2017年7月release、**5.4B+ visits**）は、Dead by Daylight inspired のasymmetric multiplayer。**1 Beast vs 最大4 Survivors**。lobby voting（30秒）→ head start（15秒、SurvivorsがmapにspawnしBeastはBeast Caveでpower選択）→ main round（最大15分）→ results。

**Survivor objective**: required number of computers（Survivor count + 1）をhackしてExit Doors 2つをpower up → escape。hacking中にperiodic **Skill Checks**（timed prompts）が出現し、失敗するとcomputer「blow up」→ audible error sound が server-wide に broadcast されBeastに位置暴露。evasion tools: Doors（閉めてBeast遅延）、Windows（vault through）、Vents（Survivorsのみ crawl可能）、Cabinets/Lockers（hide、Seerに invisible）。**Double Jump**（2023年9月追加、3秒毎、元々 movement exploit を「bug → feature化」）。captured teammate のFreeze PodでE press → instant rescue（first rescue: 20 credits + 100 XP）。

**Beast mechanics**: **first-person view lock**（significant design choice — Survivors は third-person で spatial awareness 優位）。Hammer one-hit knockdown → roping → Freeze Pod 設置。hit後約3秒のimmobilization。**Beast Powers**: Runner（Q press sprint）、**Stalker**（2025年7月追加、gemstone light/chase music一時無効化、faster door opening、hit後movement halt無し）、Seer（non-hidden Survivorsの位置reveal、lockerのSurvivorsには無効）。**Anti-camping mechanic**: BeastがFreeze Pod 近くに留まるとhealth drain pause。

**Win conditions**: Survivor ≥1名escape → Survivors win。Beast が全Survivors freeze → Beast win。15分timer切れ → remaining unfrozen Survivors は escaped 扱い。**Exit Doors**: map毎に2つ（Beast single exit guarding防止）、opening 12秒 + loud sound。

### Social & economy

**5名/match**（1 Beast + 4 Survivors）。**Cooperation mechanics**: rescue system（captured teammates解放）、multiple Survivors同一computer同時hack可能、「looping」（Beast周囲を circular run → 時間稼ぎ中に teammates hack）がemergent meta strategy。**Trading Post**（Level 6+、in-game dedicated area）でhammer/gemstone cosmetics trading。community-created maps が submission pipeline 経由で追加。

**Credits**（primary currency）: computer hack 6 credits、Survivor rescue 20 credits、escape 25 credits、Beast freeze 25 credits/Survivor。max Survivor earnings/round ~81 credits + 700 XP、max Beast ~100 credits + 800 XP。Robuxでcredits直接購入可能。**VIP Gamepass（420 Robux）**: 2x map vote weight、15% more XP/credits、VIP Ban Hammer/Gemstone skins。

**Crates**: H Crates（hammer）/ G Crates（gemstone）、直接購入式（2023年10月にlootbox spinning mechanic 削除、Roblox regulatory compliance対応）。rarity: Common 100 credits、Rare 200、Epic 400、Legendary 700。seasonal Bundles（credits 1,500-5,000 or Robux 650）。**Cosmetic-only monetization** — 全hammersは同hitbox、gameplay advantage なし（ただしdarker gemstone skins は visibility reduction の soft advantage）。

### Maps & technical

**15+ permanent maps + event maps**: Facility_0（original）、Abandoned Prison Maximus、Homestead（cornfield）、Airport、Haunted Mansion、School、Laboratory Complex、Arcade（2024年9月）、Shopping Center（2026年1月DTI collab）、Spaceship（2025年7月）等。各mapにComputers/Freeze Pods/Doors/Windows/Ventsの unique models。community-created & submitted。

**Audio design がcritical gameplay mechanic**: chase music、heartbeat（proximity増加）、keyboard typing sounds（hacking中）、door sounds、computer error sounds（Skill Check失敗）→ 両roleの information channels。**Client-server hit validation**: Beast hits are client-side for responsiveness + server-side distance check for integrity（2025年7月にdistance threshold拡大でlatency由来の「broken hammers」対応）。

### 成功要因

**Simplicity of concept**（「RUN, HIDE, ESCAPE!」）。**Asymmetric tension design**（first-person Beast vs third-person Survivors → fundamentally different emotional experiences）。**Strong audio-visual feedback loop**（gemstone glow、heartbeat、chase music が genuine tension/jump scares を創出）。**Cosmetic-only monetization** でgameplay fair維持しつつcollector/trader engagement 駆動。**Community-driven content pipeline**（map submissions）。**「Make a bug a feature」philosophy**（Double Jump）。**Anti-frustration mechanics**の徹底（anti-camping、extra computer beyond requirement、2 exit doors、player leave 時のcomputer requirement scale down、15秒head start）。8年間にわたりtens of thousands concurrent を維持し**5B+ visits**を達成。

---

## Cross-game分析: 10ゲームから導出される設計原則

### Monetization spectrumは「generosity」と「aggressiveness」の両極で成功している

Brookhaven（ARPDAU $0.02、daily reward無し）とPet Simulator X（13種のgamepass + Exclusive Eggs recurring purchase + timer skip）という両極端がいずれもtop-grossingに位置する。前者はvolume strategy（120M+ MAUで$0.02/DAUでも莫大な revenue）、後者はwhale-friendly ceiling strategy。Adopt Me!はその中間で、$2.99/月のPets Plus subscriptionが predictable recurring revenue を生む。開発者はtarget audienceとgame typeに応じて spectrum上の位置を選択すべきである。

### 「Simple core loop + deep metagame」がRobloxで最も再現性の高い成功パターン

Tower of Hell（climb）、Hide and Seek Extreme（hide/seek）、Flee the Facility（hack/escape）は core mechanicが1文で説明可能だが、surrounding systems（trading economy、cosmetic collection、skill mastery、community content）が depth を提供する。Pet Simulator X/99は最もextreme な例で、click-to-collectのtrivial loopが1,000+ petsのcollection/trading/fusing metagameを支える。BedWarsは110+ kitsでstrategic depthを追加しつつ、base gameは「bed守って敵bed壊す」の simple concept。

### Update cadenceはplayer retentionの最大determinant

BedWars（weekly Friday updates 4年以上）、PS99（72 updates in 2年）、Brookhaven（weekly Friday updates）が consistently high CCU を維持する一方、Hide and Seek Extreme（~1年間 update無し）は evergreen designの強さで sustain するが growth は限定的。Theme Park Tycoon 2（580+ updates from solo developer over 9年）は singular commitment の exemplar。Mad City のChapter 2 development haltがDAU急落に直結した事例は negative proof。

### Community-generated contentがcontent pipeline scalabilityの鍵

Tower of Hellの section submissions、Flee the Facilityの map submissions、Theme Park Tycoon 2の blueprint community、BedWarsの Creative Mode、Brookhaven/Bloxburg の YouTube/TikTok house build ecosystem — いずれもdeveloper effort に比例しない content growth を実現している。**User-generated contentは developer bottleneck を解消する最も効果的な手段**である。

### Social systemsは optional ではなく core architecture

Adopt Me!（trading/families/stands）、Pet Simulator X（Trading Plaza/Clans）、BedWars（Clans/Ranked/Parties）、Flee the Facility（rescue mechanic/Trading Post）— 全成功タイトルがsocial mechanicsをcore loopに統合している。Brookhavenはsocial platformそのものとして設計されており、Bloxburgのemergent builder hire economyは設計者が想定しなかったsocial layerである。

### Cross-platform accessibility（特にmobile）は非交渉要件

Roblox sessionsの72%以上がmobileで発生する。Brookhavenの low graphical requirements、Adopt Me!のno-combat low-processing design、Hide and Seek Extremeの lightweight maps、Tower of Hellの basic parts-based sections — いずれもmobile-first設計。BedWarsのSeason X mobile layout customization、Mad City Chapter 2のmobile performance issues（→ DAU減少要因）は positive/negative 両面の evidence。

### Emotional design > mechanical complexity

Hide and Seek Extremeの「nearly caught」tension、Tower of Hellの rage/satisfaction cycle、Flee the Facilityの heartbeat/chase music horror、Adopt Me!のpet nurturing emotional bond、Brookhavenのidentity attachment — **プレイヤーが feeling する emotional experience が technical sophistication より retention を駆動する**。これはRobloxのprimary audience（9-14歳）にとって particularly true であり、complex mechanical depth より accessible emotional hooks が engagement を生む。