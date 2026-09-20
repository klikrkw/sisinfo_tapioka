"use client";

import { useQuery } from "@tanstack/react-query";
import { getShipmentCosts } from "@/actions/fleet-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function FleetCostsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["shipment-costs"], queryFn: getShipmentCosts });

  const total = data?.reduce((a, c) => a + Number(c.amount), 0) ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Biaya Armada</CardTitle>
        <span className="font-mono text-lg font-bold text-accent">Total: Rp {total.toLocaleString("id-ID")}</span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : data && data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategori</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead>Pengiriman</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><Badge variant="outline">{c.category}</Badge></TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell className="font-mono text-sm">{c.shipmentNumber ?? "-"}</TableCell>
                  <TableCell className="text-right font-mono">Rp {Number(c.amount).toLocaleString("id-ID")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada biaya armada.</p>
        )}
      </CardContent>
    </Card>
  );
}
