"use client";

import { useQuery } from "@tanstack/react-query";
import { getShipmentById } from "@/actions/fleet-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { use } from "react";
import { useRouter } from "next/navigation";

export default function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const shipmentId = Number(id);
  const router = useRouter();
  const { data: s, isLoading } = useQuery({ queryKey: ["shipment", shipmentId], queryFn: () => getShipmentById(shipmentId) });

  if (isLoading) return <div className="space-y-4">{[0, 1].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;
  if (!s) return <div className="p-8 text-center text-muted-foreground">Pengiriman tidak ditemukan.</div>;

  const totalCosts = s.costs.reduce((a, c) => a + Number(c.amount), 0);
  const totalFuel = s.fuel.reduce((a, f) => a + Number(f.total), 0);
  const total = totalCosts + totalFuel;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pengiriman {s.number}</h2>
          <p className="text-sm text-muted-foreground">
            {new Date(s.date).toLocaleDateString("id-ID")} · {s.destination ?? "-"} · {Number(s.distance).toLocaleString("id-ID")} KM
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{s.status}</Badge>
          <Button variant="outline" size="sm" onClick={() => router.push("/fleet")}>Kembali</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-2"><p className="text-xs text-muted-foreground">Biaya Solar</p><p className="font-mono text-lg font-bold">Rp {totalFuel.toLocaleString("id-ID")}</p></CardContent></Card>
        <Card><CardContent className="pt-2"><p className="text-xs text-muted-foreground">Biaya Lain</p><p className="font-mono text-lg font-bold">Rp {totalCosts.toLocaleString("id-ID")}</p></CardContent></Card>
        <Card><CardContent className="pt-2"><p className="text-xs text-muted-foreground">Total Biaya Pengiriman</p><p className="font-mono text-lg font-bold text-accent">Rp {total.toLocaleString("id-ID")}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Rincian Biaya</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Kategori</TableHead><TableHead>Keterangan</TableHead><TableHead className="text-right">Jumlah</TableHead></TableRow></TableHeader>
            <TableBody>
              {s.fuel.map((f) => (
                <TableRow key={`f-${f.id}`}>
                  <TableCell><Badge variant="outline">Solar</Badge></TableCell>
                  <TableCell>{Number(f.liters).toLocaleString("id-ID")} L × Rp {Number(f.pricePerLiter).toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-right font-mono">Rp {Number(f.total).toLocaleString("id-ID")}</TableCell>
                </TableRow>
              ))}
              {s.costs.map((c) => (
                <TableRow key={`c-${c.id}`}>
                  <TableCell><Badge variant="outline">{c.category}</Badge></TableCell>
                  <TableCell>{c.name}</TableCell>
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
