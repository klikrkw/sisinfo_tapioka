"use client";

import { useQuery } from "@tanstack/react-query";
import { getFuelTransactions } from "@/actions/fleet-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function FuelPage() {
  const { data, isLoading } = useQuery({ queryKey: ["fuel"], queryFn: getFuelTransactions });

  const total = data?.reduce((a, f) => a + Number(f.total), 0) ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Biaya Solar</CardTitle>
        <span className="font-mono text-lg font-bold text-accent">Total: Rp {total.toLocaleString("id-ID")}</span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : data && data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Armada</TableHead>
                <TableHead className="text-right">Liter</TableHead>
                <TableHead className="text-right">Harga/L</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>{new Date(f.date).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell className="font-mono">{f.vehicleName ?? "-"}</TableCell>
                  <TableCell className="text-right font-mono">{Number(f.liters).toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-right font-mono">Rp {Number(f.pricePerLiter).toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">Rp {Number(f.total).toLocaleString("id-ID")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data solar.</p>
        )}
      </CardContent>
    </Card>
  );
}
