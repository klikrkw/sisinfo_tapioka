"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProfitLoss } from "@/actions/report-actions";
import { getProducts } from "@/actions/master-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

const ALL_PRODUCTS = "all";

function Row({ label, value, tone, bold }: { label: string; value: number; tone?: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 ${bold ? "font-semibold" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span className={`font-mono ${tone ?? ""}`}>Rp {value.toLocaleString("id-ID")}</span>
    </div>
  );
}

export default function ProfitLossPage() {
  const [productId, setProductId] = useState<string>(ALL_PRODUCTS);

  const { data: products } = useQuery({ queryKey: ["products"], queryFn: getProducts });

  const { data, isLoading } = useQuery({
    queryKey: ["profit-loss", productId],
    queryFn: () => getProfitLoss(productId === ALL_PRODUCTS ? undefined : Number(productId)),
  });

  if (isLoading) return <div className="space-y-4 max-w-3xl">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 w-full" />)}</div>;

  const d = data!;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight">Laporan Laba / Rugi</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Produk:</span>
          <Select value={productId} onValueChange={(val) => { if (val) setProductId(val); }}>
            <SelectTrigger className="w-56">
              <SelectValue>
                {productId === ALL_PRODUCTS ? "Semua Produk" : products?.find(p => String(p.id) === productId)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PRODUCTS}>Semua Produk</SelectItem>
              {products?.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center justify-between pt-2">
          <div><p className="text-xs text-muted-foreground">Total Penjualan</p><p className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">Rp {d.totalSales.toLocaleString("id-ID")}</p></div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><TrendingUp className="h-5 w-5" /></span>
        </CardContent></Card>
        <Card><CardContent className="flex items-center justify-between pt-2">
          <div><p className="text-xs text-muted-foreground">HPP Tepung/Kg</p><p className="font-mono text-lg font-bold text-accent">Rp {Math.round(d.hppPerKg).toLocaleString("id-ID")}</p></div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><Wallet className="h-5 w-5" /></span>
        </CardContent></Card>
        <Card><CardContent className="flex items-center justify-between pt-2">
          <div><p className="text-xs text-muted-foreground">Laba / Rugi Bersih</p>
            <p className={`font-mono text-lg font-bold ${d.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              Rp {d.netProfit.toLocaleString("id-ID")}
            </p></div>
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${d.netProfit >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}><TrendingDown className="h-5 w-5" /></span>
        </CardContent></Card>
      </div>

      <Card className="max-w-3xl">
        <CardHeader><CardTitle>Rincian Laba / Rugi</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          <Row label={`Penjualan (${d.salesCount} transaksi)`} value={d.totalSales} tone="text-emerald-600 dark:text-emerald-400" bold />
          <Separator className="my-2" />
          <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Harga Pokok Produksi</p>
          <Row label="Total Biaya Produksi" value={d.totalProdCost} />
          <Row label="Dikurangi Nilai Ampas (by-product)" value={-d.byProductValue} tone="text-emerald-600 dark:text-emerald-400" />
          <Row label="Cost Tepung (Net)" value={d.netProdCost} bold />
          <Separator className="my-2" />
          <Row label="Laba Kotor" value={d.grossProfit} bold tone="text-emerald-600 dark:text-emerald-400" />
          <Separator className="my-2" />
          <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Biaya Operasional & Distribusi</p>
          <Row label="Biaya Pengiriman & Solar" value={d.totalDistribution} />
          <Row label="Biaya Operasional Umum" value={d.totalExpenses} />
          <Row label="Total Biaya Operasional" value={d.totalOperating} bold />
          <Separator className="my-2" />
          <div className="flex items-center justify-between py-3">
            <span className="text-lg font-bold">Laba / Rugi Bersih</span>
            <span className={`font-mono text-xl font-bold ${d.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              Rp {d.netProfit.toLocaleString("id-ID")}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
