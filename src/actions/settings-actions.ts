"use server";

import { db } from "@/db";
import { companySettings, documentSequences, auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCompanySettings() {
  const rows = await db.select().from(companySettings).limit(1);
  return rows[0] || null;
}

export async function saveCompanySettings(data: typeof companySettings.$inferInsert) {
  const existing = await db.select().from(companySettings).limit(1);
  if (existing.length === 0) {
    await db.insert(companySettings).values(data);
  } else {
    // Only update fields provided, filter undefined
    const updateData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    await db.update(companySettings).set(updateData).where(eq(companySettings.id, existing[0].id));
  }
  revalidatePath("/settings/company");
}

export async function getDocumentSequences() {
  return await db.select().from(documentSequences);
}

export async function saveDocumentSequence(data: typeof documentSequences.$inferInsert) {
  const existing = await db.select().from(documentSequences).where(eq(documentSequences.docType, data.docType)).limit(1);
  if (existing.length === 0) {
    await db.insert(documentSequences).values(data);
  } else {
    await db.update(documentSequences).set(data).where(eq(documentSequences.id, existing[0].id));
  }
  revalidatePath("/settings/numbering");
}

export async function getAuditLogs(page: number, limit: number) {
  const offset = (page - 1) * limit;
  const data = await db.select().from(auditLogs).orderBy(desc(auditLogs.id)).limit(limit).offset(offset);
  const all = await db.select().from(auditLogs);
  return { data, total: all.length };
}

export async function writeAuditLog(data: {
  username?: string;
  module: string;
  action: string;
  recordId?: number;
  oldData?: string;
  newData?: string;
}) {
  await db.insert(auditLogs).values({
    username: data.username,
    module: data.module,
    action: data.action,
    recordId: data.recordId,
    oldData: data.oldData,
    newData: data.newData,
  });
}
