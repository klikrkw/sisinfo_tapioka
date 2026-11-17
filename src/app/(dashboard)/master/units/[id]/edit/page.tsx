"use client";

import { use, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { getUnits, updateUnit, deleteUnit } from "@/actions/unit-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const unitId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<{ name: string }>({ defaultValues: { name: "" } });

  const { data: units, isLoading } = useQuery({
    queryKey: ["units", "all"],
    queryFn: () => getUnits(true),
  });
  const unit = units?.find((u) => u.id === unitId);

  useEffect(() => {
    if (unit) reset({ name: unit.name });
  }, [unit, reset]);

  const deleteMut = useMutation({
    mutationFn: () => deleteUnit(unitId),
    onSuccess: () => {
      toast.success("Satuan dinonaktifkan");
      queryClient.invalidateQueries({ queryKey: ["units"] });
      router.push("/master/units");
    },
    onError: () => toast.error("Gagal menonaktifkan satuan"),
  });

  const onSubmit = async (data: { name: string }) => {
    try {
      await updateUnit(unitId, data.name);
      toast.success("Satuan berhasil diupdate");
      queryClient.invalidateQueries({ queryKey: ["units"] });
      router.push("/master/units");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal update satuan");
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!unit) return <div className="p-8 text-center text-muted-foreground">Satuan tidak ditemukan.</div>;

  return (
    <Card className="mx-auto max-w-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Edit Satuan</CardTitle>
        <Button
          variant="destructive"
          size="sm"
          type="button"
          onClick={() => {
            if (confirm("Nonaktifkan satuan ini?")) deleteMut.mutate();
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Nonaktifkan
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nama Satuan</Label>
            <Input {...register("name", { required: true })} autoFocus />
            {unit.status === false && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Satuan ini nonaktif — simpan untuk mengaktifkan kembali.
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
