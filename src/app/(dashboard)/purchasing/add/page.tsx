"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { createPurchaseTransaction } from "@/actions/purchasing-actions";
import { getSuppliers, getProducts, getWarehouses } from "@/actions/master-actions";
import { getDeductionTypes } from "@/actions/master-others";
import { getDocumentSequences } from "@/actions/settings-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import {
  calculatePurchaseWeight,
  calculatePurchaseAmount,
  calculateDeductionAmount,
  calculateDeductionQuantity,
  splitDeductions,
} from "@/lib/calculations/purchasing";
import { useEffect, useMemo } from "react";
import { Plus, Trash2, Scale, Package, Percent, Receipt, Wand2 } from "lucide-react";
import { peekCustomDocumentNumber, generateCustomDocumentNumber } from "@/actions/numbering-actions";

type DeductionRow = {
  deductionTypeId: number | string;
  name: string;
  calculationType: string;
  impactType: string;
  quantity: number;
  rate: number;
  amount: number;
};

export default function AddPurchasePage() {
  const router = useRouter();
  const { register, handleSubmit, watch, control, setValue } = useForm({
    defaultValues: {
      number: "",
      date: new Date().toISOString().slice(0, 10),
      supplierId: "",
      rawMaterialId: "",
      warehouseId: "",
      grossWeight: 0,
      tareWeight: 0,
      sackCount: 0,
      policeNumber: "",
      poNumber: "",
      entryTime: "",
      exitDate: "",
      exitTime: "",
      refactionPercent: 0,
      pricePerKg: 0,
      notes: "",
      deductions: [] as DeductionRow[],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "deductions",
  });

  const { data: suppliers } = useQuery({ queryKey: ["suppliers"], queryFn: getSuppliers });
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const { data: warehouses } = useQuery({ queryKey: ["warehouses"], queryFn: getWarehouses });
  const { data: dedTypes } = useQuery({ queryKey: ["deductionTypes"], queryFn: getDeductionTypes });
  const applicableTypes = useMemo(
    () => (dedTypes ?? []).filter((d) => d.appliesTo === "RAW_MATERIAL" || d.appliesTo === "BOTH"),
    [dedTypes]
  );
  const { data: sequences } = useQuery({ queryKey: ["documentSequences"], queryFn: getDocumentSequences });

  const purchasePrefix = useMemo(() => {
    const seq = sequences?.find((s) => s.docType === "PURCHASE");
    return seq?.prefix ?? "PB";
  }, [sequences]);

  useEffect(() => {
    peekCustomDocumentNumber("PURCHASE", purchasePrefix).then((n) => setValue("number", n));
  }, [setValue, purchasePrefix]);

  const grossWeight = Number(watch("grossWeight")) || 0;
  const tareWeight = Number(watch("tareWeight")) || 0;
  const refactionPercent = Number(watch("refactionPercent")) || 0;
  const pricePerKg = Number(watch("pricePerKg")) || 0;
  const sackCount = Number(watch("sackCount")) || 0;
  const watchedDeductions = useWatch({ control, name: "deductions" }) ?? [];

  const calc = useMemo(() => {
    const w = calculatePurchaseWeight(grossWeight, tareWeight, refactionPercent);
    const { deductions: totalDeductions, costs: totalCosts } = splitDeductions(watchedDeductions);
    const a = calculatePurchaseAmount(w.payableWeight, pricePerKg, totalDeductions, totalCosts);
    return { ...w, ...a, totalDeductions, totalCosts };
  }, [grossWeight, tareWeight, refactionPercent, pricePerKg, watchedDeductions]);

  // Sinkronkan qty & nominal potongan per sak ketika jumlah sak berubah.
  useEffect(() => {
    watchedDeductions.forEach((d, i) => {
      if (d?.calculationType !== "per_sack") return;
      const rate = Number(d.rate) || 0;
      setValue(`deductions.${i}.quantity`, sackCount);
      setValue(`deductions.${i}.amount`, Math.round(sackCount * rate));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sackCount]);

  const recomputeRow = (index: number, calculationType: string, rate: number) => {
    const qty = calculateDeductionQuantity({
      calculationType,
      payableWeight: calc.payableWeight,
      sackCount,
    });
    const amount = calculateDeductionAmount({
      calculationType,
      rate,
      payableWeight: calc.payableWeight,
      baseAmount: calc.baseAmount,
      sackCount,
    });
    setValue(`deductions.${index}.quantity`, Math.round(qty * 100) / 100);
    setValue(`deductions.${index}.amount`, Math.round(amount));
  };

  const appendDeductionRow = (dt: {
    id: number;
    name: string;
    calculationType: string;
    impactType: string;
    defaultValue: string | null;
  }) => {
    const rate = Number(dt.defaultValue) || 0;
    const calculationType = dt.calculationType;
    const qty = calculateDeductionQuantity({ calculationType, payableWeight: calc.payableWeight, sackCount });
    const amount = calculateDeductionAmount({
      calculationType,
      rate,
      payableWeight: calc.payableWeight,
      baseAmount: calc.baseAmount,
      sackCount,
    });
    append({
      deductionTypeId: dt.id,
      name: dt.name,
      calculationType,
      impactType: dt.impactType,
      quantity: Math.round(qty * 100) / 100,
      rate,
      amount: Math.round(amount),
    });
  };

  const addDeduction = () => {
    if (!applicableTypes || applicableTypes.length === 0) {
      toast.error("Belum ada jenis potongan aktif untuk pembelian ketela. Atur di Master → Jenis Potongan.");
      return;
    }
    appendDeductionRow(applicableTypes[0]);
  };

  const onSubmit = async (data: any) => {
    try {
      const finalNumber = await generateCustomDocumentNumber("PURCHASE", purchasePrefix);
      await createPurchaseTransaction({
        ...data,
        number: finalNumber,
        supplierId: Number(data.supplierId),
        rawMaterialId: Number(data.rawMaterialId),
        warehouseId: Number(data.warehouseId),
        grossWeight: Number(data.grossWeight),
        tareWeight: Number(data.tareWeight),
        sackCount: Number(data.sackCount),
        policeNumber: data.policeNumber || undefined,
        poNumber: data.poNumber || undefined,
        entryTime: data.entryTime || undefined,
        exitDate: data.exitDate || undefined,
        exitTime: data.exitTime || undefined,
        refactionPercent: Number(data.refactionPercent),
        pricePerKg: Number(data.pricePerKg),
        deductions: data.deductions.map((d: any) => ({
          deductionTypeId: Number(d.deductionTypeId),
          name: d.name,
          calculationType: d.calculationType,
          impactType: d.impactType,
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

  const kgPerSack = sackCount > 0 ? calc.payableWeight / sackCount : 0;

  const fillExample = () => {
    setValue("grossWeight", 3476);
    setValue("tareWeight", 0);
    setValue("refactionPercent", 0);
    setValue("sackCount", 37);
    setValue("pricePerKg", 14400);
    const picks = applicableTypes.filter((d) => d.code === "DED-002" || d.code === "DED-003");
    if (picks.length > 0) {
      replace(
        picks.map((dt) => {
          const rate = Number(dt.defaultValue) || 0;
          return {
            deductionTypeId: dt.id,
            name: dt.name,
            calculationType: dt.calculationType,
            impactType: dt.impactType,
            quantity: 37,
            rate,
            amount: 37 * rate,
          };
        })
      );
    }
  };

  const rowHint = (d?: DeductionRow) => {
    if (!d) return "";
    const qty = Number(d.quantity) || 0;
    const rate = Number(d.rate) || 0;
    if (d.calculationType === "per_sack")
      return `${qty.toLocaleString("id-ID")} sak × Rp ${rate.toLocaleString("id-ID")}`;
    if (d.calculationType === "per_kg")
      return `${qty.toLocaleString("id-ID")} Kg × Rp ${rate.toLocaleString("id-ID")}`;
    if (d.calculationType === "percentage")
      return `${rate.toLocaleString("id-ID")}% × Rp ${calc.baseAmount.toLocaleString("id-ID")}`;
    return "Nominal tetap";
  };

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="shadow-sm">
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label>No. Polisi</Label>
                <Input {...register("policeNumber")} placeholder="Contoh: K 8146 JC" />
              </div>
              <div>
                <Label>No. PO / DO</Label>
                <Input {...register("poNumber")} placeholder="Opsional" />
              </div>
              <div>
                <Label>Jam Masuk</Label>
                <Input type="time" {...register("entryTime")} />
              </div>
              <div>
                <Label>Tanggal Keluar</Label>
                <Input type="date" {...register("exitDate")} />
              </div>
              <div>
                <Label>Jam Keluar</Label>
                <Input type="time" {...register("exitTime")} />
              </div>
            </div>

            <Separator />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Penimbangan & Rifaksi</p>
              <Button type="button" variant="ghost" size="sm" onClick={fillExample}>
                <Wand2 className="mr-2 h-4 w-4" /> Isi contoh (3.476 Kg)
              </Button>
            </div>
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
                <Label className="flex items-center gap-1.5"><Scale className="h-3.5 w-3.5" /> Berat Bersih / Netto (Kg)</Label>
                <Input readOnly value={calc.netWeight.toLocaleString("id-ID")} className="bg-muted font-mono font-semibold" />
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
                <Label className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> Jumlah Sak</Label>
                <Input type="number" step="1" min="0" placeholder="Contoh: 37" {...register("sackCount")} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {sackCount > 0
                    ? `≈ ${kgPerSack.toLocaleString("id-ID", { maximumFractionDigits: 2 })} Kg / sak`
                    : "Isi jumlah sak untuk potongan per sak"}
                </p>
              </div>
              <div>
                <Label>Harga / Kg (Rp)</Label>
                <Input type="number" step="0.01" {...register("pricePerKg")} />
              </div>
              <div>
                <Label>Nilai Bahan Baku (Rp)</Label>
                <Input readOnly value={calc.baseAmount.toLocaleString("id-ID")} className="bg-muted font-bold font-mono text-accent" />
              </div>
            </div>

            <Separator />
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Potongan / Biaya</p>
                <Button type="button" variant="outline" size="sm" onClick={addDeduction}>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Potongan
                </Button>
              </div>

              {fields.length === 0 && (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Belum ada potongan. Tambahkan potongan per sak, per Kg, persentase, atau nominal tetap.
                </p>
              )}

              <div className="space-y-3">
                {fields.map((field, index) => {
                  const row = watchedDeductions[index];
                  return (
                    <div key={field.id} className="space-y-2 rounded-lg border bg-muted/20 p-3">
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="min-w-[170px] flex-1">
                          <Label className="text-xs">Jenis Potongan</Label>
                          <select
                            className={selectClass}
                            {...register(`deductions.${index}.deductionTypeId`, {
                              onChange: (e) => {
                                const selected = applicableTypes.find((d) => String(d.id) === e.target.value);
                                if (!selected) return;
                                const rate = Number(selected.defaultValue) || 0;
                                setValue(`deductions.${index}.name`, selected.name);
                                setValue(`deductions.${index}.calculationType`, selected.calculationType);
                                setValue(`deductions.${index}.impactType`, selected.impactType);
                                setValue(`deductions.${index}.rate`, rate);
                                recomputeRow(index, selected.calculationType, rate);
                              },
                            })}
                          >
                            {applicableTypes.map((dt) => (
                              <option key={dt.id} value={dt.id}>
                                {dt.name} — {dt.calculationType === "per_sack" ? "per sak" : dt.calculationType === "per_kg" ? "per Kg" : dt.calculationType === "percentage" ? "%" : "tetap"}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs">Tarif (Rp)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Rate"
                            className="w-28"
                            {...register(`deductions.${index}.rate`, {
                              onChange: (e) => {
                                recomputeRow(index, watchedDeductions[index]?.calculationType ?? "fixed", Number(e.target.value) || 0);
                              },
                            })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">
                            {row?.calculationType === "per_sack" ? "Jml Sak" : row?.calculationType === "per_kg" ? "Kg" : "Qty"}
                          </Label>
                          <Input
                            type="number"
                            className="w-24 bg-muted font-mono"
                            readOnly
                            {...register(`deductions.${index}.quantity`)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Jumlah (Rp)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            className="w-32 font-mono"
                            {...register(`deductions.${index}.amount`, { valueAsNumber: true })}
                          />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="flex flex-wrap items-center gap-2 pl-1 text-xs text-muted-foreground">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            row?.impactType === "PURCHASE_COST"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                          }`}
                        >
                          {row?.impactType === "PURCHASE_COST" ? "Biaya (+)" : "Potongan (−)"}
                        </span>
                        <span>Hitungan: {rowHint(row)} = Rp {(Number(row?.amount) || 0).toLocaleString("id-ID")}</span>
                      </p>
                    </div>
                  );
                })}
              </div>

              {fields.length > 0 && (
                <div className="mt-3 space-y-1 text-right text-sm">
                  <div>
                    Total Potongan: <span className="font-bold font-mono">Rp {calc.totalDeductions.toLocaleString("id-ID")}</span>
                  </div>
                  {calc.totalCosts > 0 && (
                    <div>
                      Total Biaya:{" "}
                      <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                        + Rp {calc.totalCosts.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-primary/5 p-4 flex items-center justify-between">
              <span className="font-semibold">Total Pembayaran:</span>
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

      {/* Ringkasan Nota */}
      <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4" /> Ringkasan Nota
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Berat bersih</span>
              <span className="font-mono font-semibold">{calc.netWeight.toLocaleString("id-ID")} Kg</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Berat dibayar</span>
              <span className="font-mono font-semibold">{calc.payableWeight.toLocaleString("id-ID")} Kg</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Harga / Kg</span>
              <span className="font-mono">Rp {pricePerKg.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Jumlah sak</span>
              <span className="font-mono">{sackCount.toLocaleString("id-ID")} sak</span>
            </div>

            <Separator className="my-2" />

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Nilai bahan baku</span>
              <span className="font-mono">Rp {calc.baseAmount.toLocaleString("id-ID")}</span>
            </div>

            {watchedDeductions.length > 0 && (
              <div className="space-y-1 rounded-lg bg-muted/40 p-2">
                {watchedDeductions.map((d, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {d.impactType === "PURCHASE_COST" ? "+ " : "− "}
                      {rowHint(d as DeductionRow)}
                    </span>
                    <span
                      className={`whitespace-nowrap font-mono ${
                        d.impactType === "PURCHASE_COST" ? "text-amber-600 dark:text-amber-400" : ""
                      }`}
                    >
                      {d.impactType === "PURCHASE_COST" ? "+" : "−"} Rp {(Number(d.amount) || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t pt-1 text-xs font-medium">
                  <span>Total potongan</span>
                  <span className="font-mono">− Rp {calc.totalDeductions.toLocaleString("id-ID")}</span>
                </div>
                {calc.totalCosts > 0 && (
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span>Total biaya</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400">
                      + Rp {calc.totalCosts.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
              </div>
            )}

            <Separator className="my-2" />

            <div className="flex items-center justify-between">
              <span className="font-semibold">Total Pembayaran</span>
              <span className="font-mono text-lg font-bold text-accent">Rp {calc.netAmount.toLocaleString("id-ID")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed bg-muted/20 shadow-none">
          <CardContent className="space-y-1 pt-4 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5 font-semibold text-foreground">
              <Percent className="h-3.5 w-3.5" /> Contoh perhitungan
            </p>
            <p>Berat bersih 3.476 Kg × Rp 14.400 = Rp 50.054.400</p>
            <p>Potongan sak: jumlah sak × Rp 4.000</p>
            <p className="text-[11px]">
              Jenis potongan diambil dari master yang berlaku untuk pembelian ketela.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
