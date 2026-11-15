/**
 * Perhitungan FIFO murni (tanpa akses DB) agar mudah diuji.
 */

export type FifoLayerInput = {
  id: number;
  qtyRemaining: number;
  unitCost: number;
};

export type FifoUsage = {
  layerId: number;
  qty: number;
  unitCost: number;
  amount: number;
};

export type FifoResult = {
  usages: FifoUsage[];
  consumedQty: number;
  /** Qty yang tidak tercakup layer (data lama / stok tanpa layer). */
  shortfall: number;
  totalAmount: number;
  unitCost: number;
};

/**
 * Mengambil qty dari layer paling awal (urutan array dianggap FIFO).
 * Qty yang melebihi total layer dikembalikan sebagai `shortfall`.
 */
export function consumeFifoLayers(layers: FifoLayerInput[], qty: number): FifoResult {
  const target = Math.max(qty || 0, 0);
  const usages: FifoUsage[] = [];
  let remaining = target;

  for (const layer of layers) {
    if (remaining <= 0) break;
    const available = Math.max(layer.qtyRemaining || 0, 0);
    if (available <= 0) continue;

    const take = Math.min(available, remaining);
    usages.push({
      layerId: layer.id,
      qty: take,
      unitCost: layer.unitCost,
      amount: take * layer.unitCost,
    });
    remaining -= take;
  }

  const consumedQty = target - remaining;
  const totalAmount = usages.reduce((a, u) => a + u.amount, 0);

  return {
    usages,
    consumedQty,
    shortfall: remaining,
    totalAmount,
    unitCost: consumedQty > 0 ? totalAmount / consumedQty : 0,
  };
}

/** Nilai persediaan dari sisa layer. */
export function inventoryValue(layers: { qtyRemaining: number; unitCost: number }[]) {
  return layers.reduce((a, l) => a + Math.max(l.qtyRemaining, 0) * l.unitCost, 0);
}
