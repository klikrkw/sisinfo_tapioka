"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSuppliersPaginated, deleteSupplier } from "@/actions/master-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function SuppliersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["suppliers", page, search],
    queryFn: () => getSuppliersPaginated(page, limit, search),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Daftar Supplier</CardTitle>
        <Button size="sm" onClick={() => router.push("/master/suppliers/add")}>
          <Plus className="mr-2 h-4 w-4" /> Tambah
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari kode atau nama..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.code}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell><Badge variant="outline">{s.type}</Badge></TableCell>
                <TableCell>{s.phone}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => router.push(`/master/suppliers/${s.id}/edit`)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Halaman {page}</p>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))}><ChevronLeft className="h-4 w-4"/></Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p+1)}><ChevronRight className="h-4 w-4"/></Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
