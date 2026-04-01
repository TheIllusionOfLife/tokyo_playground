# Kart Vehicle

## Roblox AI Assistant Prompt

> Create a 3D model named "KartTemplate" in ServerStorage. A miniature Japanese-style go-kart. Rectangular body with rounded edges, four small black cylinder wheels, a small transparent windshield at front, and a small flag pole at back with a red flag. Red body with white racing stripe down the center. Approximately 7 studs long, 3 studs wide, 2.5 studs tall. The model must have a Part named "Body" as PrimaryPart. Include separate welded parts named: Anim_WheelFL, Anim_WheelFR, Anim_WheelBL, Anim_WheelBR. Low-poly (under 2000 triangles), SmoothPlastic material. Do NOT create a VehicleSeat or scripts.

## AnimProfile: Wheeled

## Part Requirements
- **Body** (PrimaryPart): Rectangular chassis with rounded edges, red
- **Anim_WheelFL/FR/BL/BR**: Small black cylinder wheels
- **Windshield** (static, welded): Small transparent part at front
- **FlagPole** (static, welded): Thin pole at back with red flag

## Colors
- Body: Red (200, 30, 30) with white stripe (255, 255, 255)
- Wheels: Dark grey/black (30, 30, 30)
- Windshield: Light blue, Transparency 0.5

## Verify
- [ ] `ServerStorage.KartTemplate` exists as Model
- [ ] Body part is set as PrimaryPart
- [ ] All Anim_Wheel* parts are welded to Body
- [ ] Under 2000 triangles
- [ ] No VehicleSeat or scripts
