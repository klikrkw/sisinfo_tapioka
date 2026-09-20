"use server";

import { db } from "@/db";
import { cashTransactions, expenses } from "@/db/schema";
import { desc, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCashTransactionsPaginated(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit;
  const whereCond = search ? like(cashTransactions.description, `%${search}%`) : undefined;
  const data = await db.select().from(cashTransactions).where(whereCond).orderBy(desc(cashTransactions.id)).limit(limit).offset(offset);
  const all = await db.select().from(cashTransactions).where(whereCond);
  const inTotal = await db.select().from(cashTransactions);
  const totalIn = inTotal.filter((t) => t.type === "IN").reduce((a, t) => a + Number(t.amount), 0);
  const totalOut = inTotal.filter((t) => t.type === "OUT").reduce((a, t) => a + Number(t.amount), 0);
  return { data, total: all.length, totalIn, totalOut };
}

export async function createCashTransaction(data: {
  date: string;
  type: "IN" | "OUT";
  category: string;
  description: string;
  amount: number;
}) {
  await db.insert(cashTransactions).values({
    number: `PAY/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${String(Date.now()).slice(-6)}`,
    date: new Date(data.date),
    type: data.type,
    category: data.category,
    description: data.description,
    amount: String(data.amount),
  });
  revalidatePath("/finance");
}

export async function getExpensesPaginated(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit;
  const whereCond = search ? like(expenses.name, `%${search}%`) : undefined;
  const data = await db.select().from(expenses).where(whereCond).orderBy(desc(expenses.id)).limit(limit).offset(offset);
  const all = await db.select().from(expenses).where(whereCond);
  const totalAmount = all.reduce((a, e) => a + Number(e.amount), 0);
  return { data, total: all.length, totalAmount };
}

export async function createExpense(data: {
  date: string;
  category: string;
  name: string;
  amount: number;
  notes?: string;
}) {
  await db.insert(expenses).values({
    number: `EXP/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${String(Date.now()).slice(-6)}`,
    date: new Date(data.date),
    category: data.category,
    name: data.name,
    amount: String(data.amount),
    notes: data.notes,
  });
  revalidatePath("/finance/expenses");
}
