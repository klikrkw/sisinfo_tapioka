"use client";

import { useForm } from "react-hook-form";
import { createProduct, getNextMasterCode } from "@/actions/master-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect } from "react";

export default function AddProductPage() {
  const router = useRouter();
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: { type: "RAW_MATERIAL", unit: "Kg", code: "", name: "", defaultPrice: "" }
  });

  useEffect(() => {
    getNextMasterCode("products").then((code) => {
      if (code) setValue("code", code);
    });
  }, [setValue]);

  const onSubmit = async (data: any) => {
    try {
      await createProduct({
        ...data,
        defaultPrice: data.defaultPrice ? String(data.defaultPrice) : "0",
      });
      toast.success("Produk berhasil ditambah");
      router.push("/master/products");
    } catch {
      toast.error("Gagal menambah produk");
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-sm">
      <CardHeader>
        <CardTitle>Tambah Produk / Bahan Baru</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Kode Produk</Label>
            <Input {...register("code", { required: true })} placeholder="PRD-001" />
          </div>
          <div>
            <Label>Nama Produk</Label>
            <Input {...register("name", { required: true })} placeholder="Ketela Segar / Tepung Tapioka" />
          </div>
          <div>
            <Label>Tipe Produk</Label>
            <select 
              {...register("type", { required: true })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="RAW_MATERIAL">Bahan Baku</option>
              <option value="FINISHED_GOOD">Produk Jadi</option>
              <option value="BY_PRODUCT">Produk Sampingan</option>
              <option value="PACKAGING">Kemasan</option>
            </select>
          </div>
          <div>
            <Label>Satuan</Label>
            <Input {...register("unit", { required: true })} placeholder="Kg / Sak / Pcs" />
          </div>
          <div>
            <Label>Harga Default (Rp)</Label>
            <Input type="number" step="0.01" {...register("defaultPrice")} placeholder="0" />
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
