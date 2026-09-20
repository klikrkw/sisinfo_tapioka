"use client";

import { useQuery } from "@tanstack/react-query";
import { getStockMovements } from "@/actions/warehouse-actions";
import { getWarehouses } from "@/actions/master-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function MovementsPage() {
  const [warehouseId, setWarehouseId] = useState<string>("all");
  const filterId = warehouseId === "all" ? undefined : Number(warehouseId);

  const { data: warehouses } = useQuery({ queryKey: ["warehouses"], queryFn: getWarehouses });
  const { data: movements, isLoading } = useQuery({
    queryKey: ["stock-movements-full", warehouseId],
    queryFn: () => getStockMovements(filterId),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Stock Ledger</CardTitle>
        <div className="w-64">
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
      </CardHeader>
      <CardContent>
        {isLoading ? (
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
                  <TableCell className="text-sm">{m.date ? new Date(m.date).toLocaleString("id-ID") : "-"}</TableCell>
                  <TableCell className="text-sm">{m.warehouseName}</TableCell>
                  <TableCell>{m.productName}</TableCell>
                  <TableCell className="text-sm">{movementLabel[m.type] ?? m.type}</TableCell>
                  <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400">
                    {Number(m.qtyIn) > 0 ? Number(m.qtyIn).toLocaleString("id-ID") : "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-red-600 dark:text-red-400">
                    {Number(m.qtyOut) > 0 ? Number(m.qtyOut).toLocaleString("id-ID") : "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">{Number(m.balance).toLocaleString("id-ID")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada pergerakan stok.</p>
        )}
      </CardContent>
    </Card>
  );
}
