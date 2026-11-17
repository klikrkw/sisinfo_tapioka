"use server";

import { db } from "@/db";
import { sales, saleItems, stockMovements, receivablePayments, cashTransactions, customers, brands } from "@/db/schema";
import { getProductUnitCosts } from "./costing-actions";
import { consumeStockFifo } from "@/lib/inventory/layers";
import { eq, desc, like, and, ne, isNull, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateDocumentNumber } from "@/actions/numbering-actions";

export async function getSalesPaginated(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit;
  const whereCond = search ? like(sales.number, `%${search}%`) : undefined;
  const data = await db.select().from(sales).where(whereCond).orderBy(desc(sales.id)).limit(limit).offset(offset);
  const all = await db.select().from(sales).where(whereCond);
  return { data, total: all.length };
}

export async function getSaleById(id: number) {
  const rows = await db.select().from(sales).where(eq(sales.id, id)).limit(1);
  if (rows.length === 0) return null;
  const items = await db.select().from(saleItems).where(eq(saleItems.saleId, id));
  const payments = await db.select().from(receivablePayments).where(eq(receivablePayments.saleId, id));
  const customer = (await db.select().from(customers).where(eq(customers.id, rows[0].customerId)).limit(1))[0] ?? null;
  return { ...rows[0], items, payments, customer };
}

/**
 * Ambil nomor surat jalan milik penjualan. Jika belum ada, buat dari
 * document_sequences (docType DELIVERY_NOTE) lalu simpan agar stabil.
 */
export async function getOrCreateDeliveryNoteNumber(saleId: number) {
  const rows = await db.select().from(sales).where(eq(sales.id, saleId)).limit(1);
  if (rows.length === 0) return null;
  if (rows[0].deliveryNoteNumber) return rows[0].deliveryNoteNumber;

  const number = await generateDocumentNumber("DELIVERY_NOTE");

  // Hanya isi bila masih kosong (hindari menimpa nomor yang sudah dibuat paralel).
  await db
    .update(sales)
    .set({ deliveryNoteNumber: number })
    .where(and(eq(sales.id, saleId), isNull(sales.deliveryNoteNumber)));

  const saved = await db
    .select({ number: sales.deliveryNoteNumber })
    .from(sales)
    .where(eq(sales.id, saleId))
    .limit(1);

  return saved[0]?.number ?? number;
}

