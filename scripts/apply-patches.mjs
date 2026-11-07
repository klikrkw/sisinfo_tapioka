#!/usr/bin/env node
/**
 * Menerapkan patch SQL di src/db/patches secara berurutan.
 *
 * Penggunaan:
 *   node scripts/apply-patches.mjs --dry-run   # lihat patch yang akan dijalankan
 *   node scripts/apply-patches.mjs             # terapkan patch
 *
 * Patch yang sudah tercatat di tabel `schema_patches` akan dilewati.
 * File `*.down.sql` tidak dijalankan otomatis (hanya untuk rollback manual).
 */
import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const patchesDir = path.resolve(__dirname, "../src/db/patches");
const dryRun = process.argv.includes("--dry-run");

function connectionOptions() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL belum diset. Jalankan: set -a; source .env; set +a");
  }
  const url = new URL(process.env.DATABASE_URL);
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    multipleStatements: true,
  };
}

async function main() {
  const files = (await readdir(patchesDir))
    .filter((f) => f.endsWith(".sql") && !f.endsWith(".down.sql"))
    .sort();

  const conn = await mysql.createConnection(connectionOptions());
  try {
    let applied = new Set();
    try {
      const [rows] = await conn.query("SELECT name FROM schema_patches");
      applied = new Set(rows.map((r) => r.name));
    } catch (e) {
      if (e.code !== "ER_NO_SUCH_TABLE") throw e;
      if (dryRun) {
        console.log("Tabel schema_patches belum ada (akan dibuat saat apply).");
      } else {
        await conn.query(`
          CREATE TABLE IF NOT EXISTS schema_patches (
            name VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }
    }

    if (files.length === 0) {
      console.log("Tidak ada file patch di", patchesDir);
      return;
    }

    console.log(dryRun ? "Mode DRY-RUN (tidak ada perubahan)" : "Menerapkan patch...");
    let pending = 0;

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`  skip    ${file} (sudah diterapkan)`);
        continue;
      }

      pending += 1;
      if (dryRun) {
        console.log(`  pending ${file}`);
        continue;
      }

      const sql = await readFile(path.join(patchesDir, file), "utf8");
      try {
        await conn.query(sql);
        await conn.query("INSERT INTO schema_patches (name) VALUES (?)", [file]);
        console.log(`  ok      ${file}`);
      } catch (e) {
        console.error(`  FAILED  ${file}`);
        console.error(`          ${e instanceof Error ? e.message : e}`);
        throw e;
      }
    }

    if (pending === 0) console.log("Semua patch sudah diterapkan.");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
