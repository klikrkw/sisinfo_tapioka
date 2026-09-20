"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { getNextMasterCode } from "@/actions/master-actions";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "email";
  required?: boolean;
  placeholder?: string;
  step?: string;
  options?: { value: string; label: string }[];
  autoCodeEntity?: string;
};

type Props = {
  title: string;
  fields: Field[];
  defaultValues: Record<string, unknown>;
  initialData?: Record<string, unknown> | null;
  submit: (data: Record<string, unknown>) => Promise<void>;
  deleteAction?: () => Promise<void>;
  backHref: string;
};

export function MasterForm({ title, fields, defaultValues, initialData, submit, deleteAction, backHref }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue } = useForm<Record<string, unknown>>({ defaultValues });

  useEffect(() => {
    async function init() {
      if (initialData) {
        reset(initialData);
      } else {
        for (const f of fields) {
          if (f.autoCodeEntity) {
            const next = await getNextMasterCode(f.autoCodeEntity);
            if (next) setValue(f.name, next);
          }
        }
      }
    }
    init();
  }, [initialData, reset, fields, setValue]);

  const deleteMut = useMutation({
    mutationFn: async () => deleteAction?.(),
    onSuccess: () => {
      toast.success("Data berhasil dihapus");
      queryClient.invalidateQueries();
      router.push(backHref);
    },
    onError: () => toast.error("Gagal menghapus data"),
  });

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      await submit(data);
      toast.success("Data berhasil disimpan");
      router.push(backHref);
    } catch {
      toast.error("Gagal menyimpan data");
    }
  };

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Card className="mx-auto max-w-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {deleteAction && (
          <Button
            variant="destructive"
            size="sm"
            type="button"
            onClick={() => { if (confirm("Yakin hapus data ini?")) deleteMut.mutate(); }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Hapus
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {fields.map((f) => (
            <div key={f.name}>
              <Label>{f.label}</Label>
              {f.options ? (
                <select className={selectClass} {...register(f.name, { required: f.required })}>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <Input
                  type={f.type ?? "text"}
                  step={f.step}
                  placeholder={f.placeholder}
                  {...register(f.name, { required: f.required })}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => router.back()}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
