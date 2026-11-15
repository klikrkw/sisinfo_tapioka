"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
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
import {
  calculatePurchaseWeight,
  calculatePurchaseAmount,
  calculateDeductionAmount,
  calculateDeductionQuantity,
  splitDeductions,
} from "@/lib/calculations/purchasing";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Lock, FileText } from "lucide-react";
import { getCompanySettings } from "@/actions/settings-actions";
import {
  PurchaseReceiptDialog,
  type PurchaseReceiptData,
} from "@/components/purchasing/purchase-receipt-dialog";

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
      sackCount: 0,
      policeNumber: "",
      poNumber: "",
      entryTime: "",
      exitDate: "",
      exitTime: "",
      refactionPercent: 0,
      pricePerKg: 0,
      notes: "",
      deductions: [] as { deductionTypeId: number; name: string; calculationType: string; impactType: string; quantity: number; rate: number; amount: number }[],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "deductions" });

  const { data: suppliers } = useQuery({ queryKey: ["suppliers"], queryFn: getSuppliers });
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const { data: warehouses } = useQuery({ queryKey: ["warehouses"], queryFn: getWarehouses });
  const { data: dedTypes } = useQuery({ queryKey: ["deductionTypes"], queryFn: getDeductionTypes });
  const applicableTypes = useMemo(
    () =>
      (dedTypes ?? []).filter(
        (d) =>
          d.appliesTo === "BOTH" ||
          d.appliesTo === (purchase?.purchaseType === "FINISHED_GOOD" ? "FINISHED_GOOD" : "RAW_MATERIAL")
      ),
    [dedTypes, purchase?.purchaseType]
  );
  const { data: company } = useQuery({ queryKey: ["companySettings"], queryFn: getCompanySettings });

  const [receiptOpen, setReceiptOpen] = useState(false);
  const initializedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!purchase) return;
    // Tunggu master data selesai dimuat, agar nilai select tidak jatuh ke placeholder.
    if (!suppliers || !products || !warehouses) return;
    if (initializedRef.current === purchase.id) return;

    reset({
      number: purchase.number,
      date: purchase.date ? new Date(purchase.date).toISOString().slice(0, 10) : "",
      supplierId: String(purchase.supplierId),
      rawMaterialId: String(purchase.rawMaterialId),
      warehouseId: String(purchase.warehouseId),
      grossWeight: Number(purchase.grossWeight),
      tareWeight: Number(purchase.tareWeight),
      sackCount: Number(purchase.sackCount ?? 0),
      policeNumber: purchase.policeNumber ?? "",
      poNumber: purchase.poNumber ?? "",
      entryTime: purchase.entryTime ?? "",
      exitDate: purchase.exitDate ? new Date(purchase.exitDate).toISOString().slice(0, 10) : "",
      exitTime: purchase.exitTime ?? "",
      refactionPercent: Number(purchase.refactionPercent),
      pricePerKg: Number(purchase.pricePerKg),
      notes: purchase.notes ?? "",
      deductions: (purchase.deductions ?? []).map((d) => ({
        deductionTypeId: d.deductionTypeId,
        name: d.name,
        calculationType: d.calculationType,
        impactType: d.impactType,
        quantity: Number(d.quantity),
        rate: Number(d.rate),
        amount: Number(d.amount),
      })),
    });
    initializedRef.current = purchase.id;
  }, [purchase, suppliers, products, warehouses, reset]);

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

  const isPosted = purchase && purchase.status !== "Draft";

  const deductionHint = (d?: { calculationType?: string; quantity?: number | string; rate?: number | string }) => {
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

  const watchedNumber = watch("number");
  const watchedDate = watch("date");
  const watchedSupplierId = watch("supplierId");
  const watchedRawMaterialId = watch("rawMaterialId");
  const watchedPoliceNumber = watch("policeNumber");
  const watchedPoNumber = watch("poNumber");
  const watchedEntryTime = watch("entryTime");
  const watchedExitDate = watch("exitDate");
  const watchedExitTime = watch("exitTime");

  const supplierName = useMemo(
    () => suppliers?.find((s) => String(s.id) === String(watchedSupplierId))?.name ?? "-",
    [suppliers, watchedSupplierId]
  );
  const materialName = useMemo(
    () => products?.find((p) => String(p.id) === String(watchedRawMaterialId))?.name ?? "-",
    [products, watchedRawMaterialId]
  );

  const receiptData = useMemo<PurchaseReceiptData | null>(() => {
    if (!purchase) return null;
    return {
      number: watchedNumber || purchase.number,
      date: watchedDate || (purchase.date ? String(purchase.date) : ""),
      supplierName,
      materialName,
      grossWeight,
      tareWeight,
      netWeight: calc.netWeight,
      refactionWeight: calc.refactionWeight,
      payableWeight: calc.payableWeight,
      sackCount,
      deductions: watchedDeductions.map((d) => ({
        name: d.name,
        calculationType: d.calculationType,
        impactType: d.impactType,
        quantity: Number(d.quantity) || 0,
        rate: Number(d.rate) || 0,
        amount: Number(d.amount) || 0,
      })),
      pricePerKg,
      baseAmount: calc.baseAmount,
      policeNumber: watchedPoliceNumber || undefined,
      poNumber: watchedPoNumber || undefined,
      entryTime: watchedEntryTime || undefined,
      exitDate: watchedExitDate || undefined,
      exitTime: watchedExitTime || undefined,
      companyName: company?.name ?? undefined,
      companyAddress: company?.address ?? undefined,
      companyPhone: company?.phone ?? undefined,
    };
  }, [
    purchase,
    watchedNumber,
    watchedDate,
    supplierName,
    materialName,
    grossWeight,
    tareWeight,
    calc,
    sackCount,
    watchedDeductions,
    pricePerKg,
    watchedPoliceNumber,
    watchedPoNumber,
    watchedEntryTime,
    watchedExitDate,
    watchedExitTime,
    company,
  ]);

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
      toast.error("Belum ada jenis potongan aktif untuk transaksi ini. Atur di Master → Jenis Potongan.");
      return;
    }
    appendDeductionRow(applicableTypes[0]);
  };

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
        policeNumber: data.policeNumber || undefined,
        poNumber: data.poNumber || undefined,
        entryTime: data.entryTime || undefined,
        exitDate: data.exitDate || undefined,
        exitTime: data.exitTime || undefined,
        refactionPercent: Number(data.refactionPercent),
        pricePerKg: Number(data.pricePerKg),
        sackCount: Number(data.sackCount),
        notes: data.notes,
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
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setReceiptOpen(true)}>
            <FileText className="h-4 w-4" /> Nota
          </Button>
          <Badge variant={isPosted ? "secondary" : "outline"}>{purchase.status}</Badge>
        </div>
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
                <Label>Jumlah Sak</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="Contoh: 37"
                  {...register("sackCount", {
                    onChange: (e) => {
                      const sc = Number(e.target.value) || 0;
                      watchedDeductions.forEach((d, i) => {
                        if (d?.calculationType !== "per_sack") return;
                        const rate = Number(d.rate) || 0;
                        setValue(`deductions.${i}.quantity`, sc);
                        setValue(`deductions.${i}.amount`, Math.round(sc * rate));
                      });
                    },
                  })}
                />
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
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Potongan Lain / Biaya</p>
                <Button type="button" variant="outline" size="sm" onClick={addDeduction}>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Potongan
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
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
                          {(() => {
                            const rowTypeId = Number(watchedDeductions[index]?.deductionTypeId);
                            const base = applicableTypes.some((d) => d.id === rowTypeId)
                              ? applicableTypes
                              : [
                                  ...applicableTypes,
                                  ...(dedTypes ?? []).filter((d) => d.id === rowTypeId),
                                ];
                            return base.map((dt) => (
                              <option key={dt.id} value={dt.id}>
                                {dt.name} — {dt.calculationType === "per_sack" ? "per sak" : dt.calculationType === "per_kg" ? "per Kg" : dt.calculationType === "percentage" ? "%" : "tetap"}
                              </option>
                            ));
                          })()}
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
                          {watchedDeductions[index]?.calculationType === "per_sack"
                            ? "Jml Sak"
                            : watchedDeductions[index]?.calculationType === "per_kg"
                              ? "Kg"
                              : "Qty"}
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
                          watchedDeductions[index]?.impactType === "PURCHASE_COST"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                        }`}
                      >
                        {watchedDeductions[index]?.impactType === "PURCHASE_COST" ? "Biaya (+)" : "Potongan (−)"}
                      </span>
                      <span>
                        Hitungan: {deductionHint(watchedDeductions[index])} = Rp {(Number(watchedDeductions[index]?.amount) || 0).toLocaleString("id-ID")}
                      </span>
                    </p>
                  </div>
                ))}
                {fields.length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum ada potongan.</p>
                )}
              </div>

              {fields.length > 0 && (
                <div className="mt-3 space-y-1 text-right text-sm">
                  <div>
                    Total Potongan: <span className="font-mono font-bold">Rp {calc.totalDeductions.toLocaleString("id-ID")}</span>
                  </div>
                  {calc.totalCosts > 0 && (
                    <div>
                      Total Biaya:{" "}
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        + Rp {calc.totalCosts.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl border bg-primary/5 p-4">
              <span className="font-semibold">Total Pembayaran:</span>
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

      <PurchaseReceiptDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        data={receiptData}
      />
    </Card>
  );
}
