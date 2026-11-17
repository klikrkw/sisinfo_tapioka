"use client";

import { useQuery } from "@tanstack/react-query";
import { getSalesByBrand } from "@/actions/brand-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from "lucide-react";

const rp = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

export default function BrandSalesReportPage() {
  const { data, isLoading } = useQuery({ queryKey: ["sales-by-brand"], queryFn: getSalesByBrand });

  const totals = (data ?? []).reduce(
    (a, r) => ({
      quantity: a.quantity + r.quantity,
      weight: a.weight + r.weight,
      revenue: a.revenue + r.revenue,
      hpp: a.hpp + r.hpp,
      margin: a.margin + r.margin,
    }),
    { quantity: 0, weight: 0, revenue: 0, hpp: 0, margin: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-2">
          <p className="text-xs text-muted-foreground">Total Qty Terjual</p>
          <p className="font-mono text-lg font-bold">{totals.quantity.toLocaleString("id-ID")}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-2">
          <p className="text-xs text-muted-foreground">Omzet</p>
          <p className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">{rp(totals.revenue)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-2">
          <p className="text-xs text-muted-foreground">HPP</p>
          <p className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400">{rp(totals.hpp)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-2">
          <p className="text-xs text-muted-foreground">Margin</p>
          <p className={`font-mono text-lg font-bold ${totals.margin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {rp(totals.margin)}
          </p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" /> Laporan Penjualan per Merek
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (data ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada penjualan. Merek diisi pada form Penjualan → Tambah.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merek</TableHead>
                  <TableHead className="text-right">Transaksi</TableHead>
                  <TableHead className="text-right">Qty Terjual</TableHead>
                  <TableHead className="text-right">Berat (Kg)</TableHead>
                  <TableHead className="text-right">Omzet</TableHead>
                  <TableHead className="text-right">HPP</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-right">Margin %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((r) => (
                  <TableRow key={r.brandName}>
                    <TableCell className="font-medium">{r.brandName}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{r.transactions.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{r.quantity.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{r.weight.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{rp(r.revenue)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-amber-600 dark:text-amber-400">{rp(r.hpp)}</TableCell>
                    <TableCell className={`text-right font-mono text-sm font-semibold ${r.margin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {rp(r.margin)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {r.revenue > 0 ? `${((r.margin / r.revenue) * 100).toFixed(1)}%` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell />
                  <TableCell className="text-right font-mono font-bold">{totals.quantity.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{totals.weight.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{rp(totals.revenue)}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-amber-600 dark:text-amber-400">{rp(totals.hpp)}</TableCell>
                  <TableCell className={`text-right font-mono font-bold ${totals.margin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {rp(totals.margin)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {totals.revenue > 0 ? `${((totals.margin / totals.revenue) * 100).toFixed(1)}%` : "-"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            HPP memakai snapshot FIFO/harga beli yang tersimpan pada item penjualan saat transaksi dibuat.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
