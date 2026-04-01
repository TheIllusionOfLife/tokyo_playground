# Daruma Doll Vehicle

## Roblox AI Assistant Prompt

> Create a 3D model named "DarumaTemplate" in ServerStorage. A Japanese Daruma doll. Large perfectly round spherical body with no legs or arms. Painted face on the front: thick black eyebrows, large round black eyes, small red mouth, and a simple mustache/beard outline. Red body with a gold kanji character painted on the belly area. Flat bottom so it can rock but not roll. Approximately 5 studs diameter. The model must have a Part named "Body" as PrimaryPart. Include a welded part named "Anim_Body" (for rock/wobble animation). Low-poly (under 1500 triangles), SmoothPlastic material. Do NOT create a VehicleSeat or scripts.

## AnimProfile: Static

## Part Requirements
- **Body** (PrimaryPart): Large red sphere, flat bottom
- **Anim_Body**: Duplicate body reference for wobble animation via Weld C1
- **FaceDecal** (optional): Painted face features on front

## Colors
- Body: Red (200, 30, 30)
- Face features: Black eyebrows/eyes, red mouth
- Belly kanji: Gold (220, 180, 50)
- Bottom: Slightly darker red

## Verify
- [ ] `ServerStorage.DarumaTemplate` exists as Model
- [ ] Body part is set as PrimaryPart
- [ ] Anim_Body welded to Body
- [ ] Under 1500 triangles
- [ ] No VehicleSeat or scripts
