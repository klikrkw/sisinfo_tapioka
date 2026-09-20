"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDocumentSequences, saveDocumentSequence } from "@/actions/settings-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";

const DEFAULTS = [
  { docType: "PURCHASE", prefix: "PB", pattern: "PB/{YYYY}/{MM}/{000001}" },
  { docType: "PRODUCTION", prefix: "PRD", pattern: "PRD/{YYYY}/{MM}/{000001}" },
  { docType: "SALES", prefix: "PJ", pattern: "PJ/{YYYY}/{MM}/{000001}" },
  { docType: "SHIPMENT", prefix: "DO", pattern: "DO/{YYYY}/{MM}/{000001}" },
  { docType: "PAYMENT", prefix: "PAY", pattern: "PAY/{YYYY}/{MM}/{000001}" },
];

export default function NumberingPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["document-sequences"], queryFn: getDocumentSequences });
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [prefixEditing, setPrefixEditing] = useState<Record<string, string>>({});

  const saveMut = useMutation({
    mutationFn: (payload: { docType: string; prefix: string; pattern: string }) => saveDocumentSequence(payload),
    onSuccess: () => {
      toast.success("Format nomor tersimpan");
      queryClient.invalidateQueries({ queryKey: ["document-sequences"] });
    },
  });

  return (
    <Card>
      <CardHeader><CardTitle>Format Nomor Dokumen</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-40 w-full" /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dokumen</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>Format</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEFAULTS.map((d) => {
                const existing = data?.find((s) => s.docType === d.docType);
                const pattern = editing[d.docType] ?? existing?.pattern ?? d.pattern;
                const prefix = prefixEditing[d.docType] ?? existing?.prefix ?? d.prefix;
                return (
                  <TableRow key={d.docType}>
                    <TableCell className="font-medium">{d.docType}</TableCell>
                    <TableCell>
                      <Input
                        value={prefix}
                        onChange={(e) => setPrefixEditing({ ...prefixEditing, [d.docType]: e.target.value })}
                        className="w-24 font-mono text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={pattern}
                        onChange={(e) => setEditing({ ...editing, [d.docType]: e.target.value })}
                        className="font-mono text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => saveMut.mutate({ docType: d.docType, prefix, pattern })}>
                        Simpan
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
