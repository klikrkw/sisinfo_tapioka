"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProducts, getWarehouses } from "@/actions/master-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MasterDataPage() {
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const { data: warehouses } = useQuery({ queryKey: ["warehouses"], queryFn: getWarehouses });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daftar Produk</CardTitle>
          <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Tambah</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Satuan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.code}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                  <TableCell>{p.unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daftar Gudang</CardTitle>
          <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Tambah</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Tipe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses?.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>{w.code}</TableCell>
                  <TableCell>{w.name}</TableCell>
                  <TableCell>{w.type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
