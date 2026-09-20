"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { createPurchaseTransaction } from "@/actions/purchasing-actions";
import { getSuppliers, getProducts, getWarehouses } from "@/actions/master-actions";
import { getDeductionTypes } from "@/actions/master-others";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { calculatePurchaseWeight, calculatePurchaseAmount } from "@/lib/calculations/purchasing";
import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function AddPurchasePage() {
  const router = useRouter();
  const { register, handleSubmit, watch, control, setValue } = useForm({
    defaultValues: {
      number: `PB/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/000001`,
      date: new Date().toISOString().slice(0, 10),
      supplierId: "",
      rawMaterialId: "",
      warehouseId: "",
      grossWeight: 0,
      tareWeight: 0,
      refactionPercent: 0,
      pricePerKg: 0,
      notes: "",
      deductions: [] as { deductionTypeId: number; name: string; calculationType: string; quantity: number; rate: number; amount: number }[],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "deductions",
  });

  const { data: suppliers } = useQuery({ queryKey: ["suppliers"], queryFn: getSuppliers });
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const { data: warehouses } = useQuery({ queryKey: ["warehouses"], queryFn: getWarehouses });
  const { data: dedTypes } = useQuery({ queryKey: ["deductionTypes"], queryFn: getDeductionTypes });

  const grossWeight = Number(watch("grossWeight")) || 0;
  const tareWeight = Number(watch("tareWeight")) || 0;
  const refactionPercent = Number(watch("refactionPercent")) || 0;
  const pricePerKg = Number(watch("pricePerKg")) || 0;
  const watchedDeductions = useMemo(() => watch("deductions") || [], [watch]);

  const calc = useMemo(() => {
    const w = calculatePurchaseWeight(grossWeight, tareWeight, refactionPercent);
    const totalDeductions = watchedDeductions.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
    const a = calculatePurchaseAmount(w.payableWeight, pricePerKg, totalDeductions);
    return { ...w, ...a, totalDeductions };
  }, [grossWeight, tareWeight, refactionPercent, pricePerKg, watchedDeductions]);

  const onSubmit = async (data: any) => {
    try {
      await createPurchaseTransaction({
        number: data.number,
        date: data.date,
        supplierId: Number(data.supplierId),
        rawMaterialId: Number(data.rawMaterialId),
        warehouseId: Number(data.warehouseId),
        grossWeight: Number(data.grossWeight),
        tareWeight: Number(data.tareWeight),
        refactionPercent: Number(data.refactionPercent),
        pricePerKg: Number(data.pricePerKg),
        notes: data.notes,
        deductions: data.deductions.map((d: any) => ({
          deductionTypeId: Number(d.deductionTypeId),
          name: d.name,
          calculationType: d.calculationType,
          quantity: Number(d.quantity),
          rate: Number(d.rate),
          amount: Number(d.amount),
        })),
      });
      toast.success("Pembelian berhasil disimpan");
      router.push("/purchasing");
    } catch {
      toast.error("Gagal menyimpan pembelian");
    }
  };

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Card className="mx-auto max-w-4xl shadow-sm">
      <CardHeader>
        <CardTitle>Tambah Pembelian Ketela</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>No. Pembelian</Label>
              <Input {...register("number", { required: true })} />
            </div>
            <div>
              <Label>Tanggal</Label>
              <Input type="date" {...register("date", { required: true })} />
            </div>
            <div>
              <Label>Supplier</Label>
              <select className={selectClass} {...register("supplierId", { required: true })}>
                <option value="">Pilih Supplier</option>
                {suppliers?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Bahan Baku</Label>
              <select className={selectClass} {...register("rawMaterialId", { required: true })}>
                <option value="">Pilih Bahan</option>
                {products?.filter((p) => p.type === "RAW_MATERIAL").map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>Gudang Tujuan</Label>
              <select className={selectClass} {...register("warehouseId", { required: true })}>
                <option value="">Pilih Gudang</option>
                {warehouses?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          <Separator />
          <div>
            <p className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Penimbangan & Rifaksi</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label>Berat Timbang (Kg)</Label>
                <Input type="number" step="0.01" {...register("grossWeight")} />
              </div>
              <div>
                <Label>Berat Tara (Kg)</Label>
                <Input type="number" step="0.01" {...register("tareWeight")} />
              </div>
              <div>
                <Label>Berat Netto (Kg)</Label>
                <Input readOnly value={calc.netWeight.toLocaleString("id-ID")} className="bg-muted font-mono" />
              </div>
              <div>
                <Label>Rifaksi (%)</Label>
                <Input type="number" step="0.01" {...register("refactionPercent")} />
              </div>
              <div>
                <Label>Rifaksi (Kg)</Label>
                <Input readOnly value={calc.refactionWeight.toLocaleString("id-ID")} className="bg-muted font-mono" />
              </div>
              <div>
                <Label>Berat Dibayar (Kg)</Label>
                <Input readOnly value={calc.payableWeight.toLocaleString("id-ID")} className="bg-muted font-bold font-mono" />
              </div>
              <div>
                <Label>Harga / Kg (Rp)</Label>
                <Input type="number" step="0.01" {...register("pricePerKg")} />
              </div>
              <div className="sm:col-span-2">
                <Label>Nilai Bahan Baku (Rp)</Label>
                <Input readOnly value={`Rp ${calc.baseAmount.toLocaleString("id-ID")}`} className="bg-muted font-bold font-mono text-accent" />
              </div>
            </div>
          </div>

          <Separator />
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Potongan Lain / Biaya</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!dedTypes || dedTypes.length === 0) return;
                  const dt = dedTypes[0];
                  const rate = Number(dt.defaultValue) || 0;
                  const qty = dt.calculationType === "per_kg" ? calc.payableWeight : 1;
                  const amt = dt.calculationType === "per_kg"
                    ? calc.payableWeight * rate
                    : dt.calculationType === "percentage"
                      ? (calc.baseAmount * rate) / 100
                      : rate;
                  append({
                    deductionTypeId: dt.id,
                    name: dt.name,
                    calculationType: dt.calculationType,
                    quantity: qty,
                    rate: rate,
                    amount: Math.round(amt),
                  });
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Tambah Potongan
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3 bg-muted/20">
                  <select
                    className={selectClass + " flex-1 min-w-[160px]"}
                    {...register(`deductions.${index}.deductionTypeId`, {
                      onChange: (e) => {
                        const selected = dedTypes?.find((d) => String(d.id) === e.target.value);
                        if (!selected) return;
                        const rate = Number(selected.defaultValue) || 0;
                        const amt = selected.calculationType === "per_kg"
                          ? calc.payableWeight * rate
                          : selected.calculationType === "percentage"
                            ? (calc.baseAmount * rate) / 100
                            : rate;
                        setValue(`deductions.${index}.name`, selected.name);
                        setValue(`deductions.${index}.calculationType`, selected.calculationType);
                        setValue(`deductions.${index}.quantity`, selected.calculationType === "per_kg" ? calc.payableWeight : 1);
                        setValue(`deductions.${index}.rate`, rate);
                        setValue(`deductions.${index}.amount`, Math.round(amt));
                      },
                    })}
                  >
                    {dedTypes?.map((dt) => (
                      <option key={dt.id} value={dt.id}>{dt.name} ({dt.calculationType})</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    placeholder="Rate"
                    className="w-28"
                    {...register(`deductions.${index}.rate`, {
                      onChange: (e) => {
                        const rate = Number(e.target.value) || 0;
                        const idx = index;
                        const type = watchedDeductions[idx]?.calculationType;
                        const amt = type === "per_kg"
                          ? calc.payableWeight * rate
                          : type === "percentage"
                            ? (calc.baseAmount * rate) / 100
                            : rate;
                        setValue(`deductions.${index}.amount`, Math.round(amt));
                      },
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Jumlah"
                    className="w-32 bg-muted font-mono"
                    readOnly
                    {...register(`deductions.${index}.amount`)}
                  />
                  <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {fields.length > 0 && (
              <div className="mt-3 text-right text-sm">
                Total Potongan: <span className="font-bold font-mono">Rp {calc.totalDeductions.toLocaleString("id-ID")}</span>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-primary/5 p-4 flex items-center justify-between">
            <span className="font-semibold">Total Pembayaran Supplier:</span>
            <span className="text-xl font-bold font-mono text-accent">Rp {calc.netAmount.toLocaleString("id-ID")}</span>
          </div>

          <div>
            <Label>Keterangan</Label>
            <Input {...register("notes")} placeholder="Catatan opsional..." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => router.back()}>Batal</Button>
            <Button type="submit">Simpan Transaksi</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
