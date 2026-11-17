"use client";

import { useForm } from "react-hook-form";
import { createBrand } from "@/actions/brand-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AddBrandPage() {
  const router = useRouter();
  const { register, handleSubmit, formState } = useForm<{ name: string }>({
    defaultValues: { name: "" },
  });

  const onSubmit = async (data: { name: string }) => {
    try {
      await createBrand(data.name);
      toast.success("Merek berhasil ditambahkan");
      router.push("/master/brands");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menambah merek");
    }
  };

  return (
    <Card className="mx-auto max-w-2xl shadow-sm">
      <CardHeader>
        <CardTitle>Tambah Merek</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nama Merek</Label>
            <Input
              {...register("name", { required: true })}
              placeholder='Contoh: Cap Roda Mas'
              autoFocus
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Merek akan muncul sebagai pilihan pada form penjualan.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => router.back()}>Batal</Button>
            <Button type="submit" disabled={formState.isSubmitting}>Simpan</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
