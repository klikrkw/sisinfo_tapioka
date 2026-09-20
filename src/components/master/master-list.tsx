"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export type Column<T> = {
  header: string;
  className?: string;
  cell: (row: T) => React.ReactNode;
};

type Props<T> = {
  title: string;
  queryKey: string;
  queryFn: (page: number, limit: number, search?: string) => Promise<{ data: T[]; total: number }>;
  columns: Column<T>[];
  addHref: string;
  addLabel?: string;
  searchPlaceholder?: string;
  rowHref?: (row: T) => string;
};

export function MasterList<T extends { id: number }>({
  title,
  queryKey,
  queryFn,
  columns,
  addHref,
  addLabel = "Tambah",
  searchPlaceholder = "Cari...",
  rowHref,
}: Props<T>) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: [queryKey, page, search],
    queryFn: () => queryFn(page, limit, search),
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / limit));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button size="sm" onClick={() => router.push(addHref)}>
          <Plus className="mr-2 h-4 w-4" /> {addLabel}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8"
          />
        </div>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.header} className={c.className}>{c.header}</TableHead>
                ))}
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="py-8 text-center text-muted-foreground">
                    Tidak ada data
                  </TableCell>
                </TableRow>
              )}
              {data?.data.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((c) => (
                    <TableCell key={c.header} className={c.className}>{c.cell(row)}</TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(rowHref ? rowHref(row) : `${addHref.replace(/\/add$/, "")}/${row.id}/edit`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages} · Total {data?.total ?? 0}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
