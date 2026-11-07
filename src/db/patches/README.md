# Patch SQL Produksi

Folder ini menyimpan perubahan struktur database untuk **produksi**, menggantikan `drizzle-kit push`.

## Aturan

1. Satu file = satu perubahan logis.
2. Nama file: `YYYY-MM-DD_NNN_deskripsi.sql`, contoh `2026-11-08_002_add_sales_note.sql`.
3. Tambahkan komentar di bagian atas: tujuan, dampak, dan cara rollback.
4. File rollback memakai akhiran `.down.sql` dan **tidak** dijalankan otomatis.
5. Jangan memakai `DROP`/`TRUNCATE` tanpa persetujuan dan backup.
6. Patch yang sudah diterapkan dicatat di tabel `schema_patches`.

## Menjalankan

```bash
cd /var/www/html/web/projects/sisinfo_tapioka
set -a; source .env; set +a

# lihat patch yang belum diterapkan
node scripts/apply-patches.mjs --dry-run

# terapkan
node scripts/apply-patches.mjs

# verifikasi
mysql -u webuser -p db_tapioka -e "SELECT * FROM schema_patches ORDER BY applied_at;"
```

## Runbook deploy produksi

```bash
# 1. Backup
mysqldump --single-transaction --routines --triggers \
  -u webuser -p db_tapioka > /tmp/opencode/db_$(date +%F_%H%M).sql

# 2. Cek lalu terapkan patch
node scripts/apply-patches.mjs --dry-run
node scripts/apply-patches.mjs

# 3. Build & restart aplikasi
npm run build && pm2 restart sisinfo_tapioka

# 4. Verifikasi
mysql -u webuser -p db_tapioka -e "SELECT * FROM schema_patches ORDER BY applied_at;"
```

## Rollback

- Patch gagal: perbaiki penyebabnya lalu jalankan ulang; patch yang gagal tidak dicatat.
- Perlu membatalkan perubahan: jalankan file `.down.sql` terkait secara manual, lalu hapus barisnya dari `schema_patches`.
- Darurat: restore backup `mysqldump` terakhir.

Catatan: DDL MySQL auto-commit, jadi backup adalah jaring pengaman utama.
