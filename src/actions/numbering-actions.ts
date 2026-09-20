"use server";

import { db } from "@/db";
import { documentSequences } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const DEFAULT_PATTERNS: Record<string, { prefix: string; pattern: string; table: string }> = {
  PURCHASE: { prefix: "PB", pattern: "PB/{YYYY}/{MM}/{000001}", table: "purchases" },
  PRODUCTION: { prefix: "PRD", pattern: "PRD/{YYYY}/{MM}/{000001}", table: "production_batches" },
  SALES: { prefix: "PJ", pattern: "PJ/{YYYY}/{MM}/{000001}", table: "sales" },
  SHIPMENT: { prefix: "DO", pattern: "DO/{YYYY}/{MM}/{000001}", table: "shipments" },
  PAYMENT: { prefix: "PAY", pattern: "PAY/{YYYY}/{MM}/{000001}", table: "cash_transactions" },
};

export async function generateDocumentNumber(docType: string): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const currentPeriod = `${year}${month}`;

  const def = DEFAULT_PATTERNS[docType];
  const rows = await db.select().from(documentSequences).where(eq(documentSequences.docType, docType)).limit(1);
  const pattern = rows.length ? rows[0].pattern : def?.pattern ?? `${docType}/{YYYY}/{MM}/{000001}`;
  
  // Reset lastNumber only when period is set and different from current month.
  // Null period (legacy rows) means "belum pernah reset", pertahankan lastNumber.
  const periodChanged = rows.length > 0 && rows[0].period != null && rows[0].period !== currentPeriod;
  let lastNumber = rows.length && !periodChanged ? rows[0].lastNumber : 0;

  if (!rows.length) {
    // Seed dari jumlah dokumen existing agar tidak duplikat (first time only)
    if (def?.table) {
      const res = await db.execute<{ cnt: number }>(sql.raw(`SELECT COUNT(*) AS cnt FROM \`${def.table}\``));
      const countRow = (res as unknown as { cnt: number }[][])[0]?.[0] ?? (res as unknown as { cnt: number }[])[0];
      lastNumber = Number((countRow as { cnt?: number })?.cnt ?? 0);
    }
  }

  const next = lastNumber + 1;

  if (rows.length) {
    await db.update(documentSequences).set({ lastNumber: next, period: currentPeriod }).where(eq(documentSequences.id, rows[0].id));
  } else {
    await db.insert(documentSequences).values({
      docType,
      prefix: def?.prefix ?? docType,
      pattern,
      lastNumber: next,
      period: currentPeriod,
    });
  }

  const serial = String(next).padStart(6, "0");
  return pattern
    .replace("{YYYY}", String(year))
    .replace("{MM}", month)
    .replace("{000001}", serial);
}

// Read-only: ambil nomor berikutnya dari DB tanpa menambah/increment.
export async function generateCustomDocumentNumber(docType: string, prefix: string): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const currentPeriod = `${year}${month}`;

  const rows = await db.select().from(documentSequences).where(eq(documentSequences.docType, docType)).limit(1);
  const pattern = rows.length ? rows[0].pattern : `${prefix}/{YYYY}/{MM}/{000001}`;
  
  const periodChanged = rows.length > 0 && rows[0].period != null && rows[0].period !== currentPeriod;
  let lastNumber = rows.length && !periodChanged ? rows[0].lastNumber : 0;

  const next = lastNumber + 1;

  if (rows.length) {
    await db.update(documentSequences).set({ lastNumber: next, period: currentPeriod, prefix }).where(eq(documentSequences.id, rows[0].id));
  } else {
    await db.insert(documentSequences).values({
      docType,
      prefix,
      pattern,
      lastNumber: next,
      period: currentPeriod,
    });
  }

  return buildNumber(prefix, pattern, year, month, next);
}

export async function peekCustomDocumentNumber(docType: string, prefix: string): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const currentPeriod = `${year}${month}`;

  const rows = await db.select().from(documentSequences).where(eq(documentSequences.docType, docType)).limit(1);
  const pattern = rows.length ? rows[0].pattern : `${prefix}/{YYYY}/{MM}/{000001}`;

  let lastNumber = 0;
  if (rows.length) {
    const periodChanged = rows[0].period != null && rows[0].period !== currentPeriod;
    lastNumber = periodChanged ? 0 : rows[0].lastNumber;
  }

  return buildNumber(prefix, pattern, year, month, lastNumber + 1);
}

// Bangun nomor memakai prefix dari pengaturan, sisa format diambil dari pattern.
function buildNumber(prefix: string, pattern: string, year: number, month: string, next: number): string {
  const slashIdx = pattern.indexOf("/");
  const rest = slashIdx >= 0 ? pattern.slice(slashIdx) : "/{YYYY}/{MM}/{000001}";
  const serial = String(next).padStart(6, "0");
  return `${prefix}${rest}`
    .replace("{YYYY}", String(year))
    .replace("{MM}", month)
    .replace("{000001}", serial);
}

