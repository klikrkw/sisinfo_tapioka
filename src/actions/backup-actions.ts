"use server";

import { execFile, exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import os from "os";
import path from "path";

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

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
        `-p${cfg.password}`,
        "--single-transaction",
        "--routines",
        "--triggers",
        cfg.database,
      ],
      { maxBuffer: 1024 * 1024 * 512 }
    );

    return { success: true, filename, data: stdout };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backup gagal";
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

  const cfg = dbConfig();
  const tmpPath = path.join(os.tmpdir(), `restore-${Date.now()}.sql`);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(tmpPath, buffer);

    const command = `mysql -h ${cfg.host} -P ${cfg.port} -u ${cfg.user} -p'${cfg.password}' ${cfg.database} < ${tmpPath}`;
    await execAsync(command);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Restore gagal";
    console.error("Restore failed:", message);
    return { success: false, error: message };
  } finally {
    await fs.rm(tmpPath, { force: true }).catch(() => {});
  }
}

export async function resetDatabase() {
  const cfg = dbConfig();
  
  try {
    // Get all tables
    const commandShow = `mysql -h ${cfg.host} -P ${cfg.port} -u ${cfg.user} -p'${cfg.password}' -e "SHOW TABLES" ${cfg.database} -s --skip-column-names`;
    const { stdout } = await execAsync(commandShow);
    const tables = stdout.split("\n").filter(t => t.trim() !== "" && t !== "document_sequences" && t !== "company_settings" && t !== "users");

    if (tables.length > 0) {
      const dropCmd = `mysql -h ${cfg.host} -P ${cfg.port} -u ${cfg.user} -p'${cfg.password}' -e "SET FOREIGN_KEY_CHECKS = 0; ${tables.map(t => `TRUNCATE TABLE ${t}`).join("; ")}; SET FOREIGN_KEY_CHECKS = 1;" ${cfg.database}`;
      await execAsync(dropCmd);
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reset gagal";
    console.error("Reset failed:", message);
    return { success: false, error: message };
  }
}
