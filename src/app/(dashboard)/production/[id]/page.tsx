"use client";

import { useQuery } from "@tanstack/react-query";
import { getBatchById } from "@/actions/production-actions";
import { getProducts, getWarehouses } from "@/actions/master-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateHpp } from "@/lib/calculations/production";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const batchId = Number(id);

  const { data: batch, isLoading } = useQuery({ queryKey: ["batch", batchId], queryFn: () => getBatchById(batchId) });
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const { data: warehouses } = useQuery({ queryKey: ["warehouses"], queryFn: getWarehouses });

  const productName = (pid: number) => products?.find((p) => p.id === pid)?.name ?? `#${pid}`;
  const warehouseName = (wid: number) => warehouses?.find((w) => w.id === wid)?.name ?? `#${wid}`;

  if (isLoading) return <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;
  if (!batch) return <div className="p-8 text-center text-muted-foreground">Batch tidak ditemukan.</div>;

  const totalCost = batch.costs.reduce((a, c) => a + Number(c.amount), 0);
  const byProductValue = batch.outputs
    .filter((o) => o.isByProduct)
    .reduce((a, o) => a + Number(o.quantity) * Number(o.pricePerUnit), 0);
  const flourQty = batch.outputs.filter((o) => !o.isByProduct).reduce((a, o) => a + Number(o.quantity), 0);
  const hpp = calculateHpp(totalCost, byProductValue, flourQty);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Batch {batch.number}</h2>
          <p className="text-sm text-muted-foreground">{new Date(batch.date).toLocaleDateString("id-ID")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{batch.status}</Badge>
          <Button variant="outline" size="sm" onClick={() => router.push("/production")}>Kembali</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-2"><p className="text-xs text-muted-foreground">Total Biaya</p><p className="font-mono text-lg font-bold">Rp {totalCost.toLocaleString("id-ID")}</p></CardContent></Card>
        <Card><CardContent className="pt-2"><p className="text-xs text-muted-foreground">Nilai Ampas</p><p className="font-mono text-lg font-bold">Rp {byProductValue.toLocaleString("id-ID")}</p></CardContent></Card>
        <Card><CardContent className="pt-2"><p className="text-xs text-muted-foreground">Qty Tepung</p><p className="font-mono text-lg font-bold">{flourQty.toLocaleString("id-ID")} Kg</p></CardContent></Card>
        <Card><CardContent className="pt-2"><p className="text-xs text-muted-foreground">HPP Tepung/Kg</p><p className="font-mono text-lg font-bold text-accent">Rp {Math.round(hpp.hppPerKg).toLocaleString("id-ID")}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Input</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Bahan</TableHead><TableHead>Gudang</TableHead><TableHead className="text-right">Qty</TableHead></TableRow></TableHeader>
              <TableBody>
                {batch.inputs.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{productName(i.productId)}</TableCell>
                    <TableCell>{warehouseName(i.warehouseId)}</TableCell>
                    <TableCell className="text-right font-mono">{Number(i.quantity).toLocaleString("id-ID")} Kg</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Output</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Produk</TableHead><TableHead>Gudang</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Nilai</TableHead></TableRow></TableHeader>
              <TableBody>
                {batch.outputs.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      {productName(o.productId)} {o.isByProduct && <Badge variant="secondary" className="ml-1">Sampingan</Badge>}
                    </TableCell>
                    <TableCell>{warehouseName(o.warehouseId)}</TableCell>
                    <TableCell className="text-right font-mono">{Number(o.quantity).toLocaleString("id-ID")} Kg</TableCell>
                    <TableCell className="text-right font-mono">Rp {(Number(o.quantity) * Number(o.pricePerUnit)).toLocaleString("id-ID")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Biaya Produksi</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Kategori</TableHead><TableHead>Nama</TableHead><TableHead>Tipe</TableHead><TableHead className="text-right">Jumlah</TableHead></TableRow></TableHeader>
            <TableBody>
              {batch.costs.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><Badge variant="outline">{c.category}</Badge></TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell className="text-sm capitalize">{c.costType}</TableCell>
                  <TableCell className="text-right font-mono">Rp {Number(c.amount).toLocaleString("id-ID")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
