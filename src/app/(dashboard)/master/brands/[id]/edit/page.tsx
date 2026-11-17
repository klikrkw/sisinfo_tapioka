"use client";

import { use, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { getBrands, updateBrand, deleteBrand } from "@/actions/brand-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const brandId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<{ name: string }>({ defaultValues: { name: "" } });

  const { data: brands, isLoading } = useQuery({
    queryKey: ["brands", "all"],
    queryFn: () => getBrands(true),
  });
  const brand = brands?.find((b) => b.id === brandId);

  useEffect(() => {
    if (brand) reset({ name: brand.name });
  }, [brand, reset]);

  const deleteMut = useMutation({
    mutationFn: () => deleteBrand(brandId),
    onSuccess: () => {
      toast.success("Merek dihapus / dinonaktifkan");
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      router.push("/master/brands");
    },
    onError: () => toast.error("Gagal menghapus merek"),
  });

  const onSubmit = async (data: { name: string }) => {
    try {
      await updateBrand(brandId, data.name);
      toast.success("Merek berhasil diupdate");
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      router.push("/master/brands");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal update merek");
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!brand) return <div className="p-8 text-center text-muted-foreground">Merek tidak ditemukan.</div>;

  return (
    <Card className="mx-auto max-w-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Edit Merek</CardTitle>
        <Button
          variant="destructive"
          size="sm"
          type="button"
          onClick={() => {
            if (confirm("Hapus merek ini? Merek yang sudah dipakai penjualan akan dinonaktifkan.")) {
              deleteMut.mutate();
            }
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Hapus
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nama Merek</Label>
            <Input {...register("name", { required: true })} autoFocus />
            {brand.status === false && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Merek ini nonaktif — simpan untuk mengaktifkan kembali.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => router.back()}>Batal</Button>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
