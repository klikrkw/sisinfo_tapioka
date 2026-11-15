"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStockLayers } from "@/actions/warehouse-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers } from "lucide-react";

const sourceLabel: Record<string, string> = {
  PURCHASE: "Pembelian",
  PRODUCTION: "Produksi",
  ADJUSTMENT: "Penyesuaian",
  OPENING: "Saldo awal",
};

const sourceVariant: Record<string, string> = {
  PURCHASE: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  PRODUCTION: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  ADJUSTMENT: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  OPENING: "bg-muted text-muted-foreground",
};

type Layer = {
  id: number;
  date: Date | string;
  sourceType: string;
  sourceNumber: string | null;
  productName: string | null;
  productUnit: string | null;
  warehouseName: string | null;
  qtyIn: string;
  qtyRemaining: string;
  unitCost: string;
};

export default function StockLayersPage() {
  const [showEmpty, setShowEmpty] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["stock-layers", showEmpty],
    queryFn: () => getStockLayers(!showEmpty),
  });

  const layers = useMemo(() => (data ?? []) as Layer[], [data]);
  const totals = useMemo(() => {
    const qty = layers.reduce((a, l) => a + Number(l.qtyRemaining || 0), 0);
    const value = layers.reduce((a, l) => a + Number(l.qtyRemaining || 0) * Number(l.unitCost || 0), 0);
    return { qty, value };
  }, [layers]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-2">
            <p className="text-xs text-muted-foreground">Layer aktif</p>
            <p className="font-mono text-lg font-bold">{layers.length.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2">
            <p className="text-xs text-muted-foreground">Sisa qty</p>
            <p className="font-mono text-lg font-bold">{totals.qty.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2">
            <p className="text-xs text-muted-foreground">Nilai persediaan (FIFO)</p>
            <p className="font-mono text-lg font-bold text-accent">Rp {Math.round(totals.value).toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" /> Layer HPP (FIFO)
          </CardTitle>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={showEmpty} onChange={(e) => setShowEmpty(e.target.checked)} />
            Tampilkan layer yang sudah habis
          </label>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : layers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada layer. Jalankan <span className="font-mono">npm run db:backfill-layers</span> untuk membangun dari riwayat stok.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Gudang</TableHead>
                    <TableHead>Sumber</TableHead>
                    <TableHead className="text-right">Masuk</TableHead>
                    <TableHead className="text-right">Sisa</TableHead>
                    <TableHead className="text-right">HPP / Unit</TableHead>
                    <TableHead className="text-right">Nilai Sisa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {layers.map((l) => {
                    const remaining = Number(l.qtyRemaining || 0);
                    return (
                      <TableRow key={l.id} className={remaining <= 0 ? "opacity-50" : ""}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {new Date(l.date).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell className="font-medium">{l.productName ?? "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{l.warehouseName ?? "-"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-medium ${sourceVariant[l.sourceType] ?? sourceVariant.OPENING}`}>
                              {sourceLabel[l.sourceType] ?? l.sourceType}
                            </span>
                            {l.sourceNumber && <span className="font-mono text-[11px] text-muted-foreground">{l.sourceNumber}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{Number(l.qtyIn).toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">{remaining.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-right font-mono text-sm">Rp {Math.round(Number(l.unitCost)).toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">
                          Rp {Math.round(remaining * Number(l.unitCost)).toLocaleString("id-ID")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            Penjualan dan pemakaian produksi mengambil layer paling lama lebih dulu. HPP yang terpakai disimpan
            sebagai snapshot pada item penjualan sehingga margin historis tidak berubah.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
