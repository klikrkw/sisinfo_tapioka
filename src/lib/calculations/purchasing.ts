export function calculatePurchaseWeight(gross: number, tare: number, refactionPercent: number) {
  const netWeight = gross - tare;
  const refactionWeight = (netWeight * refactionPercent) / 100;
  const payableWeight = netWeight - refactionWeight;
  return { netWeight, refactionWeight, payableWeight };
}

export function calculatePurchaseAmount(
  payableWeight: number,
  pricePerKg: number,
  deductionsTotal: number = 0,
  costsTotal: number = 0
) {
  const baseAmount = payableWeight * pricePerKg;
  const netAmount = baseAmount - deductionsTotal + costsTotal;
  return { baseAmount, netAmount };
}

/**
 * Memisahkan baris potongan (mengurangi pembayaran) dan biaya (menambah total).
 * Biaya = impactType PURCHASE_COST.
 */
export function splitDeductions(items: { amount: number | string; impactType?: string | null }[]) {
  let deductions = 0;
  let costs = 0;
  for (const item of items) {
    const amount = Number(item.amount) || 0;
    if (item.impactType === "PURCHASE_COST") costs += amount;
    else deductions += amount;
  }
  return { deductions, costs };
}

export type DeductionCalculationType = "fixed" | "per_kg" | "per_sack" | "percentage";

/**
 * Menghitung qty dasar sebuah potongan.
 * - fixed      -> 1
 * - per_kg     -> berat dibayar (Kg)
 * - per_sack   -> jumlah sak
 * - percentage -> 1 (tarif diperlakukan sebagai %)
 */
export function calculateDeductionQuantity(params: {
  calculationType: string;
  payableWeight: number;
  sackCount: number;
}) {
  const { calculationType, payableWeight, sackCount } = params;
  if (calculationType === "per_kg") return payableWeight;
  if (calculationType === "per_sack") return sackCount;
  return 1;
}

/**
 * Menghitung nominal potongan.
 * - per_kg     -> berat dibayar x tarif
 * - per_sack   -> jumlah sak x tarif
 * - percentage -> nilai bahan baku x tarif / 100
 * - fixed      -> tarif
 */
export function calculateDeductionAmount(params: {
  calculationType: string;
  rate: number;
  payableWeight: number;
  baseAmount: number;
  sackCount: number;
}) {
  const { calculationType, rate, payableWeight, baseAmount, sackCount } = params;
  if (calculationType === "per_kg") return payableWeight * rate;
  if (calculationType === "per_sack") return sackCount * rate;
  if (calculationType === "percentage") return (baseAmount * rate) / 100;
  return rate;
}

export const deductionTypeLabel = (type: string) =>
  type === "per_kg"
    ? "Per Kg"
    : type === "per_sack"
      ? "Per Sak"
      : type === "percentage"
        ? "Persentase"
        : "Fixed";
