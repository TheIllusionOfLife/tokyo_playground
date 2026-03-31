# Roblox AI Assistant Prompts: Visual Polish

Copy-paste these prompts into Roblox Assistant to generate improved meshes and materials.
After generation, follow the workflow in `assets/ai-prompts/README.md` (copy MeshId from raw Model into Accessory).

---

## Hachi Minigame: Collectible Items

### Normal Point Object (Green Coin)

```
Generate a small collectible coin, roughly 2 studs in diameter. It should look like a glowing vivid green token with a subtle paw print embossed on the front face. Material should be smooth with a neon-like glow. Color: vivid green (#32FF50). Keep it low-poly (under 500 triangles) since we spawn hundreds of these. No sharp edges. The green should be bright and eye-catching against urban city backgrounds.
```

### Bonus Point Object (Golden Star)

```
Generate a golden star collectible, about 5 studs across. It should be a 5-pointed star shape with rounded tips, glowing gold color (#FFD700). Make it look premium and eye-catching with a slight metallic sheen. Keep under 800 triangles. It should stand out clearly against blue coins.
```

---

## Shop Trails

**Note:** Roblox Assistant CANNOT generate custom pattern textures (paw prints, petals, etc.).
Our trails use `Trail` objects with `ColorSequence` + `Transparency`, not texture images.

To improve trail visuals, two options:

### Option A: Add ParticleEmitter alongside Trail (Assistant CAN help)

Ask Assistant to generate small 3D meshes to use as particle shapes:

```
Generate a tiny sakura petal, about 0.3 studs wide. Soft pink color, flat and slightly curved like a real cherry blossom petal. Very low poly.
```

```
Generate a tiny paw print shape, about 0.3 studs wide. Flat, soft edges, warm yellow-orange color.
```

```
Generate a small flame wisp shape, about 0.4 studs tall. Stylized, smooth, warm orange to red gradient.
```

Then attach a `ParticleEmitter` to the trail attachment that emits these meshes.

### Option B: External texture generation (for texture-based trails)

Use an external AI image generator (DALL-E, Midjourney, Stable Diffusion) with these prompts:

- **Paw Trail**: "Repeating paw prints, soft-edged, glowing yellow-orange, transparent background, 256x256, seamless tile"
- **Cherry Blossom**: "Scattered sakura petals, soft pink, transparent background, 256x256"
- **Flame**: "Stylized flame wisps, orange to red gradient, transparent background, 256x256"
- **Spark**: "Electric sparks, deep purple to violet, transparent background, 256x256"
- **Rainbow**: "Smooth rainbow gradient bands, neon glow, 256x256"

Upload to Roblox via Asset Manager, then use as `Trail.Texture`.

---

## Usage Notes

- After generating meshes, check the raw Model in Workspace (not ServerStorage Accessory)
- Copy the numeric `rbxassetid://` MeshId and TextureId from the raw MeshPart
- Assistant CAN: generate 3D meshes, PBR materials (generic surfaces)
- Assistant CANNOT: generate custom pattern textures, transparent PNGs, specific pixel art
- Daily generation quota: ~5 full meshes + 25 previews per day
