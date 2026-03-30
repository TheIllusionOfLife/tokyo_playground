# HatTokyoTower: Tokyo Tower Cap

## Prompt

> Create a hat accessory named "HatTokyoTower" and place it in ServerStorage.Cosmetics. A novelty hat shaped like a miniature Tokyo Tower. The iconic red-orange lattice tower sitting on top of the character's head. Cartoonish, slightly oversized for comedic effect. Simplified lattice. Low-poly, mobile-friendly.

## Verify
- [ ] `ServerStorage.Cosmetics.HatTokyoTower` exists as `Accessory`
- [ ] Looks correct on character head

## Code Change After Creation
Add to `SHOP_CATALOG` in `src/shared/constants.ts`:
```ts
{ id: ItemId.HatTokyoTower, name: "Tokyo Tower Cap", category: ItemCategory.Hat, price: 650, levelRequired: 5 },
```
