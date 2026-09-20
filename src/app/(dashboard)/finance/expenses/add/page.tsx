"use client";

import { useForm } from "react-hook-form";
import { createExpense } from "@/actions/finance-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const CATEGORIES = ["Gaji Administrasi", "Telepon & Internet", "Listrik Kantor", "ATK", "Pajak", "Keamanan", "Kebersihan", "Sewa", "Perizinan", "Maintenance Kantor", "Biaya Bank", "Lainnya"];

export default function AddExpensePage() {
  const router = useRouter();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      category: "Gaji Administrasi",
      name: "",
      amount: 0,
      notes: "",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await createExpense({
        date: data.date,
        category: data.category,
        name: data.name,
        amount: Number(data.amount),
        notes: data.notes,
      });
      toast.success("Biaya operasional dicatat");
      router.push("/finance/expenses");
    } catch {
      toast.error("Gagal mencatat biaya");
    }
  };

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Card className="mx-auto max-w-2xl shadow-sm">
      <CardHeader><CardTitle>Tambah Biaya Operasional</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><Label>Tanggal</Label><Input type="date" {...register("date", { required: true })} /></div>
          <div>
            <Label>Kategori</Label>
            <select className={selectClass} {...register("category")}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><Label>Nama Biaya</Label><Input {...register("name", { required: true })} placeholder="Keterangan biaya" /></div>
          <div><Label>Jumlah (Rp)</Label><Input type="number" step="0.01" {...register("amount", { required: true })} /></div>
          <div><Label>Catatan</Label><Input {...register("notes")} /></div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => router.back()}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