export async function createSale(data: {
  number: string;
  date: string;
  customerId: number;
  warehouseId: number;
  paymentMethod: "Cash" | "Transfer" | "Credit";
  termDays: number;
  notes?: string;
  items: { productId: number; quantity: number; weight?: number | null; price: number; discount: number; brandId?: number | null }[];
}) {
  /**
   * Dasar hitung harga: jumlah berat (qty x berat per satuan).
   * Bila berat belum diisi, dipakai qty (mis. penjualan tanpa timbang).
   */
  const itemSubtotal = (item: { quantity: number; weight?: number | null; price: number; discount: number }) => {
    const totalWeight = Number(item.weight) > 0 ? item.quantity * Number(item.weight) : 0;
    const basis = totalWeight > 0 ? totalWeight : item.quantity;
    return basis * item.price - item.discount;
  };

  const totalAmount = data.items.reduce((acc, i) => acc + itemSubtotal(i), 0);
  const dueDate = data.paymentMethod === "Credit"
    ? new Date(new Date(data.date).getTime() + data.termDays * 86400000)
    : null;

  // HPP dibekukan saat transaksi dibuat agar margin historis tidak berubah.
  const costMap = await getProductUnitCosts();
  const costFor = (productId: number) => costMap[productId];

  // Nama merek diambil dari master agar snapshot yang disimpan konsisten.
  const brandIds = Array.from(
    new Set(data.items.map((i) => i.brandId).filter((id): id is number => typeof id === "number" && id > 0))
  );
  const brandRows = brandIds.length
    ? await db.select().from(brands).where(inArray(brands.id, brandIds))
    : [];
  const brandNameById = new Map(brandRows.map((b) => [b.id, b.name]));

  try {
    await db.transaction(async (tx) => {
      // Validate stock before posting
      for (const item of data.items) {
        const last = await tx
          .select()
          .from(stockMovements)
          .where(and(eq(stockMovements.warehouseId, data.warehouseId), eq(stockMovements.productId, item.productId)))
          .orderBy(desc(stockMovements.id))
          .limit(1);
        const available = last.length ? Number(last[0].balance) : 0;
        if (item.quantity > available) {
          throw new Error(`Stok tidak mencukupi untuk produk #${item.productId}: tersedia ${available}, diminta ${item.quantity}`);
        }
      }

      const [res] = await tx.insert(sales).values({
      number: data.number,
      date: new Date(data.date),
      customerId: data.customerId,
      warehouseId: data.warehouseId,
      paymentMethod: data.paymentMethod,
      termDays: data.termDays,
      dueDate,
      status: "Posted",
      totalAmount: String(totalAmount),
      notes: data.notes,
    });
    const saleId = Number(res.insertId);

    for (const item of data.items) {
      const subtotal = itemSubtotal(item);
      const fallbackCost = costFor(item.productId);
      const [itemRes] = await tx.insert(saleItems).values({
        saleId,
        productId: item.productId,
        brandId: item.brandId ?? null,
        brandName: item.brandId ? brandNameById.get(item.brandId) ?? null : null,
        quantity: String(item.quantity),
        weight: item.weight !== undefined && item.weight !== null && Number(item.weight) > 0 ? String(item.weight) : null,
        totalWeight:
          item.weight !== undefined && item.weight !== null && Number(item.weight) > 0
            ? String(item.quantity * Number(item.weight))
            : null,
        price: String(item.price),
        discount: String(item.discount),
        subtotal: String(subtotal),
      });
      const saleItemId = Number(itemRes.insertId);

      // HPP FIFO: pakai layer stok paling lama, snapshot disimpan di item.
      const fifo = await consumeStockFifo(tx, {
        warehouseId: data.warehouseId,
        productId: item.productId,
        qty: item.quantity,
        date: data.date,
        refType: "SALE",
        refId: saleId,
        saleItemId,
        fallbackUnitCost: fallbackCost?.unitCost ?? 0,
      });

      await tx
        .update(saleItems)
        .set({
          hppPerUnit: String(fifo.unitCost),
          hppAmount: String(fifo.amount),
          costSource: "FIFO",
        })
        .where(eq(saleItems.id, saleItemId));

      const last = await tx
        .select()
        .from(stockMovements)
        .where(and(eq(stockMovements.warehouseId, data.warehouseId), eq(stockMovements.productId, item.productId)))
        .orderBy(desc(stockMovements.id))
        .limit(1);
      const prev = last.length ? Number(last[0].balance) : 0;
      await tx.insert(stockMovements).values({
        warehouseId: data.warehouseId,
        productId: item.productId,
        type: "SALE",
        referenceId: saleId,
        qtyIn: "0",
        qtyOut: String(item.quantity),
        balance: String(prev - item.quantity),
      });
    }

    // Cash sale -> cash in
    if (data.paymentMethod !== "Credit") {
      await tx.insert(cashTransactions).values({
        number: data.number,
        date: new Date(data.date),
        type: "IN",
        category: "Penjualan",
        description: `Penerimaan penjualan ${data.number}`,
        amount: String(totalAmount),
      });
    }
    });

    revalidatePath("/sales");
    revalidatePath("/warehouse");
    return { success: true };
  } catch (e) {
    console.error("createSale failed:", e);
    return { success: false, error: e instanceof Error ? e.message : "Terjadi kesalahan tidak diketahui" };
  }
}

export async function getReceivables() {
  const rows = await db
    .select()
    .from(sales)
    .where(and(eq(sales.paymentMethod, "Credit"), ne(sales.status, "Cancelled")))
    .orderBy(desc(sales.id));

  const results = await Promise.all(
    rows.map(async (s) => {
      const customer = (await db.select().from(customers).where(eq(customers.id, s.customerId)).limit(1))[0] ?? null;
      const pmts = await db.select().from(receivablePayments).where(eq(receivablePayments.saleId, s.id));
      const paidTotal = pmts.reduce((a, x) => a + Number(x.amount), 0);
      const total = Number(s.totalAmount);
      return {
        ...s,
        customerName: customer?.name ?? "-",
        paidTotal,
        outstanding: total - paidTotal,
        payments: pmts,
      };
    })
  );
  return results;
}

export async function recordReceivablePayment(saleId: number, amount: number, date: string, notes?: string) {
  await db.transaction(async (tx) => {
    await tx.insert(receivablePayments).values({
      saleId,
      date: new Date(date),
      amount: String(amount),
      notes,
    });
    const sale = (await tx.select().from(sales).where(eq(sales.id, saleId)).limit(1))[0];
    const payments = await tx.select().from(receivablePayments).where(eq(receivablePayments.saleId, saleId));
    const paidTotal = payments.reduce((a, p) => a + Number(p.amount), 0);
    if (paidTotal >= Number(sale.totalAmount)) {
      await tx.update(sales).set({ status: "Paid" }).where(eq(sales.id, saleId));
    }
    await tx.insert(cashTransactions).values({
      date: new Date(date),
      type: "IN",
      category: "Penerimaan Piutang",
      description: `Pembayaran piutang ${sale.number}`,
      amount: String(amount),
    });
  });
  revalidatePath("/sales");
  revalidatePath("/sales/receivables");
}
