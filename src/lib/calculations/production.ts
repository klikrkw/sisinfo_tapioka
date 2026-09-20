export function calculateHpp(totalProductionCost: number, byProductValue: number, flourQty: number) {
  const netFlourCost = totalProductionCost - byProductValue;
  const hppPerKg = flourQty > 0 ? netFlourCost / flourQty : 0;
  return { netFlourCost, hppPerKg };
}
