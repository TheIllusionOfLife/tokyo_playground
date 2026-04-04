# Release Guide: Shibuya Open World

---

## Pre-Release Checklist

### Roblox Configuration
- [ ] Content Maturity Questionnaire completed (done)
- [ ] Game Settings > Communication > Server Announcements enabled
- [ ] Max Players set to 10
- [ ] Genre: All Genres
- [ ] Supported platforms: PC, Mobile, Console verified
- [ ] Game icon uploaded (see `icon-prompt.md`)
- [ ] Thumbnails uploaded (see `screenshot-video-guide.md`)
- [ ] Game description set (EN + JA from `GAME_INFO.md`)
- [ ] Genre tags: Party Game, Mini Games, Social Hangout, Exploration, Anime
- [ ] Regional Pricing enabled for Game Passes (default as of 2026-03-30)

### Performance Verification
- [ ] Mobile playtest: sustained 30+ FPS on mid-range device
- [ ] Memory usage under 600MB on mobile
- [ ] StreamingEnabled working (city streams in/out smoothly)
- [ ] No script errors in Developer Console (F9)

### Gameplay Verification
- [ ] Can Kick: full round completes, oni/hider roles work
- [ ] Shibuya Scramble: tag game, car dodging, slides work
- [ ] Hachi Ride: evolution, items falling, collection, scoring
- [ ] Lobby: shop, missions, stamps, emotes, NPC interaction
- [ ] Matchmaking: lobby timer, voting, transitions
- [ ] Data persistence: points, levels, inventory save/load across sessions

### Store Listing
- [ ] 5 screenshots uploaded (see `screenshot-video-guide.md`)
- [ ] Game icon 512x512 uploaded
- [ ] Short description (EN + JA)
- [ ] Long description (EN + JA)

### Social
- [ ] Roblox Group created (or existing group linked)
- [ ] Group link added to game page
- [ ] Discord server set up (optional)
- [ ] Social links added to `GAME_INFO.md`

### Attribution
- [ ] PLATEAU attribution in game description: "City data from Project PLATEAU by Ministry of Land, Infrastructure, Transport and Tourism (MLIT), Japan. Licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Source: https://www.mlit.go.jp/plateau/"

---

## Post-Release

- [ ] Enable Rewarded Video Ads after 2,000+ monthly uniques
- [ ] Monitor Creator Hub analytics daily for first week
- [ ] Watch for error reports in Developer Console
- [ ] Set up Roblox Moments / CaptureService triggers for viral clips
- [ ] Enable SLIM on city_and_roads (requires TeamCreate)
