"use client";

import { useForm } from "react-hook-form";
import { updateWarehouse, getWarehouseById, deleteWarehouse } from "@/actions/master-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

export default function EditWarehousePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();

  const { data: warehouse, isLoading } = useQuery({
    queryKey: ["warehouse", id],
    queryFn: () => getWarehouseById(id),
  });

  useEffect(() => {
    if (warehouse) reset(warehouse);
  }, [warehouse, reset]);

  const deleteMut = useMutation({
    mutationFn: () => deleteWarehouse(id),
    onSuccess: () => {
      toast.success("Gudang berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      router.push("/master/warehouses");
    },
    onError: () => toast.error("Gagal menghapus gudang"),
  });

  const onSubmit = async (data: any) => {
    try {
      await updateWarehouse(id, data);
      toast.success("Gudang berhasil diupdate");
      router.push("/master/warehouses");
    } catch {
      toast.error("Gagal update gudang");
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <Card className="max-w-2xl mx-auto shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Edit Gudang</CardTitle>
        <Button variant="destructive" size="sm" type="button" onClick={() => { if (confirm("Yakin hapus gudang ini?")) deleteMut.mutate(); }}>
          <Trash2 className="mr-2 h-4 w-4" /> Hapus
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Kode Gudang</Label>
            <Input {...register("code", { required: true })} />
          </div>
          <div>
            <Label>Nama Gudang</Label>
            <Input {...register("name", { required: true })} />
          </div>
          <div>
            <Label>Jenis / Tipe</Label>
            <Input {...register("type")} />
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
