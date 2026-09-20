"use client";

import { useForm } from "react-hook-form";
import { updateProduct, getProductById, deleteProduct } from "@/actions/master-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id),
  });

  useEffect(() => {
    if (product) {
      reset({
        ...product,
        defaultPrice: product.defaultPrice ? Number(product.defaultPrice) : 0,
      });
    }
  }, [product, reset]);

  const deleteMut = useMutation({
    mutationFn: () => deleteProduct(id),
    onSuccess: () => {
      toast.success("Produk berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push("/master/products");
    },
    onError: () => toast.error("Gagal menghapus produk"),
  });

  const onSubmit = async (data: any) => {
    try {
      await updateProduct(id, {
        ...data,
        defaultPrice: data.defaultPrice ? String(data.defaultPrice) : "0",
      });
      toast.success("Produk berhasil diupdate");
      router.push("/master/products");
    } catch {
      toast.error("Gagal update produk");
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <Card className="max-w-2xl mx-auto shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Edit Produk / Bahan</CardTitle>
        <Button 
          variant="destructive" 
          size="sm" 
          type="button" 
          onClick={() => {
            if (confirm("Yakin hapus produk ini?")) deleteMut.mutate();
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Hapus
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Kode Produk</Label>
            <Input {...register("code", { required: true })} />
          </div>
          <div>
            <Label>Nama Produk</Label>
            <Input {...register("name", { required: true })} />
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
            <Input {...register("unit", { required: true })} />
          </div>
          <div>
            <Label>Harga Default (Rp)</Label>
            <Input type="number" step="0.01" {...register("defaultPrice")} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => router.back()}>Batal</Button>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
