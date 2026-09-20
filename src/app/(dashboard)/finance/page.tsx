"use client";

import { useQuery } from "@tanstack/react-query";
import { getCashTransactionsPaginated } from "@/actions/finance-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FinancePage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["cash-transactions"],
    queryFn: () => getCashTransactionsPaginated(1, 100),
  });

  const balance = (data?.totalIn ?? 0) - (data?.totalOut ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Kas & Bank</h2>
        <Button onClick={() => router.push("/finance/add")}>
          <Plus className="mr-2 h-4 w-4" /> Catat Transaksi
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs text-muted-foreground">Kas Masuk</p>
              <p className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">Rp {(data?.totalIn ?? 0).toLocaleString("id-ID")}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><TrendingUp className="h-5 w-5" /></span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs text-muted-foreground">Kas Keluar</p>
              <p className="font-mono text-lg font-bold text-red-600 dark:text-red-400">Rp {(data?.totalOut ?? 0).toLocaleString("id-ID")}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400"><TrendingDown className="h-5 w-5" /></span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs text-muted-foreground">Saldo Kas</p>
              <p className="font-mono text-lg font-bold text-accent">Rp {balance.toLocaleString("id-ID")}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><Wallet className="h-5 w-5" /></span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Riwayat Transaksi Kas</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : data?.data.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{new Date(t.date).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell>
                      <Badge variant={t.type === "IN" ? "default" : "destructive"}>{t.type === "IN" ? "Masuk" : "Keluar"}</Badge>
                    </TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${t.type === "IN" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {t.type === "IN" ? "+" : "-"} Rp {Number(t.amount).toLocaleString("id-ID")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada transaksi kas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
