"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProductsPaginated } from "@/actions/master-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const typeLabel: Record<string, string> = {
  RAW_MATERIAL: "Bahan Baku",
  FINISHED_GOOD: "Produk Jadi",
  BY_PRODUCT: "Produk Sampingan",
  PACKAGING: "Kemasan",
};

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["products", page, search],
    queryFn: () => getProductsPaginated(page, limit, search),
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / limit));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Daftar Produk / Bahan</CardTitle>
        <Button size="sm" onClick={() => router.push("/master/products/add")}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Produk
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari kode atau nama..."
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
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Satuan</TableHead>
                <TableHead className="text-right">Harga Default</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Tidak ada data
                  </TableCell>
                </TableRow>
              )}
              {data?.data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.code}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell><Badge variant="outline">{typeLabel[p.type] ?? p.type}</Badge></TableCell>
                  <TableCell>{p.unit}</TableCell>
                  <TableCell className="text-right">Rp {Number(p.defaultPrice || 0).toLocaleString('id-ID')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/master/products/${p.id}/edit`)}>
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
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
