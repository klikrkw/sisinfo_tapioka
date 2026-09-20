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

  const def = DEFAULT_PATTERNS[docType];
  const rows = await db.select().from(documentSequences).where(eq(documentSequences.docType, docType)).limit(1);
  const pattern = rows.length ? rows[0].pattern : def?.pattern ?? `${docType}/{YYYY}/{MM}/{000001}`;

  let lastNumber = rows.length ? rows[0].lastNumber : 0;

  if (!rows.length) {
    // Seed dari jumlah dokumen existing agar tidak duplikat
    if (def?.table) {
      const res = await db.execute<{ cnt: number }>(sql.raw(`SELECT COUNT(*) AS cnt FROM \`${def.table}\``));
      const countRow = (res as unknown as { cnt: number }[][])[0]?.[0] ?? (res as unknown as { cnt: number }[])[0];
      lastNumber = Number((countRow as { cnt?: number })?.cnt ?? 0);
    }
  }

  const next = lastNumber + 1;

  if (rows.length) {
    await db.update(documentSequences).set({ lastNumber: next }).where(eq(documentSequences.id, rows[0].id));
  } else {
    await db.insert(documentSequences).values({
      docType,
      prefix: def?.prefix ?? docType,
      pattern,
      lastNumber: next,
    });
  }

  const serial = String(next).padStart(6, "0");
  return pattern
    .replace("{YYYY}", String(year))
    .replace("{MM}", month)
    .replace("{000001}", serial);
}

