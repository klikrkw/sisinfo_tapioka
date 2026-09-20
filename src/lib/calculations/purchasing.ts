export function calculatePurchaseWeight(gross: number, tare: number, refactionPercent: number) {
  const netWeight = gross - tare;
  const refactionWeight = (netWeight * refactionPercent) / 100;
  const payableWeight = netWeight - refactionWeight;
  return { netWeight, refactionWeight, payableWeight };
}

export function calculatePurchaseAmount(payableWeight: number, pricePerKg: number, deductionsTotal: number = 0) {
  const baseAmount = payableWeight * pricePerKg;
  const netAmount = baseAmount - deductionsTotal;
  return { baseAmount, netAmount };
}
