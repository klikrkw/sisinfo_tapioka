"use client";

import { useForm } from "react-hook-form";
import { createWarehouse, getNextMasterCode } from "@/actions/master-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect } from "react";

export default function AddWarehousePage() {
  const router = useRouter();
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: { code: "", name: "", type: "Gudang Utama" }
  });

  useEffect(() => {
    getNextMasterCode("warehouses").then((code) => {
      if (code) setValue("code", code);
    });
  }, [setValue]);

  const onSubmit = async (data: any) => {
    try {
      await createWarehouse(data as Parameters<typeof createWarehouse>[0]);
      toast.success("Gudang berhasil ditambah");
      router.push("/master/warehouses");
    } catch {
      toast.error("Gagal menambah gudang");
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-sm">
      <CardHeader>
        <CardTitle>Tambah Gudang Baru</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Kode Gudang</Label>
            <Input {...register("code", { required: true })} placeholder="WH-001" />
          </div>
          <div>
            <Label>Nama Gudang</Label>
            <Input {...register("name", { required: true })} placeholder="Gudang Ketela" />
          </div>
          <div>
            <Label>Jenis / Tipe</Label>
            <Input {...register("type", { required: true })} placeholder="Bahan Baku / Produk Jadi" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => router.back()}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
