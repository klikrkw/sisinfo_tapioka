"use server";

import { execFile, spawn } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import { createReadStream } from "fs";
import os from "os";
import path from "path";
import mysql from "mysql2/promise";

const execFileAsync = promisify(execFile);

function dbConfig() {
  const url = new URL(process.env.DATABASE_URL!);
  return {
    host: url.hostname,
    port: url.port || "3306",
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
  };
}

function connectionOptions() {
  const cfg = dbConfig();
  return {
    host: cfg.host,
    port: Number(cfg.port),
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
  };
}

/** Pesan error yang aman (tanpa membocorkan password) + petunjuk perbaikan. */
function friendlyError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);

  let cfg: ReturnType<typeof dbConfig> | null = null;
  try {
    cfg = dbConfig();
  } catch {
    // DATABASE_URL tidak valid/tidak ada — tampilkan error apa adanya.
  }

  if (/1044|ER_DBACCESS_DENIED_ERROR|Access denied for user .* to database/i.test(raw)) {
    if (!cfg) return raw;
    return [
      raw,
      "",
      `Hak akses database kurang untuk user '${cfg.user}' pada database '${cfg.database}'.`,
      "Minta admin MySQL menjalankan:",
      `  GRANT ALL PRIVILEGES ON \`${cfg.database}\`.* TO '${cfg.user}'@'localhost';`,
      `  GRANT ALL PRIVILEGES ON \`${cfg.database}\`.* TO '${cfg.user}'@'%';`,
      "  FLUSH PRIVILEGES;",
    ].join("\n");
  }

  if (/1045|ER_ACCESS_DENIED_ERROR/i.test(raw)) {
    if (!cfg) return raw;
    return [
      raw,
      "",
      "User/password database ditolak. Periksa DATABASE_URL di file .env:",
      `  user: ${cfg.user}`,
      `  host: ${cfg.host}:${cfg.port}`,
    ].join("\n");
  }

  if (/ER_PARSE_ERROR|DELIMITER/i.test(raw)) {
    const hint = cfg
      ? `\n\nFile dump berisi perintah khusus (DELIMITER/trigger/procedure). Coba restore lewat terminal:\n  mysql -u ${cfg.user} -p ${cfg.database} < file.sql`
      : "";
    return `${raw}${hint}`;
  }

  return raw;
}

/** Jalankan file .sql lewat CLI mysql (dipakai untuk dump yang memakai DELIMITER). */
async function runMysqlFile(filePath: string) {
  const cfg = dbConfig();
  await new Promise<void>((resolve, reject) => {
    const child = spawn("mysql", ["-h", cfg.host, "-P", cfg.port, "-u", cfg.user, cfg.database], {
      env: { ...process.env, MYSQL_PWD: cfg.password },
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `mysql keluar dengan kode ${code}`));
    });

    const stream = createReadStream(filePath);
    stream.on("error", reject);
    stream.pipe(child.stdin);
  });
}

export async function getDatabaseInfo() {
  const cfg = dbConfig();
  return { host: cfg.host, port: cfg.port, user: cfg.user, database: cfg.database };
}

export async function backupDatabase() {
  const cfg = dbConfig();
  const filename = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.sql`;

  try {
    const { stdout } = await execFileAsync(
      "mysqldump",
      [
        "-h", cfg.host,
        "-P", cfg.port,
        "-u", cfg.user,
        "--single-transaction",
        "--routines",
        "--triggers",
        "--no-tablespaces",
        cfg.database,
      ],
      {
        maxBuffer: 1024 * 1024 * 512,
        env: { ...process.env, MYSQL_PWD: cfg.password },
      }
    );

    return { success: true, filename, data: stdout };
  } catch (error) {
    const message = friendlyError(error);
    console.error("Backup failed:", message);
    return { success: false, error: message };
  }
}

export async function restoreDatabase(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "File backup tidak ditemukan" };
  }
  if (!file.name.endsWith(".sql")) {
    return { success: false, error: "Format file harus .sql" };
  }

  const tmpPath = path.join(os.tmpdir(), `restore-${Date.now()}.sql`);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(tmpPath, buffer);
    const sql = buffer.toString("utf8");

    if (/\bDELIMITER\b/.test(sql)) {
      // Dump dengan trigger/procedure butuh CLI karena DELIMITER hanya dikenal client.
      await runMysqlFile(tmpPath);
    } else {
      // Jalur utama: pakai koneksi aplikasi (DATABASE_URL), bukan CLI terpisah.
      const conn = await mysql.createConnection({ ...connectionOptions(), multipleStatements: true });
      try {
        await conn.query("SET FOREIGN_KEY_CHECKS = 0");
        await conn.query(sql);
      } finally {
        await conn.query("SET FOREIGN_KEY_CHECKS = 1").catch(() => {});
        await conn.end();
      }
    }

    return { success: true };
  } catch (error) {
    const message = friendlyError(error);
    console.error("Restore failed:", message);
    return { success: false, error: message };
  } finally {
    await fs.rm(tmpPath, { force: true }).catch(() => {});
  }
}

export async function resetDatabase() {
  try {
    const conn = await mysql.createConnection(connectionOptions());
    try {
      const [rows] = await conn.query("SHOW TABLES");
      const keep = new Set(["document_sequences", "company_settings", "users"]);
      const tables = (rows as Record<string, string>[])
        .map((row) => Object.values(row)[0])
        .filter((name): name is string => typeof name === "string" && !keep.has(name));

      await conn.query("SET FOREIGN_KEY_CHECKS = 0");
      try {
        for (const table of tables) {
          await conn.query(`TRUNCATE TABLE \`${table.replace(/`/g, "``")}\``);
        }
      } finally {
        await conn.query("SET FOREIGN_KEY_CHECKS = 1");
      }
    } finally {
      await conn.end();
    }

    return { success: true };
  } catch (error) {
    const message = friendlyError(error);
    console.error("Reset failed:", message);
    return { success: false, error: message };
  }
}
