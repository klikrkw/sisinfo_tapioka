"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { getPurchaseById, updatePurchaseTransaction } from "@/actions/purchasing-actions";
import { getSuppliers, getProducts, getWarehouses } from "@/actions/master-actions";
import { getDeductionTypes } from "@/actions/master-others";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { calculatePurchaseWeight, calculatePurchaseAmount } from "@/lib/calculations/purchasing";
import { use, useEffect, useMemo } from "react";
import { Plus, Trash2, Lock } from "lucide-react";

export default function EditPurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);
  const router = useRouter();

  const { data: purchase, isLoading } = useQuery({
    queryKey: ["purchase", id],
    queryFn: () => getPurchaseById(id),
  });

  const { register, handleSubmit, watch, control, setValue, reset } = useForm({
    defaultValues: {
      number: "",
      date: "",
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

  const { fields, append, remove } = useFieldArray({ control, name: "deductions" });

  const { data: suppliers } = useQuery({ queryKey: ["suppliers"], queryFn: getSuppliers });
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const { data: warehouses } = useQuery({ queryKey: ["warehouses"], queryFn: getWarehouses });
  const { data: dedTypes } = useQuery({ queryKey: ["deductionTypes"], queryFn: getDeductionTypes });

  useEffect(() => {
    if (purchase) {
      reset({
        number: purchase.number,
        date: purchase.date ? new Date(purchase.date).toISOString().slice(0, 10) : "",
        supplierId: String(purchase.supplierId),
        rawMaterialId: String(purchase.rawMaterialId),
        warehouseId: String(purchase.warehouseId),
        grossWeight: Number(purchase.grossWeight),
        tareWeight: Number(purchase.tareWeight),
        refactionPercent: Number(purchase.refactionPercent),
        pricePerKg: Number(purchase.pricePerKg),
        notes: purchase.notes ?? "",
        deductions: (purchase.deductions ?? []).map((d) => ({
          deductionTypeId: d.deductionTypeId,
          name: d.name,
          calculationType: d.calculationType,
          quantity: Number(d.quantity),
          rate: Number(d.rate),
          amount: Number(d.amount),
        })),
      });
    }
  }, [purchase, reset]);

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

  const isPosted = purchase && purchase.status !== "Draft";

  const onSubmit = async (data: any) => {
    if (isPosted) {
      toast.error("Transaksi yang telah diposting tidak dapat diedit langsung.");
      return;
    }
    try {
      await updatePurchaseTransaction(id, {
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
      toast.success("Pembelian berhasil diupdate");
      router.push("/purchasing");
    } catch {
      toast.error("Gagal update pembelian");
    }
  };

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!purchase) return <div className="p-8 text-center text-muted-foreground">Transaksi tidak ditemukan.</div>;

  return (
    <Card className="mx-auto max-w-4xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Detail / Edit Pembelian</CardTitle>
        <Badge variant={isPosted ? "secondary" : "outline"}>{purchase.status}</Badge>
      </CardHeader>
      <CardContent>
        {isPosted && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400">
            <Lock className="h-4 w-4" />
            Transaksi telah diposting. Perubahan harus melalui mekanisme koreksi/approval.
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <fieldset disabled={!!isPosted} className="space-y-6">
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
                <Label>Gudang</Label>
                <select className={selectClass} {...register("warehouseId", { required: true })}>
                  <option value="">Pilih Gudang</option>
                  {warehouses?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>

            <Separator />
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Penimbangan & Rifaksi</p>
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
                <Input readOnly value={calc.payableWeight.toLocaleString("id-ID")} className="bg-muted font-mono font-bold" />
              </div>
              <div>
                <Label>Harga / Kg (Rp)</Label>
                <Input type="number" step="0.01" {...register("pricePerKg")} />
              </div>
              <div className="sm:col-span-2">
                <Label>Nilai Bahan Baku (Rp)</Label>
                <Input readOnly value={`Rp ${calc.baseAmount.toLocaleString("id-ID")}`} className="bg-muted font-mono font-bold text-accent" />
              </div>
            </div>

            <Separator />
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Potongan Lain / Biaya</p>
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
                      rate,
                      amount: Math.round(amt),
                    });
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Tambah Potongan
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-3">
                    <select
                      className={selectClass + " min-w-[160px] flex-1"}
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
                          const type = watchedDeductions[index]?.calculationType;
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
                {fields.length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum ada potongan.</p>
                )}
              </div>

              {fields.length > 0 && (
                <div className="mt-3 text-right text-sm">
                  Total Potongan: <span className="font-mono font-bold">Rp {calc.totalDeductions.toLocaleString("id-ID")}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl border bg-primary/5 p-4">
              <span className="font-semibold">Total Pembayaran Supplier:</span>
              <span className="font-mono text-xl font-bold text-accent">Rp {calc.netAmount.toLocaleString("id-ID")}</span>
            </div>

            <div>
              <Label>Keterangan</Label>
              <Input {...register("notes")} />
            </div>
          </fieldset>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => router.back()}>Kembali</Button>
            {!isPosted && <Button type="submit">Update</Button>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
