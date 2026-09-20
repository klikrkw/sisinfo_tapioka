"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database, Download, Upload, AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { backupDatabase, restoreDatabase, resetDatabase } from "@/actions/backup-actions";

export default function BackupPage() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await backupDatabase();
      if (res.success && res.data) {
        const blob = new Blob([res.data], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(`Backup berhasil dibuat: ${res.filename}`);
      } else {
        toast.error(`Gagal membuat backup: ${res.error}`);
      }
    } catch {
      toast.error("Terjadi kesalahan saat memproses backup");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile) {
      toast.error("Pilih file backup (.sql) terlebih dahulu");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin melakukan restore data? Tindakan ini akan menimpa seluruh data saat ini!")) {
      return;
    }

    setIsRestoring(true);
    try {
      const formData = new FormData();
      formData.append("file", restoreFile);
      
      const res = await restoreDatabase(formData);
      if (res.success) {
        toast.success("Restore data berhasil diselesaikan. Sistem akan dimuat ulang.");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.error(`Gagal melakukan restore: ${res.error}`);
      }
    } catch {
      toast.error("Terjadi kesalahan saat memproses restore");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Apakah Anda yakin ingin RESET DATA? Seluruh data transaksi akan dihapus permanen! Data profil perusahaan, penomoran, dan user akan tetap ada.")) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await resetDatabase();
      if (res.success) {
        toast.success("Reset data berhasil. Seluruh transaksi telah dihapus.");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.error(`Gagal reset data: ${res.error}`);
      }
    } catch {
      toast.error("Terjadi kesalahan saat memproses reset");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Backup & Restore Data</h2>
        <p className="text-sm text-muted-foreground">
          Kelola cadangan data sistem dan lakukan pemulihan data database bila diperlukan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Backup Data
            </CardTitle>
            <CardDescription>
              Unduh cadangan database MySQL dalam bentuk file SQL dump.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Perhatian
              </p>
              <p className="mt-1">
                Proses backup mungkin memerlukan beberapa waktu tergantung pada ukuran data sistem Anda.
              </p>
            </div>
            <Button onClick={handleBackup} disabled={isBackingUp} className="w-full">
              {isBackingUp ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Memproses Backup...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Buat Backup Sekarang
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Restore Data
            </CardTitle>
            <CardDescription>
              Pulihkan database menggunakan file cadangan (.sql).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRestore} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backup-file">Pilih File SQL</Label>
                <Input
                  id="backup-file"
                  type="file"
                  accept=".sql"
                  onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                  disabled={isRestoring}
                />
              </div>

              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Peringatan Kritis
                </p>
                <p className="mt-1">
                  Proses restore akan menimpa seluruh data yang ada saat ini dengan data dari file backup!
                </p>
              </div>

              <Button
                type="submit"
                variant="destructive"
                disabled={isRestoring || !restoreFile}
                className="w-full"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Memproses Restore...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Mulai Restore Data
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Reset Card */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Reset Data Transaksi
            </CardTitle>
            <CardDescription>
              Hapus seluruh data transaksi (pembelian, penjualan, produksi, dll) dan mulai dari awal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Peringatan
              </p>
              <p className="mt-1">
                Tindakan ini tidak dapat dibatalkan. Hanya data master tertentu dan pengaturan sistem yang akan dipertahankan.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isResetting}
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Memproses Reset...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset Seluruh Transaksi
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
