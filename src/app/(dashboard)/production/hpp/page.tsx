"use client";

import { useQuery } from "@tanstack/react-query";
import { getProductionBatchesPaginated, getBatchById } from "@/actions/production-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { calculateHpp } from "@/lib/calculations/production";
import { useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";

export default function HppPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["hpp-batches"],
    queryFn: () => getProductionBatchesPaginated(1, 100),
  });

  const batchQueries = useQueries({
    queries: (data?.data ?? []).map((b) => ({
      queryKey: ["batch-hpp", b.id],
      queryFn: () => getBatchById(b.id),
    })),
  });

  const loadingDetails = batchQueries.some((q) => q.isLoading);

  return (
    <Card>
      <CardHeader>
        <CardTitle>HPP Tepung per Batch</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || loadingDetails ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Batch</TableHead>
                <TableHead className="text-right">Total Biaya</TableHead>
                <TableHead className="text-right">Nilai Ampas</TableHead>
                <TableHead className="text-right">Qty Tepung</TableHead>
                <TableHead className="text-right">HPP / Kg</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batchQueries.map((q) => {
                const b = q.data;
                if (!b) return null;
                const totalCost = b.costs.reduce((a, c) => a + Number(c.amount), 0);
                const byValue = b.outputs.filter((o) => o.isByProduct).reduce((a, o) => a + Number(o.quantity) * Number(o.pricePerUnit), 0);
                const flourQty = b.outputs.filter((o) => !o.isByProduct).reduce((a, o) => a + Number(o.quantity), 0);
                const hpp = calculateHpp(totalCost, byValue, flourQty);
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono font-medium">{b.number}</TableCell>
                    <TableCell className="text-right font-mono">Rp {totalCost.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right font-mono">Rp {byValue.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right font-mono">{flourQty.toLocaleString("id-ID")} Kg</TableCell>
                    <TableCell className="text-right font-mono font-bold text-accent">Rp {Math.round(hpp.hppPerKg).toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/production/${b.id}`)}>Detail</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {data?.data.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Belum ada data HPP.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
