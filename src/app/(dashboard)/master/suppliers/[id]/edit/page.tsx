"use client";

import { useForm } from "react-hook-form";
import { updateSupplier, getSupplierById } from "@/actions/master-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, use } from "react";
import { useQuery } from "@tanstack/react-query";

export default function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);
  const router = useRouter();
  const { register, handleSubmit, reset } = useForm();

  const { data: supplier } = useQuery({
    queryKey: ["supplier", id],
    queryFn: () => getSupplierById(id),
  });

  useEffect(() => {
    if (supplier) {
      reset(supplier);
    }
  }, [supplier, reset]);

  const onSubmit = async (data: any) => {
    try {
      await updateSupplier(id, data);
      toast.success("Supplier berhasil diupdate");
      router.push("/master/suppliers");
    } catch {
      toast.error("Gagal update supplier");
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Supplier</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Kode Supplier</Label>
            <Input {...register("code", { required: true })} />
          </div>
          <div>
            <Label>Nama Supplier</Label>
            <Input {...register("name", { required: true })} />
          </div>
          <div>
            <Label>Telepon</Label>
            <Input {...register("phone")} />
          </div>
          <div>
            <Label>Alamat</Label>
            <Input {...register("address")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => router.back()}>Batal</Button>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
