// Maintained suggestions only. Owners confirm the exact model and enter their own specifications.
// Sources: https://www.mahindratractor.com/tractors/latest-tractors
// https://shaktimanagro.com/products_type/rotary-tiller/
// https://www.fieldking.com/product-portfolio/plough/
export const equipmentModelSuggestions: Record<
  string,
  Record<string, string[]>
> = {
  TRACTOR: { Mahindra: ["575 DI", "575 DI MS", "575 DI XP Plus"] },
  ROTAVATOR: {
    Shaktiman: [
      "Regular Plus Series",
      "Tusker",
      "Semi Champion",
      "Proton",
      "Atom",
      "Fighter",
    ],
  },
  PLOUGH: {
    Fieldking: [
      "Mounted Mould Board Plough",
      "Jumbo Fixed Mould Board Plough",
      "Maxx Reversible MB Plough",
    ],
  },
};
