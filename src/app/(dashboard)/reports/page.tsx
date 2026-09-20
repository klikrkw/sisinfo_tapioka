"use client";

import { useQuery } from "@tanstack/react-query";
import { getPurchaseSummary, getSalesSummary } from "@/actions/report-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReportsPage() {
  const router = useRouter();
  const { data: purchases, isLoading: lp } = useQuery({ queryKey: ["rpt-purchases"], queryFn: getPurchaseSummary });
  const { data: sales, isLoading: ls } = useQuery({ queryKey: ["rpt-sales"], queryFn: getSalesSummary });

  const cards = [
    { title: "Laporan Pembelian", desc: "Tanggal, supplier, berat, rifaksi, potongan, total", icon: FileText, href: "/purchasing" },
    { title: "Laporan Penjualan", desc: "Pelanggan, produk, qty, harga, diskon, total", icon: TrendingUp, href: "/sales" },
    { title: "Laporan Stok", desc: "Stok awal, masuk, keluar, saldo", icon: BarChart3, href: "/warehouse/movements" },
    { title: "Laporan HPP", desc: "Batch, input, output, yield, biaya, HPP", icon: BarChart3, href: "/production/hpp" },
    { title: "Laporan Laba Rugi", desc: "Penjualan, HPP, biaya, laba bersih", icon: TrendingDown, href: "/reports/profit-loss" },
    { title: "Laporan Armada", desc: "Perjalanan, KM, solar, sopir, tol, maintenance", icon: FileText, href: "/fleet" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Laporan</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.title} className="cursor-pointer" onClick={() => router.push(c.href)}>
            <CardContent className="flex items-start gap-3 pt-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <c.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ringkasan Pembelian</CardTitle>
            {purchases && <span className="font-mono text-sm font-bold text-accent">Rp {purchases.total.toLocaleString("id-ID")}</span>}
          </CardHeader>
          <CardContent>
            {lp ? <Skeleton className="h-40 w-full" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>No</TableHead><TableHead>Tanggal</TableHead><TableHead className="text-right">Berat</TableHead><TableHead className="text-right">Nilai</TableHead></TableRow></TableHeader>
                <TableBody>
                  {purchases?.rows.slice(0, 8).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.number}</TableCell>
                      <TableCell className="text-sm">{new Date(r.date).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{Number(r.payableWeight).toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right font-mono text-sm">Rp {Number(r.netAmount).toLocaleString("id-ID")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ringkasan Penjualan</CardTitle>
            {sales && <span className="font-mono text-sm font-bold text-accent">Rp {sales.total.toLocaleString("id-ID")}</span>}
          </CardHeader>
          <CardContent>
            {ls ? <Skeleton className="h-40 w-full" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>No</TableHead><TableHead>Tanggal</TableHead><TableHead>Bayar</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {sales?.rows.slice(0, 8).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.number}</TableCell>
                      <TableCell className="text-sm">{new Date(r.date).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell className="text-sm">{r.paymentMethod}</TableCell>
                      <TableCell className="text-right font-mono text-sm">Rp {Number(r.totalAmount).toLocaleString("id-ID")}</TableCell>
                    </TableRow>
                  ))}
                  {sales?.rows.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">Belum ada penjualan.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
