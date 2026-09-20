"use client";

import { useQuery } from "@tanstack/react-query";
import { getStockBalances, getStockMovements } from "@/actions/warehouse-actions";
import { getWarehouses } from "@/actions/master-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Warehouse as WarehouseIcon, Package } from "lucide-react";
import { useState } from "react";

const movementLabel: Record<string, string> = {
  PURCHASE: "Pembelian",
  PRODUCTION_USAGE: "Pemakaian Produksi",
  PRODUCTION_OUTPUT: "Hasil Produksi",
  SALE: "Penjualan",
  RETURN: "Retur",
  ADJUSTMENT: "Penyesuaian",
  TRANSFER: "Transfer",
};

const movementTone: Record<string, string> = {
  PURCHASE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  PRODUCTION_OUTPUT: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  PRODUCTION_USAGE: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  SALE: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
};

export default function WarehousePage() {
  const [warehouseId, setWarehouseId] = useState<string>("all");
  const filterId = warehouseId === "all" ? undefined : Number(warehouseId);

  const { data: warehouses } = useQuery({ queryKey: ["warehouses"], queryFn: getWarehouses });
  const { data: balances, isLoading: loadBalances } = useQuery({
    queryKey: ["stock-balances", warehouseId],
    queryFn: () => getStockBalances(filterId),
  });
  const { data: movements, isLoading: loadMovements } = useQuery({
    queryKey: ["stock-movements", warehouseId],
    queryFn: () => getStockMovements(filterId),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gudang & Stock Ledger</h2>
          <p className="text-sm text-muted-foreground">Saldo stok terkini dan riwayat pergerakan per gudang.</p>
        </div>
        <div className="w-full sm:w-64">
          <Select value={warehouseId} onValueChange={(value) => setWarehouseId(value ?? "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Gudang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Gudang</SelectItem>
              {warehouses?.map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4 text-accent" /> Saldo Stok
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadBalances ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : balances && balances.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gudang</TableHead>
                  <TableHead>Produk / Bahan</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Update Terakhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.map((b, i) => (
                  <TableRow key={`${b.warehouseId}-${b.productId}-${i}`}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
                        {b.warehouseName}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{b.productName}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {Number(b.balance || 0).toLocaleString("id-ID")} {b.productUnit}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {b.lastMovement ? new Date(b.lastMovement).toLocaleDateString("id-ID") : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data stok.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Ledger (50 transaksi terakhir)</CardTitle>
        </CardHeader>
        <CardContent>
          {loadMovements ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : movements && movements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Gudang</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead className="text-right">Masuk</TableHead>
                  <TableHead className="text-right">Keluar</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm">{m.date ? new Date(m.date).toLocaleDateString("id-ID") : "-"}</TableCell>
                    <TableCell className="text-sm">{m.warehouseName}</TableCell>
                    <TableCell>{m.productName}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${movementTone[m.type] ?? "bg-muted text-muted-foreground"}`}>
                        {movementLabel[m.type] ?? m.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {Number(m.qtyIn) > 0 ? Number(m.qtyIn).toLocaleString("id-ID") : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-600 dark:text-red-400">
                      {Number(m.qtyOut) > 0 ? Number(m.qtyOut).toLocaleString("id-ID") : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {Number(m.balance).toLocaleString("id-ID")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada pergerakan stok.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
