"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createProductionBatch, getRawMaterialUnitCosts } from "@/actions/production-actions";
import { generateDocumentNumber } from "@/actions/numbering-actions";
import { useEffect } from "react";
import { getProducts, getWarehouses } from "@/actions/master-actions";
import { getStockBalances } from "@/actions/warehouse-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { calculateHpp } from "@/lib/calculations/production";
import { Plus, Trash2, AlertTriangle, PackageCheck } from "lucide-react";

const COST_CATEGORIES = ["Bahan Baku", "Tenaga Kerja", "Listrik", "Reparasi", "Kemasan", "Overhead", "Lainnya"];

const schema = z.object({
  number: z.string().min(1, "Nomor batch wajib diisi"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  notes: z.string().optional(),
  inputs: z
    .array(
      z.object({
        productId: z.string().min(1, "Pilih bahan"),
        warehouseId: z.string().min(1, "Pilih gudang"),
        quantity: z.number().positive("Qty harus > 0"),
      })
    )
    .min(1, "Minimal satu input bahan"),
  outputs: z
    .array(
      z.object({
        productId: z.string().min(1, "Pilih produk"),
        warehouseId: z.string().min(1, "Pilih gudang"),
        quantity: z.number().positive("Qty harus > 0"),
        isByProduct: z.boolean(),
        pricePerUnit: z.number().min(0),
      })
    )
    .min(1, "Minimal satu output produk"),
  costs: z.array(
    z.object({
      category: z.string(),
      name: z.string().min(1, "Nama biaya wajib"),
      costType: z.string(),
      amount: z.number().positive("Jumlah harus > 0"),
    })
  ),
});

type ProductionForm = z.infer<typeof schema>;

export default function AddProductionPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    control,
    setError,
    clearErrors,
    setValue,
    formState: { errors },
  } = useForm<ProductionForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      number: "",
      date: new Date().toISOString().slice(0, 10),
      notes: "",
      inputs: [],
      outputs: [],
      costs: [],
    },
  });

  useEffect(() => {
    generateDocumentNumber("PRODUCTION").then((n) => setValue("number", n));
  }, [setValue]);

  const inputs = useFieldArray({ control, name: "inputs" });
  const outputs = useFieldArray({ control, name: "outputs" });
  const costs = useFieldArray({ control, name: "costs" });

  const { data: products } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const { data: warehouses } = useQuery({ queryKey: ["warehouses"], queryFn: getWarehouses });
  const { data: stockBalances } = useQuery({ queryKey: ["stock-balances-all"], queryFn: () => getStockBalances() });
  const { data: rawUnitCosts } = useQuery({ queryKey: ["raw-unit-costs"], queryFn: getRawMaterialUnitCosts });

  const watchedInputs = watch("inputs") || [];
  const watchedOutputs = watch("outputs") || [];
  const watchedCosts = watch("costs") || [];

  const stockFor = (warehouseId: string, productId: string) => {
    if (!warehouseId || !productId) return null;
    return stockBalances?.find((b) => b.warehouseId === Number(warehouseId) && b.productId === Number(productId));
  };

  const unitCostFor = (productId: string) => {
    if (!productId) return 0;
    return rawUnitCosts?.find((u) => u.productId === Number(productId))?.unitCost ?? 0;
  };

  const materialCost = watchedInputs.reduce((acc, i) => acc + (Number(i.quantity) || 0) * unitCostFor(i.productId), 0);
  const totalInputQty = watchedInputs.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
  const totalOutputQty = watchedOutputs.reduce((acc, o) => acc + (Number(o.quantity) || 0), 0);
  const otherCosts = watchedCosts.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const totalCost = materialCost + otherCosts;
  const byProductValue = watchedOutputs
    .filter((o) => o.isByProduct)
    .reduce((acc, o) => acc + (Number(o.quantity) || 0) * (Number(o.pricePerUnit) || 0), 0);
  const flourQty = watchedOutputs.filter((o) => !o.isByProduct).reduce((acc, o) => acc + (Number(o.quantity) || 0), 0);
  const hpp = calculateHpp(totalCost, byProductValue, flourQty);
  const yieldPercent = totalInputQty > 0 ? (flourQty / totalInputQty) * 100 : 0;
  const outputExceedsInput = totalOutputQty > totalInputQty && totalInputQty > 0;

  const onSubmit = async (data: ProductionForm) => {
    let hasStockError = false;
    data.inputs.forEach((input, idx) => {
      const stock = stockFor(input.warehouseId, input.productId);
      const available = stock ? Number(stock.balance) : 0;
      if (input.quantity > available) {
        setError(`inputs.${idx}.quantity`, {
          type: "manual",
          message: `Melebihi stok tersedia (${available.toLocaleString("id-ID")} Kg)`,
        });
        hasStockError = true;
      }
    });

    if (hasStockError) {
      toast.error("Input bahan melebihi stok gudang");
      return;
    }
    if (outputExceedsInput) {
      toast.error("Total output melebihi input bahan");
      return;
    }

    try {
      const res = await createProductionBatch({
        number: data.number,
        date: data.date,
        notes: data.notes,
        inputs: data.inputs.map((i) => ({
          productId: Number(i.productId),
          warehouseId: Number(i.warehouseId),
          quantity: Number(i.quantity),
        })),
        outputs: data.outputs.map((o) => ({
          productId: Number(o.productId),
          warehouseId: Number(o.warehouseId),
          quantity: Number(o.quantity),
          isByProduct: Boolean(o.isByProduct),
          pricePerUnit: Number(o.pricePerUnit),
        })),
        costs: [
          ...data.costs.map((c) => ({
            category: c.category,
            name: c.name,
            costType: c.costType,
            amount: Number(c.amount),
          })),
        ],
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Batch produksi berhasil disimpan");
      router.push("/production");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan batch produksi");
    }
  };

  const inputErrors = errors.inputs;

  return (
    <Card className="mx-auto max-w-4xl shadow-sm">
      <CardHeader>
        <CardTitle>Tambah Batch Produksi</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>No. Batch</Label>
              <Input {...register("number")} />
              {errors.number && <p className="mt-1 text-xs text-destructive">{errors.number.message}</p>}
            </div>
            <div>
              <Label>Tanggal</Label>
              <Input type="date" {...register("date")} />
              {errors.date && <p className="mt-1 text-xs text-destructive">{errors.date.message}</p>}
            </div>
          </div>

          <Separator />
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Input (Ketela dari Gudang)</p>
            <Button type="button" variant="outline" size="sm" onClick={() => inputs.append({ productId: "", warehouseId: "", quantity: 0 })}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Input
            </Button>
          </div>
          {inputErrors?.message && <p className="text-xs text-destructive">{inputErrors.message}</p>}
          <div className="space-y-3">
            {inputs.fields.map((f, i) => {
              const stock = stockFor(watchedInputs[i]?.warehouseId, watchedInputs[i]?.productId);
              const available = stock ? Number(stock.balance) : 0;
              const qty = Number(watchedInputs[i]?.quantity) || 0;
              const exceeds = stock && qty > available;
              const rowError = inputErrors?.[i]?.quantity;
              return (
                <div key={f.id} className={`space-y-2 rounded-lg border p-3 ${exceeds ? "border-destructive bg-destructive/5" : "bg-muted/20"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="flex h-10 min-w-[150px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      {...register(`inputs.${i}.productId`, { onChange: () => clearErrors(`inputs.${i}.quantity`) })}
                    >
                      <option value="">Pilih Bahan</option>
                      {products?.filter((p) => p.type === "RAW_MATERIAL").map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <select
                      className="flex h-10 min-w-[130px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      {...register(`inputs.${i}.warehouseId`, { onChange: () => clearErrors(`inputs.${i}.quantity`) })}
                    >
                      <option value="">Gudang</option>
                      {warehouses?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    <Input type="number" step="0.01" placeholder="Qty (Kg)" className={`w-32 ${exceeds ? "border-destructive" : ""}`} {...register(`inputs.${i}.quantity`, { valueAsNumber: true })} />
                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => inputs.remove(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pl-1 text-xs">
                    {stock ? (
                      <span className={`inline-flex items-center gap-1.5 ${exceeds ? "text-destructive font-medium" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {exceeds ? <AlertTriangle className="h-3.5 w-3.5" /> : <PackageCheck className="h-3.5 w-3.5" />}
                        Stok tersedia: {available.toLocaleString("id-ID")} {stock.productUnit}
                      </span>
                    ) : watchedInputs[i]?.warehouseId && watchedInputs[i]?.productId ? (
                      <span className="inline-flex items-center gap-1.5 text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5" /> Stok tidak tersedia di gudang ini (0 {products?.find((p) => p.id === Number(watchedInputs[i]?.productId))?.unit ?? "Kg"})
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Pilih bahan & gudang untuk melihat stok</span>
                    )}
                    {watchedInputs[i]?.productId && (
                      <span className="text-muted-foreground">
                        Harga bahan: Rp {unitCostFor(watchedInputs[i]?.productId).toLocaleString("id-ID")}/Kg
                        {watchedInputs[i]?.quantity > 0 && (
                          <> · Subtotal: Rp {((Number(watchedInputs[i]?.quantity) || 0) * unitCostFor(watchedInputs[i]?.productId)).toLocaleString("id-ID")}</>
                        )}
                      </span>
                    )}
                    {rowError && <span className="text-destructive">{rowError.message}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Output (Tepung & Ampas)</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const flour = products?.find((p) => p.type === "FINISHED_GOOD");
                  outputs.append({
                    productId: flour ? String(flour.id) : "",
                    warehouseId: warehouses?.[0] ? String(warehouses[0].id) : "",
                    quantity: 0,
                    isByProduct: false,
                    pricePerUnit: Number(flour?.defaultPrice ?? 0),
                  });
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Tepung
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const byProduct = products?.find((p) => p.type === "BY_PRODUCT");
                  outputs.append({
                    productId: byProduct ? String(byProduct.id) : "",
                    warehouseId: warehouses?.[0] ? String(warehouses[0].id) : "",
                    quantity: 0,
                    isByProduct: true,
                    pricePerUnit: Number(byProduct?.defaultPrice ?? 500),
                  });
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Ampas
              </Button>
            </div>
          </div>
          {errors.outputs?.message && <p className="text-xs text-destructive">{errors.outputs.message}</p>}
          <div className="space-y-3">
            {outputs.fields.map((f, i) => {
              const outPid = watchedOutputs[i]?.productId;
              const outProd = products?.find((p) => p.id === Number(outPid));
              const isByProduct = outProd?.type === "BY_PRODUCT";
              const outQty = Number(watchedOutputs[i]?.quantity) || 0;
              const outPrice = Number(watchedOutputs[i]?.pricePerUnit) || 0;
              return (
              <div key={f.id} className="space-y-2 rounded-lg border bg-muted/20 p-3">
                <div className="flex flex-wrap items-center gap-2">
                <select
                  className="flex h-10 min-w-[150px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register(`outputs.${i}.productId`, {
                    onChange: (e) => {
                      const prod = products?.find((p) => String(p.id) === e.target.value);
                      if (prod) {
                        setValue(`outputs.${i}.isByProduct`, prod.type === "BY_PRODUCT");
                        if (prod.type === "BY_PRODUCT" && !Number(watchedOutputs[i]?.pricePerUnit)) {
                          setValue(`outputs.${i}.pricePerUnit`, Number(prod.defaultPrice));
                        }
                      }
                    },
                  })}
                >
                  <option value="">Pilih Produk</option>
                  {products?.filter((p) => p.type === "FINISHED_GOOD" || p.type === "BY_PRODUCT").map((p) => (
                    <option key={p.id} value={p.id}>{p.name} {p.type === "BY_PRODUCT" ? "(Sampingan)" : ""}</option>
                  ))}
                </select>
                <select
                  className="flex h-10 min-w-[130px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register(`outputs.${i}.warehouseId`)}
                >
                  <option value="">Gudang</option>
                  {warehouses?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <Input type="number" step="0.01" placeholder="Qty (Kg)" className="w-28" {...register(`outputs.${i}.quantity`, { valueAsNumber: true })} />
                <Input type="number" step="0.01" placeholder="Harga/Kg" className="w-28" {...register(`outputs.${i}.pricePerUnit`, { valueAsNumber: true })} />
                <input type="hidden" {...register(`outputs.${i}.isByProduct`)} />
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${isByProduct ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"}`}>
                  {isByProduct ? "Sampingan" : "Produk Utama"}
                </span>
                <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => outputs.remove(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                </div>
                {isByProduct && outQty > 0 && (
                  <p className="pl-1 text-xs text-amber-700 dark:text-amber-400">
                    Nilai sampingan: {outQty.toLocaleString("id-ID")} Kg × Rp {outPrice.toLocaleString("id-ID")} = Rp {(outQty * outPrice).toLocaleString("id-ID")} <span className="text-muted-foreground">(mengurangi biaya produksi tepung)</span>
                  </p>
                )}
              </div>
              );
            })}
          </div>

          <Separator />
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Biaya Produksi</p>
            <Button type="button" variant="outline" size="sm" onClick={() => costs.append({ category: "Tenaga Kerja", name: "", costType: "direct", amount: 0 })}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Biaya
            </Button>
          </div>
          <div className="space-y-3">
            {costs.fields.map((f, i) => (
              <div key={f.id} className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-3">
                <select className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...register(`costs.${i}.category`)}>
                  {COST_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <Input placeholder="Nama biaya" className="min-w-[150px] flex-1" {...register(`costs.${i}.name`)} />
                <select className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...register(`costs.${i}.costType`)}>
                  <option value="direct">Direct</option>
                  <option value="indirect">Indirect</option>
                </select>
                <Input type="number" step="0.01" placeholder="Rp" className="w-36" {...register(`costs.${i}.amount`, { valueAsNumber: true })} />
                <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => costs.remove(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Separator />
          <div className="space-y-3 rounded-xl border bg-primary/5 p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Nilai Bahan Baku</p>
                <p className="font-mono font-bold">Rp {materialCost.toLocaleString("id-ID")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Biaya Operasional</p>
                <p className="font-mono font-bold">Rp {otherCosts.toLocaleString("id-ID")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Biaya Produksi</p>
                <p className="font-mono font-bold">Rp {totalCost.toLocaleString("id-ID")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nilai Ampas</p>
                <p className="font-mono font-bold">Rp {byProductValue.toLocaleString("id-ID")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cost Tepung</p>
                <p className="font-mono font-bold">Rp {hpp.netFlourCost.toLocaleString("id-ID")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Qty Tepung</p>
                <p className="font-mono font-bold">{flourQty.toLocaleString("id-ID")} Kg</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Yield Tepung</p>
                <p className={`font-mono font-bold ${outputExceedsInput ? "text-destructive" : "text-accent"}`}>
                  {yieldPercent.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">HPP Tepung / Kg</p>
                <p className="font-mono text-lg font-bold text-accent">Rp {Math.round(hpp.hppPerKg).toLocaleString("id-ID")}</p>
              </div>
            </div>
            {outputExceedsInput && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" /> Total output ({totalOutputQty.toLocaleString("id-ID")} Kg) melebihi total input bahan ({totalInputQty.toLocaleString("id-ID")} Kg)
              </p>
            )}
            {!outputExceedsInput && totalInputQty > 0 && totalOutputQty > 0 && (
              <p className="text-xs text-muted-foreground">
                Mass balance: Input {totalInputQty.toLocaleString("id-ID")} Kg → Output {totalOutputQty.toLocaleString("id-ID")} Kg (susut {Math.max(0, totalInputQty - totalOutputQty).toLocaleString("id-ID")} Kg)
              </p>
            )}
          </div>

          <div>
            <Label>Keterangan</Label>
            <Input {...register("notes")} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => router.back()}>Batal</Button>
            <Button type="submit">Simpan & Posting</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
