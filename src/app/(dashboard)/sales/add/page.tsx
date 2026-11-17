"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { createSale } from "@/actions/sales-actions";
import { peekCustomDocumentNumber, generateCustomDocumentNumber } from "@/actions/numbering-actions";
import { getDocumentSequences } from "@/actions/settings-actions";
import { getProducts, getWarehouses } from "@/actions/master-actions";
import { getStockBalances } from "@/actions/warehouse-actions";
import { getProductUnitCosts } from "@/actions/costing-actions";
import { getCustomers } from "@/actions/master-others";
import { getBrands, createBrand } from "@/actions/brand-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, AlertTriangle, PackageCheck, Tag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const NEW_BRAND = "__new";

export default function AddSalePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [brandDialogIndex, setBrandDialogIndex] = useState<number | null>(null);
  const [newBrandName, setNewBrandName] = useState("");
  const [savingBrand, setSavingBrand] = useState(false);

  const { register, handleSubmit, watch, control, setValue } = useForm({
    defaultValues: {
      number: "",
      date: new Date().toISOString().slice(0, 10),
      customerId: "",
      warehouseId: "",
      paymentMethod: "Cash",
      termDays: 0,
      notes: "",
      items: [] as { productId: string; brandId: string; quantity: number; weight: number; price: number; discount: number }[],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const { data: customers } = useQuery({ queryKey: ["customers"], queryFn: getCustomers });
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const { data: warehouses } = useQuery({ queryKey: ["warehouses"], queryFn: getWarehouses });
  const { data: stockBalances } = useQuery({ queryKey: ["stock-balances-all"], queryFn: () => getStockBalances() });
  const { data: hppMap } = useQuery({ queryKey: ["product-unit-costs"], queryFn: getProductUnitCosts });
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: () => getBrands() });
  const { data: sequences } = useQuery({ queryKey: ["documentSequences"], queryFn: getDocumentSequences });

  const salesPrefix = useMemo(() => {
    const seq = sequences?.find((s) => s.docType === "SALES");
    return seq?.prefix ?? "PJ";
  }, [sequences]);

  useEffect(() => {
    peekCustomDocumentNumber("SALES", salesPrefix).then((n) => setValue("number", n));
  }, [setValue, salesPrefix]);

  const hppFor = (productId: string | number) => hppMap?.[Number(productId)]?.unitCost ?? 0;
  const costInfoFor = (productId: string | number) => hppMap?.[Number(productId)];

  const selectedWarehouseId = watch("warehouseId");
  const stockFor = (productId: string | number) => {
    if (!selectedWarehouseId || !productId) return null;
    return stockBalances?.find(
      (b) => b.warehouseId === Number(selectedWarehouseId) && b.productId === Number(productId)
    );
  };

  const watchedItems = watch("items") || [];

  // Dasar hitung harga: jumlah berat (qty x berat/satuan); bila berat belum diisi, pakai qty.
  const lineQuantity = (i: { quantity?: number; weight?: number }) => {
    const qty = Number(i.quantity) || 0;
    const weight = qty * (Number(i.weight) || 0);
    return weight > 0 ? weight : qty;
  };
  const lineTotal = (i: { quantity?: number; weight?: number; price?: number; discount?: number }) =>
    lineQuantity(i) * (Number(i.price) || 0) - (Number(i.discount) || 0);

  const total = watchedItems.reduce((a, i) => a + lineTotal(i), 0);
  const totalWeight = watchedItems.reduce(
    (a, i) => a + (Number(i.quantity) || 0) * (Number(i.weight) || 0),
    0
  );

  // Berat dicatat dalam Kg, ditampilkan juga dalam Ton (1 Ton = 1.000 Kg).
  const fmtKg = (kg: number) => kg.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  const fmtTon = (kg: number) => (kg / 1000).toLocaleString("id-ID", { maximumFractionDigits: 3 });

  const onSubmit = async (data: any) => {
    if (!data.warehouseId) {
      toast.error("Pilih gudang terlebih dahulu");
      return;
    }
    const over = (data.items || []).some((it: any) => {
      const st = stockFor(it.productId);
      const available = st ? Number(st.balance) : 0;
      return Number(it.quantity) > available;
    });
    if (over) {
      toast.error("Qty melebihi stok gudang yang tersedia");
      return;
    }
    try {
      const finalNumber = await generateCustomDocumentNumber("SALES", salesPrefix);
      const res = await createSale({
        number: finalNumber,
        date: data.date,
        customerId: Number(data.customerId),
        warehouseId: Number(data.warehouseId),
        paymentMethod: data.paymentMethod,
        termDays: Number(data.termDays),
        notes: data.notes,
        items: data.items.map((i: any) => ({
          productId: Number(i.productId),
          brandId: i.brandId ? Number(i.brandId) : null,
          quantity: Number(i.quantity),
          weight: i.weight ? Number(i.weight) : null,
          price: Number(i.price),
          discount: Number(i.discount),
        })),
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Penjualan berhasil disimpan");
      router.push("/sales");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan penjualan");
    }
  };

  const handleSaveBrand = async () => {
    if (brandDialogIndex === null || !newBrandName.trim()) return;
    setSavingBrand(true);
    try {
      const brand = await createBrand(newBrandName);
      await queryClient.invalidateQueries({ queryKey: ["brands"] });
      setValue(`items.${brandDialogIndex}.brandId`, String(brand.id));
      toast.success(`Merek "${brand.name}" ditambahkan`);
      setBrandDialogIndex(null);
      setNewBrandName("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menambah merek");
    } finally {
      setSavingBrand(false);
    }
  };

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Card className="mx-auto max-w-4xl shadow-sm">
      <CardHeader><CardTitle>Tambah Penjualan</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><Label>No. Penjualan</Label><Input {...register("number", { required: true })} /></div>
            <div><Label>Tanggal</Label><Input type="date" {...register("date", { required: true })} /></div>
            <div>
              <Label>Pelanggan</Label>
              <select className={selectClass} {...register("customerId", { required: true })}>
                <option value="">Pilih Pelanggan</option>
                {customers?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Gudang</Label>
              <select className={selectClass} {...register("warehouseId", { required: true })}>
                <option value="">Pilih Gudang</option>
                {warehouses?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Metode Bayar</Label>
              <select className={selectClass} {...register("paymentMethod")}>
                <option value="Cash">Cash</option>
                <option value="Transfer">Transfer</option>
                <option value="Credit">Credit</option>
              </select>
            </div>
            <div><Label>Termin (hari)</Label><Input type="number" {...register("termDays")} /></div>
          </div>

          <Separator />
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Item Penjualan</p>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: "", brandId: "", quantity: 0, weight: 0, price: 0, discount: 0 })}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Item
            </Button>
          </div>
          <div className="space-y-3">
            {fields.map((f, i) => {
              const pid = watchedItems[i]?.productId;
              const hpp = hppFor(pid);
              const price = Number(watchedItems[i]?.price) || 0;
              const belowHpp = hpp > 0 && price > 0 && price < hpp;
              const stock = stockFor(pid);
              const available = stock ? Number(stock.balance) : 0;
              const qty = Number(watchedItems[i]?.quantity) || 0;
              const exceeds = !!stock && qty > available;
              return (
              <div key={f.id} className={`space-y-2 rounded-lg border p-3 ${belowHpp || exceeds ? "border-destructive bg-destructive/5" : "bg-muted/20"}`}>
                <div className="flex flex-wrap items-center gap-2">
                <select
                  className={selectClass + " min-w-[150px] flex-1"}
                  {...register(`items.${i}.productId`, {
                    onChange: (e) => {
                      const prod = products?.find((p) => String(p.id) === e.target.value);
                      if (prod) setValue(`items.${i}.price`, Number(prod.defaultPrice));
                    },
                  })}
                >
                  <option value="">Pilih Produk</option>
                  {products?.filter((p) => p.type === "FINISHED_GOOD" || p.type === "BY_PRODUCT").map((p) => {
                    const st = stockFor(p.id);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name}{st ? ` — stok ${Number(st.balance).toLocaleString("id-ID")} ${st.productUnit}` : selectedWarehouseId ? " — stok 0" : ""}
                      </option>
                    );
                  })}
                </select>
                <select
                  className={selectClass + " w-44"}
                  title="Merek produk untuk laporan penjualan per merek"
                  {...register(`items.${i}.brandId`, {
                    onChange: (e) => {
                      if (e.target.value === NEW_BRAND) {
                        setBrandDialogIndex(i);
                        setNewBrandName("");
                        setValue(`items.${i}.brandId`, "");
                      }
                    },
                  })}
                >
                  <option value="">Tanpa merek</option>
                  {brands?.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                  <option value={NEW_BRAND}>+ Tambah merek baru…</option>
                </select>
                <Input type="number" step="0.01" placeholder="Qty" className={`w-24 ${exceeds ? "border-destructive" : ""}`} {...register(`items.${i}.quantity`, { valueAsNumber: true })} />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Berat/Satuan (Kg)"
                  title="Berat per satuan, mis. 50 Kg per sak"
                  className="w-32"
                  {...register(`items.${i}.weight`, { valueAsNumber: true })}
                />
                <Input
                  readOnly
                  tabIndex={-1}
                  placeholder="Jumlah Berat"
                  title="Otomatis: qty × berat per satuan"
                  className="w-32 bg-muted font-mono"
                  value={(
                    (Number(watchedItems[i]?.quantity) || 0) * (Number(watchedItems[i]?.weight) || 0)
                  ).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                />
                <Input type="number" step="0.01" placeholder="Harga/Kg" className={`w-28 ${belowHpp ? "border-destructive" : ""}`} {...register(`items.${i}.price`, { valueAsNumber: true })} />
                <Input type="number" step="0.01" placeholder="Diskon" className="w-24" {...register(`items.${i}.discount`, { valueAsNumber: true })} />
                <div className="ml-auto flex flex-col items-end">
                  <span className="whitespace-nowrap rounded-md bg-muted px-2 py-1 text-xs font-mono text-muted-foreground">
                    {lineTotal(watchedItems[i] ?? {}).toLocaleString("id-ID")}
                  </span>
                  <span className="mt-0.5 text-[10px] text-muted-foreground">
                    {lineQuantity(watchedItems[i] ?? {}).toLocaleString("id-ID", { maximumFractionDigits: 2 })} × harga
                  </span>
                </div>
                <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                </div>
                {pid && (
                  <div className="flex flex-wrap items-center gap-3 pl-1 text-xs">
                    {!selectedWarehouseId ? (
                      <span className="text-muted-foreground">Pilih gudang untuk melihat stok</span>
                    ) : stock ? (
                      <span className={`inline-flex items-center gap-1.5 ${exceeds ? "font-medium text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {exceeds ? <AlertTriangle className="h-3.5 w-3.5" /> : <PackageCheck className="h-3.5 w-3.5" />}
                        Stok di gudang: {available.toLocaleString("id-ID")} {stock.productUnit}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5" /> Stok tidak tersedia di gudang ini (0 {products?.find((p) => p.id === Number(pid))?.unit ?? "Kg"})
                      </span>
                    )}
                    <span className={Number(watchedItems[i]?.weight) > 0 ? "font-medium text-foreground" : "text-muted-foreground"}>
                      {Number(watchedItems[i]?.weight) > 0
                        ? `Jumlah berat: ${fmtKg((Number(watchedItems[i]?.quantity) || 0) * Number(watchedItems[i]?.weight))} Kg ≈ ${fmtTon((Number(watchedItems[i]?.quantity) || 0) * Number(watchedItems[i]?.weight))} Ton (${(Number(watchedItems[i]?.quantity) || 0).toLocaleString("id-ID")} × ${fmtKg(Number(watchedItems[i]?.weight))} Kg)`
                        : "Berat per satuan belum diisi"}
                    </span>
                    <span className="text-muted-foreground">
                      {hpp > 0
                        ? `${costInfoFor(pid)?.label}: Rp ${Math.round(hpp).toLocaleString("id-ID")}/Kg`
                        : "HPP belum tersedia (belum ada produksi/pembelian)"}
                      {costInfoFor(pid)?.source === "PRODUCTION" && costInfoFor(pid)?.purchaseCost
                        ? ` · harga beli Rp ${Math.round(costInfoFor(pid)!.purchaseCost!).toLocaleString("id-ID")}/Kg`
                        : ""}
                    </span>
                    {belowHpp && (
                      <span className="inline-flex items-center gap-1.5 font-medium text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5" /> Harga jual di bawah HPP — berpotensi rugi
                      </span>
                    )}
                    {hpp > 0 && price >= hpp && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Margin: Rp {Math.round(price - hpp).toLocaleString("id-ID")}/Kg ({price > 0 ? (((price - hpp) / price) * 100).toFixed(1) : "0"}%)
                      </span>
                    )}
                  </div>
                )}
              </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between rounded-xl border bg-primary/5 p-4">
            <span className="font-semibold">Total Penjualan:</span>
            <span className="font-mono text-xl font-bold text-accent">Rp {total.toLocaleString("id-ID")}</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/30 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Total Berat:</span>
            <span className="font-mono font-semibold">
              {fmtKg(totalWeight)} Kg
              <span className="text-muted-foreground"> ≈ </span>
              {fmtTon(totalWeight)} Ton
            </span>
          </div>

          <div><Label>Keterangan</Label><Input {...register("notes")} /></div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => router.back()}>Batal</Button>
            <Button type="submit">Simpan & Posting</Button>
          </div>
        </form>
      </CardContent>

      <Dialog open={brandDialogIndex !== null} onOpenChange={(open) => !open && setBrandDialogIndex(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4" /> Tambah Merek Baru
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nama Merek</Label>
            <Input
              autoFocus
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveBrand();
                }
              }}
              placeholder='Contoh: Cap Roda Mas'
            />
            <p className="text-xs text-muted-foreground">
              Merek tersimpan di master dan langsung terpilih pada item ini.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBrandDialogIndex(null)}>Batal</Button>
            <Button type="button" onClick={handleSaveBrand} disabled={savingBrand || !newBrandName.trim()}>
              {savingBrand ? "Menyimpan..." : "Simpan Merek"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
