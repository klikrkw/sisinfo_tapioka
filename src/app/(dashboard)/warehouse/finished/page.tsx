"use client";

import { useQuery } from "@tanstack/react-query";
import { getStockBalances } from "@/actions/warehouse-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Warehouse } from "lucide-react";

export default function FinishedGoodsPage() {
  const { data: balances, isLoading } = useQuery({
    queryKey: ["finished-goods-stock"],
    queryFn: () => getStockBalances(),
  });

  const finishedGoods = balances?.filter((b) => b.productUnit === "Kg" && !b.productName?.toLowerCase().includes("ketela"));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stok Produk Jadi & Sampingan (Tepung & Ampas)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : finishedGoods && finishedGoods.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gudang</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead className="text-right">Saldo Stok</TableHead>
                <TableHead>Update Terakhir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finishedGoods.map((b, i) => (
                <TableRow key={`${b.warehouseId}-${b.productId}-${i}`}>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4 text-muted-foreground" />
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
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada produk jadi di gudang (jalankan produksi terlebih dahulu).</p>
        )}
      </CardContent>
    </Card>
  );
}
