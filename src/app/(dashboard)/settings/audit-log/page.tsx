"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/actions/settings-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const limit = 15;
  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page],
    queryFn: () => getAuditLogs(page, limit),
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / limit));

  return (
    <Card>
      <CardHeader><CardTitle>Audit Log</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : data?.data.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Modul</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Record</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-sm">{l.createdAt ? new Date(l.createdAt).toLocaleString("id-ID") : "-"}</TableCell>
                  <TableCell>{l.username ?? "-"}</TableCell>
                  <TableCell><Badge variant="outline">{l.module}</Badge></TableCell>
                  <TableCell className="text-sm">{l.action}</TableCell>
                  <TableCell className="font-mono text-sm">{l.recordId ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada aktivitas tercatat.</p>
        )}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Halaman {page} dari {totalPages} · Total {data?.total ?? 0}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
