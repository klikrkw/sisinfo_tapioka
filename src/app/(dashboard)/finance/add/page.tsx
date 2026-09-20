"use client";

import { useForm } from "react-hook-form";
import { createCashTransaction } from "@/actions/finance-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const CATEGORIES = ["Penjualan", "Penerimaan Piutang", "Pembayaran Supplier", "Biaya Produksi", "Biaya Armada", "Biaya Operasional", "Lainnya"];

export default function AddCashPage() {
  const router = useRouter();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      type: "IN",
      category: "Penjualan",
      description: "",
      amount: 0,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await createCashTransaction({
        date: data.date,
        type: data.type,
        category: data.category,
        description: data.description,
        amount: Number(data.amount),
      });
      toast.success("Transaksi kas dicatat");
      router.push("/finance");
    } catch {
      toast.error("Gagal mencatat transaksi");
    }
  };

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Card className="mx-auto max-w-2xl shadow-sm">
      <CardHeader><CardTitle>Catat Transaksi Kas</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><Label>Tanggal</Label><Input type="date" {...register("date", { required: true })} /></div>
          <div>
            <Label>Jenis</Label>
            <select className={selectClass} {...register("type")}>
              <option value="IN">Kas Masuk</option>
              <option value="OUT">Kas Keluar</option>
            </select>
          </div>
          <div>
            <Label>Kategori</Label>
            <select className={selectClass} {...register("category")}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><Label>Keterangan</Label><Input {...register("description", { required: true })} /></div>
          <div><Label>Jumlah (Rp)</Label><Input type="number" step="0.01" {...register("amount", { required: true })} /></div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => router.back()}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
