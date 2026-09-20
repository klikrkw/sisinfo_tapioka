"use client";

import { useForm } from "react-hook-form";
import { createSupplier, getNextMasterCode } from "@/actions/master-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect } from "react";

export default function AddSupplierPage() {
  const router = useRouter();
  const { register, handleSubmit, setValue } = useForm();

  useEffect(() => {
    getNextMasterCode("suppliers").then((code) => {
      if (code) setValue("code", code);
    });
  }, [setValue]);

  const onSubmit = async (data: any) => {
    try {
      await createSupplier(data as Parameters<typeof createSupplier>[0]);
      toast.success("Supplier berhasil ditambah");
      router.push("/master/suppliers");
    } catch {
      toast.error("Gagal menambah supplier");
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Tambah Supplier Baru</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Kode Supplier</Label>
            <Input {...register("code", { required: true })} placeholder="SUP-001" />
          </div>
          <div>
            <Label>Nama Supplier</Label>
            <Input {...register("name", { required: true })} placeholder="Nama Petani / Pengepul" />
          </div>
          <div>
            <Label>Telepon</Label>
            <Input {...register("phone")} placeholder="08123456789" />
          </div>
          <div>
            <Label>Alamat</Label>
            <Input {...register("address")} placeholder="Alamat lengkap" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => router.back()}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
