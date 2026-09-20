"use client";

import { useQuery } from "@tanstack/react-query";
import { getProductionBatchesPaginated } from "@/actions/production-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ProductionCostsPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["production-costs"],
    queryFn: () => getProductionBatchesPaginated(1, 100),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Biaya Produksi per Batch</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Batch</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono font-medium">{b.number}</TableCell>
                  <TableCell>{new Date(b.date).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell>{b.status}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/production/${b.id}`)}>
                      Lihat Biaya
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {data?.data.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Belum ada batch produksi.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
