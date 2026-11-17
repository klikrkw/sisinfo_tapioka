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
import Link from "next/link";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import {
  calculatePurchaseWeightFromSackRefaction,
  calculatePurchaseAmount,
  calculateDeductionAmount,
  calculateDeductionQuantity,
  splitDeductions,
} from "@/lib/calculations/purchasing";
import { useEffect, useMemo } from "react";
import { Plus, Trash2, Scale, Package, Percent, Receipt, Wand2, Boxes } from "lucide-react";
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

export default function AddFinishedPurchasePage() {
  const router = useRouter();
  const { register, handleSubmit, watch, control, setValue } = useForm({
    defaultValues: {
      number: "",
      date: new Date().toISOString().slice(0, 10),
      supplierId: "",
      productId: "",
      warehouseId: "",
      grossWeight: 0,
      tareWeight: 0,
      sackCount: 0,
      refactionPerSack: 0,
      policeNumber: "",
      poNumber: "",
      entryTime: "",
      exitDate: "",
      exitTime: "",
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
    () => (dedTypes ?? []).filter((d) => d.appliesTo === "FINISHED_GOOD" || d.appliesTo === "BOTH"),
    [dedTypes]
  );
  const { data: sequences } = useQuery({ queryKey: ["documentSequences"], queryFn: getDocumentSequences });

  const finishedProducts = useMemo(
    () => products?.filter((p) => p.type === "FINISHED_GOOD" || p.type === "BY_PRODUCT") ?? [],
    [products]
  );

  const docPrefix = useMemo(() => {
    const seq = sequences?.find((s) => s.docType === "PURCHASE_FINISHED");
    return seq?.prefix ?? "PBF";
  }, [sequences]);

  useEffect(() => {
    peekCustomDocumentNumber("PURCHASE_FINISHED", docPrefix).then((n) => setValue("number", n));
  }, [setValue, docPrefix]);

  const grossWeight = Number(watch("grossWeight")) || 0;
  const tareWeight = Number(watch("tareWeight")) || 0;
  const sackCount = Number(watch("sackCount")) || 0;
  const refactionPerSack = Number(watch("refactionPerSack")) || 0;
  const pricePerKg = Number(watch("pricePerKg")) || 0;
  const watchedDeductions = useWatch({ control, name: "deductions" }) ?? [];

  const calc = useMemo(() => {
    const w = calculatePurchaseWeightFromSackRefaction(grossWeight, tareWeight, sackCount, refactionPerSack);
    const { deductions: totalDeductions, costs: totalCosts } = splitDeductions(watchedDeductions);
    const a = calculatePurchaseAmount(w.payableWeight, pricePerKg, totalDeductions, totalCosts);
    return { ...w, ...a, totalDeductions, totalCosts };
  }, [grossWeight, tareWeight, sackCount, refactionPerSack, pricePerKg, watchedDeductions]);

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
    const qty = calculateDeductionQuantity({ calculationType, payableWeight: calc.payableWeight, sackCount });
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

  const onSubmit = async (data: any) => {
    if (!data.productId) {
      toast.error("Pilih produk jadi terlebih dahulu");
      return;
    }
    try {
      const finalNumber = await generateCustomDocumentNumber("PURCHASE_FINISHED", docPrefix);
      await createPurchaseTransaction({
        ...data,
        number: finalNumber,
        purchaseType: "FINISHED_GOOD",
        supplierId: Number(data.supplierId),
        rawMaterialId: Number(data.productId),
        warehouseId: Number(data.warehouseId),
        grossWeight: Number(data.grossWeight),
        tareWeight: Number(data.tareWeight),
        sackCount: Number(data.sackCount),
        policeNumber: data.policeNumber || undefined,
        poNumber: data.poNumber || undefined,
        entryTime: data.entryTime || undefined,
        exitDate: data.exitDate || undefined,
        exitTime: data.exitTime || undefined,
        refactionPercent: Math.round(calc.refactionPercent * 100) / 100,
        refactionWeight: Math.round(calc.refactionWeight * 100) / 100,
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
      toast.success("Pembelian produk jadi berhasil disimpan");
      router.push("/purchasing/finished");
    } catch {
      toast.error("Gagal menyimpan pembelian produk jadi");
    }
  };

  const fillExample = () => {
    setValue("grossWeight", 3476);
    setValue("tareWeight", 0);
    setValue("refactionPerSack", 0);
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

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const kgPerSack = sackCount > 0 ? calc.payableWeight / sackCount : 0;

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

  const potTypes = applicableTypes.filter((d) => d.impactType !== "PURCHASE_COST");
  const costTypes = applicableTypes.filter((d) => d.impactType === "PURCHASE_COST");

  const addPotongan = () => {
    if (!potTypes[0]) {
      toast.error("Belum ada jenis potongan aktif. Aktifkan di Master → Jenis Potongan.");
      return;
    }
    appendDeductionRow(potTypes[0]);
  };

  const addCost = () => {
    if (!costTypes[0]) {
      toast.error("Belum ada jenis biaya (PURCHASE_COST) aktif. Aktifkan di Master → Jenis Potongan.");
      return;
    }
    appendDeductionRow(costTypes[0]);
  };

  const rowEntries = fields.map((field, index) => ({ field, index }));
  const potRows = rowEntries.filter(({ index }) => watchedDeductions[index]?.impactType !== "PURCHASE_COST");
  const costRows = rowEntries.filter(({ index }) => watchedDeductions[index]?.impactType === "PURCHASE_COST");

  const renderDeductionRow = (
    fieldId: string,
    index: number,
    list: { id: number; name: string; calculationType: string; impactType: string }[]
  ) => {
    const row = watchedDeductions[index];
    const isCost = row?.impactType === "PURCHASE_COST";
    return (
      <div
        key={fieldId}
        className={`space-y-2 rounded-lg border p-3 ${
          isCost ? "border-amber-300/70 bg-amber-50/40 dark:border-amber-500/30 dark:bg-amber-500/5" : "bg-muted/20"
        }`}
      >
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[170px] flex-1">
            <Label className="text-xs">{isCost ? "Jenis Biaya" : "Jenis Potongan"}</Label>
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
              {list.map((dt) => (
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
            <Input type="number" className="w-24 bg-muted font-mono" readOnly {...register(`deductions.${index}.quantity`)} />
          </div>
          <div>
            <Label className="text-xs">{isCost ? "Jumlah Biaya (Rp)" : "Jumlah (Rp)"}</Label>
            <Input
              type="number"
              step="0.01"
              className={`w-32 font-mono ${isCost ? "border-amber-400/70" : ""}`}
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
              isCost
                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
            }`}
          >
            {isCost ? "Biaya (+)" : "Potongan (−)"}
          </span>
          <span>Hitungan: {rowHint(row)} = Rp {(Number(row?.amount) || 0).toLocaleString("id-ID")}</span>
        </p>
      </div>
    );
  };

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Boxes className="h-5 w-5" /> Tambah Pembelian Produk Jadi (Tapioka)
          </CardTitle>
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
                <Label>Supplier / Penjual</Label>
                <select className={selectClass} {...register("supplierId", { required: true })}>
                  <option value="">Pilih Supplier</option>
                  {suppliers?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Produk Jadi</Label>
                <select
                  className={selectClass}
                  {...register("productId", {
                    required: true,
                    onChange: (e) => {
                      const prod = finishedProducts.find((p) => String(p.id) === e.target.value);
                      if (prod) {
                        setValue("pricePerKg", Number(prod.defaultPrice));
                      }
                    },
                  })}
                >
                  <option value="">Pilih Produk</option>
                  {finishedProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit})
                    </option>
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
                <Label className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> Jumlah Sak</Label>
                <Input type="number" step="1" min="0" placeholder="Contoh: 45" {...register("sackCount")} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {sackCount > 0
                    ? `≈ ${kgPerSack.toLocaleString("id-ID", { maximumFractionDigits: 2 })} Kg / sak`
                    : "Isi jumlah sak untuk potongan per sak"}
                </p>
              </div>
              <div>
                <Label>Rifaksi / Sak (Kg)</Label>
                <Input type="number" step="0.01" min="0" placeholder="Contoh: 2" {...register("refactionPerSack")} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {sackCount > 0 && refactionPerSack > 0
                    ? `Total rifaksi = ${sackCount.toLocaleString("id-ID")} sak × ${refactionPerSack.toLocaleString("id-ID", { maximumFractionDigits: 2 })} Kg`
                    : "Rifaksi dihitung dari jumlah sak"}
                </p>
              </div>
              <div>
                <Label>Total Rifaksi (Kg)</Label>
                <Input readOnly value={calc.refactionWeight.toLocaleString("id-ID", { maximumFractionDigits: 2 })} className="bg-muted font-mono" />
                <p className="mt-1 text-xs text-muted-foreground">Otomatis: jumlah sak × rifaksi / sak</p>
              </div>
              <div>
                <Label>Rifaksi (%)</Label>
                <Input
                  readOnly
                  value={calc.refactionPercent.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                  className="bg-muted font-mono"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {calc.netWeight > 0
                    ? calc.refactionWeight > calc.netWeight
                      ? "Total rifaksi melebihi berat netto"
                      : `= ${calc.refactionWeight.toLocaleString("id-ID", { maximumFractionDigits: 2 })} ÷ ${calc.netWeight.toLocaleString("id-ID")} × 100`
                    : "Otomatis: total rifaksi ÷ netto × 100"}
                </p>
              </div>
              <div>
                <Label>Berat Dibayar (Kg)</Label>
                <Input readOnly value={calc.payableWeight.toLocaleString("id-ID")} className="bg-muted font-bold font-mono" />
              </div>
              <div>
                <Label>Harga / Kg (Rp)</Label>
                <Input type="number" step="0.01" {...register("pricePerKg")} />
              </div>
              <div>
                <Label>Nilai Produk (Rp)</Label>
                <Input readOnly value={calc.baseAmount.toLocaleString("id-ID")} className="bg-muted font-bold font-mono text-accent" />
              </div>
            </div>

            <Separator />
            {/* ===== Potongan ===== */}
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Potongan (Mengurangi)</p>
                  <p className="text-xs text-muted-foreground">Potongan yang mengurangi pembayaran ke supplier.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/master/deductions" className="text-xs font-medium text-accent hover:underline">
                    Kelola di master
                  </Link>
                  <Button type="button" variant="outline" size="sm" onClick={addPotongan}>
                    <Plus className="mr-2 h-4 w-4" /> Tambah Potongan
                  </Button>
                </div>
              </div>

              {potRows.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Belum ada potongan. Tambahkan potongan per sak, per Kg, persentase, atau nominal tetap.
                </p>
              ) : (
                <div className="space-y-3">
                  {potRows.map(({ field, index }) => renderDeductionRow(field.id, index, potTypes))}
                </div>
              )}

              {potRows.length > 0 && (
                <div className="mt-3 text-right text-sm">
                  Total Potongan:{" "}
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    − Rp {calc.totalDeductions.toLocaleString("id-ID")}
                  </span>
                </div>
              )}
            </div>

            {/* ===== Biaya Tambahan (PURCHASE_COST) ===== */}
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Biaya Tambahan (Cost)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Jenis biaya dengan dampak <span className="font-mono">PURCHASE_COST</span> — menambah total pembelian.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/master/deductions" className="text-xs font-medium text-accent hover:underline">
                    Kelola di master
                  </Link>
                  <Button type="button" variant="secondary" size="sm" onClick={addCost}>
                    <Plus className="mr-2 h-4 w-4" /> Tambah Biaya
                  </Button>
                </div>
              </div>

              {costTypes.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {costTypes.map((dt) => (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => appendDeductionRow(dt)}
                      className="rounded-full border border-amber-300/70 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
                    >
                      + {dt.name} · Rp {Number(dt.defaultValue || 0).toLocaleString("id-ID")}
                      {dt.calculationType === "per_sack"
                        ? "/sak"
                        : dt.calculationType === "per_kg"
                          ? "/Kg"
                          : dt.calculationType === "percentage"
                            ? "%"
                            : ""}
                    </button>
                  ))}
                </div>
              )}

              {costRows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-amber-300/70 p-4 text-center text-sm text-muted-foreground dark:border-amber-500/30">
                  Belum ada biaya tambahan. Jenis biaya diambil dari{" "}
                  <Link href="/master/deductions" className="font-medium text-accent hover:underline">
                    Master Jenis Potongan
                  </Link>{" "}
                  dengan dampak <span className="font-mono">PURCHASE_COST</span> (contoh: Manol Fee Rp 7.500/sak).
                </p>
              ) : (
                <div className="space-y-3">
                  {costRows.map(({ field, index }) => renderDeductionRow(field.id, index, costTypes))}
                </div>
              )}

              {costRows.length > 0 && (
                <div className="mt-3 text-right text-sm">
                  Total Biaya Tambahan:{" "}
                  <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                    + Rp {calc.totalCosts.toLocaleString("id-ID")}
                  </span>
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
              <Button type="submit">Simpan Pembelian</Button>
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
            {calc.refactionWeight > 0 && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Rifaksi</span>
                  <span className="font-mono">
                    {sackCount.toLocaleString("id-ID")} sak × {refactionPerSack.toLocaleString("id-ID", { maximumFractionDigits: 2 })} Kg
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total rifaksi</span>
                  <span className="font-mono">
                    {calc.refactionWeight.toLocaleString("id-ID", { maximumFractionDigits: 2 })} Kg ·{" "}
                    {calc.refactionPercent.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%
                  </span>
                </div>
              </>
            )}
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
              <span className="text-muted-foreground">Nilai produk</span>
              <span className="font-mono">Rp {calc.baseAmount.toLocaleString("id-ID")}</span>
            </div>

            {watchedDeductions.length > 0 && (
              <div className="space-y-1 rounded-lg bg-muted/40 p-2">
                {watchedDeductions.filter((d) => d.impactType !== "PURCHASE_COST").length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Potongan</p>
                    {watchedDeductions
                      .filter((d) => d.impactType !== "PURCHASE_COST")
                      .map((d, i) => (
                        <div key={`pot-${i}`} className="flex items-start justify-between gap-2 text-xs">
                          <span className="text-muted-foreground">{rowHint(d as DeductionRow)}</span>
                          <span className="whitespace-nowrap font-mono">
                            − Rp {(Number(d.amount) || 0).toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))}
                    <div className="flex items-center justify-between border-t pt-1 text-xs font-medium">
                      <span>Total potongan</span>
                      <span className="font-mono">− Rp {calc.totalDeductions.toLocaleString("id-ID")}</span>
                    </div>
                  </>
                )}

                {watchedDeductions.filter((d) => d.impactType === "PURCHASE_COST").length > 0 && (
                  <>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Biaya Tambahan
                    </p>
                    {watchedDeductions
                      .filter((d) => d.impactType === "PURCHASE_COST")
                      .map((d, i) => (
                        <div key={`cost-${i}`} className="flex items-start justify-between gap-2 text-xs">
                          <span className="text-muted-foreground">{rowHint(d as DeductionRow)}</span>
                          <span className="whitespace-nowrap font-mono text-amber-600 dark:text-amber-400">
                            + Rp {(Number(d.amount) || 0).toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))}
                    <div className="flex items-center justify-between border-t pt-1 text-xs font-medium">
                      <span>Total biaya</span>
                      <span className="font-mono text-amber-600 dark:text-amber-400">
                        + Rp {calc.totalCosts.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </>
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
            <p>Berat bersih 4.500 Kg × Rp 14.400 = Rp 64.800.000</p>
            <p>Total rifaksi = 45 sak × 2 Kg = 90 Kg</p>
            <p>Rifaksi (%) = 90 ÷ 4.500 × 100 = 2%</p>
            <p>Berat dibayar = 4.500 − 90 = 4.410 Kg</p>
            <p>Potongan sak: jumlah sak × Rp 4.000</p>
            <p>Manol Fee: jumlah sak × Rp 7.500</p>
            <p className="text-[11px]">
              Stok produk jadi bertambah otomatis di gudang tujuan setelah transaksi disimpan.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
