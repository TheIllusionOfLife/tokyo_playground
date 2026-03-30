# HatKitsuneMask: Kitsune Mask

## Prompt

> Create a hat accessory named "HatKitsuneMask" and place it in ServerStorage.Cosmetics. Delete the original model from Workspace after placing. A traditional Japanese white fox (kitsune) mask worn tilted on top of the head. Red markings around the eyes and forehead. Festival aesthetic. Low-poly, mobile-friendly.

## Verify
- [ ] `ServerStorage.Cosmetics.HatKitsuneMask` exists as `Accessory`
- [ ] Looks correct on character head

## Code Change After Creation
Add to `SHOP_CATALOG` in `src/shared/constants.ts`:
```ts
{ id: ItemId.HatKitsuneMask, name: "Kitsune Mask", category: ItemCategory.Hat, price: 400, levelRequired: 4 },
```
