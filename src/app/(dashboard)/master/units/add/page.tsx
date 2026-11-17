"use client";

import { useForm } from "react-hook-form";
import { createUnit } from "@/actions/unit-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AddUnitPage() {
  const router = useRouter();
  const { register, handleSubmit, formState } = useForm<{ name: string }>({
    defaultValues: { name: "" },
  });

  const onSubmit = async (data: { name: string }) => {
    try {
      await createUnit(data.name);
      toast.success("Satuan berhasil ditambahkan");
      router.push("/master/units");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menambah satuan");
    }
  };

  return (
    <Card className="mx-auto max-w-2xl shadow-sm">
      <CardHeader>
        <CardTitle>Tambah Satuan</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nama Satuan</Label>
            <Input {...register("name", { required: true })} placeholder="Contoh: Kg, Sak, Pcs" autoFocus />
            <p className="mt-1 text-xs text-muted-foreground">
              Satuan akan muncul sebagai pilihan pada master produk.
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
