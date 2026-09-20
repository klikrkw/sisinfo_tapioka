"use server";

import { db } from "@/db";
import { sales, saleItems, stockMovements, receivablePayments, cashTransactions, customers } from "@/db/schema";
import { eq, desc, like, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

export async function createSale(data: {
  number: string;
  date: string;
  customerId: number;
  warehouseId: number;
  paymentMethod: "Cash" | "Transfer" | "Credit";
  termDays: number;
  notes?: string;
  items: { productId: number; quantity: number; price: number; discount: number }[];
}) {
  const totalAmount = data.items.reduce((acc, i) => acc + i.quantity * i.price - i.discount, 0);
  const dueDate = data.paymentMethod === "Credit"
    ? new Date(new Date(data.date).getTime() + data.termDays * 86400000)
    : null;

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
      const subtotal = item.quantity * item.price - item.discount;
      await tx.insert(saleItems).values({
        saleId,
        productId: item.productId,
        quantity: String(item.quantity),
        price: String(item.price),
        discount: String(item.discount),
        subtotal: String(subtotal),
      });

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
