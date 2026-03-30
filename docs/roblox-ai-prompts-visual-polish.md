# Roblox AI Assistant Prompts: Visual Polish

Copy-paste these prompts into Roblox Assistant to generate improved meshes and materials.
After generation, follow the workflow in `assets/ai-prompts/README.md` (copy MeshId from raw Model into Accessory).

---

## Hachi Minigame: Collectible Items

### Normal Point Object (Blue Coin)

```
Generate a small collectible coin, roughly 2 studs in diameter. It should look like a glowing blue token with a subtle star or paw print embossed on the front face. Material should be smooth with a neon-like glow. Color: light blue (#64C8FF). Keep it low-poly (under 500 triangles) since we spawn hundreds of these. No sharp edges.
```

### Bonus Point Object (Golden Star)

```
Generate a golden star collectible, about 5 studs across. It should be a 5-pointed star shape with rounded tips, glowing gold color (#FFD700). Make it look premium and eye-catching with a slight metallic sheen. Keep under 800 triangles. It should stand out clearly against blue coins.
```

---

## Shop Trails

### Neon Paw Trail (TrailStar)

```
Generate a PBR material variant for a trail effect. Create a texture with repeating paw print shapes on a transparent background. Paw prints should be soft-edged, glowing yellow-orange, spaced evenly. The texture should tile seamlessly along one axis. Size: 256x256.
```

### Cherry Blossom Trail (TrailCherryBlossom)

```
Generate a PBR material variant for a trail effect. Create a texture with scattered sakura (cherry blossom) petals in soft pink (#FFB4C8) on a transparent background. Petals should be small, varied in rotation, and slightly translucent. The texture should look like petals drifting in the wind. Size: 256x256.
```

### Lantern Flame Trail (TrailFlame)

```
Generate a PBR material variant for a trail effect. Create a texture with stylized flame wisps in warm orange (#FF6400) to red (#FF3200) gradient. Flames should be soft and flowing, not sharp or aggressive. Think paper lantern glow, not wildfire. Size: 256x256.
```

### Midnight Spark Trail (TrailMidnightSpark)

```
Generate a PBR material variant for a trail effect. Create a texture with electric spark patterns in deep purple (#6432C8) to violet (#B464FF). Sparks should be thin, bright, and scattered like static electricity. Background should be transparent. Size: 256x256.
```

### Crossing Lights Trail (TrailRainbow)

```
Generate a PBR material variant for a trail effect. Create a texture with horizontal bands of rainbow colors (red, orange, yellow, green, blue, purple) blending smoothly into each other. Bands should be soft-edged and gradient, not hard stripes. Think neon light reflections on wet pavement. Size: 256x256.
```

---

## Usage Notes

- After generating, check the raw Model in Workspace (not ServerStorage Accessory)
- Copy the numeric `rbxassetid://` MeshId and TextureId from the raw MeshPart
- For trail textures: apply as ImageLabel or use in ParticleEmitter if converting trails to particles later
- Daily generation quota: ~5 full meshes + 25 previews per day
