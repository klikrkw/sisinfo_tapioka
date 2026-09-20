"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { createShipment } from "@/actions/fleet-actions";
import { peekCustomDocumentNumber, generateCustomDocumentNumber } from "@/actions/numbering-actions";
import { getDocumentSequences } from "@/actions/settings-actions";
import { getVehicles, getDrivers } from "@/actions/master-others";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo } from "react";

const COST_CATEGORIES = ["Solar", "Sopir", "Tol", "Parkir", "Servis", "Ban", "Oli", "Reparasi", "Pajak", "Asuransi", "Lainnya"];

export default function AddShipmentPage() {
  const router = useRouter();
  const { register, handleSubmit, watch, control, setValue } = useForm({
    defaultValues: {
      number: "",
      date: new Date().toISOString().slice(0, 10),
      vehicleId: "",
      driverId: "",
      destination: "",
      kmStart: 0,
      kmEnd: 0,
      status: "Draft",
      liters: 0,
      pricePerLiter: 0,
      costs: [] as { category: string; name: string; amount: number }[],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "costs" });
  const { data: vehicles } = useQuery({ queryKey: ["vehicles"], queryFn: getVehicles });
  const { data: drivers } = useQuery({ queryKey: ["drivers"], queryFn: getDrivers });
  const { data: sequences } = useQuery({ queryKey: ["documentSequences"], queryFn: getDocumentSequences });

  const shipmentPrefix = useMemo(() => {
    const seq = sequences?.find((s) => s.docType === "SHIPMENT");
    return seq?.prefix ?? "DO";
  }, [sequences]);

  useEffect(() => {
    peekCustomDocumentNumber("SHIPMENT", shipmentPrefix).then((n) => setValue("number", n));
  }, [setValue, shipmentPrefix]);

  const kmStart = Number(watch("kmStart")) || 0;
  const kmEnd = Number(watch("kmEnd")) || 0;
  const liters = Number(watch("liters")) || 0;
  const pricePerLiter = Number(watch("pricePerLiter")) || 0;

  const onSubmit = async (data: any) => {
    try {
      const finalNumber = await generateCustomDocumentNumber("SHIPMENT", shipmentPrefix);
      await createShipment({
        number: finalNumber,
        date: data.date,
        vehicleId: Number(data.vehicleId),
        driverId: Number(data.driverId),
        destination: data.destination,
        kmStart: Number(data.kmStart),
        kmEnd: Number(data.kmEnd),
        status: data.status,
        fuel: liters > 0 ? { liters, pricePerLiter } : null,
        costs: data.costs.map((c: any) => ({
          category: c.category,
          name: c.name,
          amount: Number(c.amount),
        })),
      });
      toast.success("Pengiriman berhasil disimpan");
      router.push("/fleet");
    } catch {
      toast.error("Gagal menyimpan pengiriman");
    }
  };

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Card className="mx-auto max-w-4xl shadow-sm">
      <CardHeader><CardTitle>Tambah Pengiriman</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><Label>No. Pengiriman</Label><Input {...register("number", { required: true })} /></div>
            <div><Label>Tanggal</Label><Input type="date" {...register("date", { required: true })} /></div>
            <div>
              <Label>Armada</Label>
              <select className={selectClass} {...register("vehicleId", { required: true })}>
                <option value="">Pilih Armada</option>
                {vehicles?.map((v) => <option key={v.id} value={v.id}>{v.policeNumber} · {v.brand}</option>)}
              </select>
            </div>
            <div>
              <Label>Sopir</Label>
              <select className={selectClass} {...register("driverId", { required: true })}>
                <option value="">Pilih Sopir</option>
                {drivers?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2"><Label>Tujuan</Label><Input {...register("destination")} placeholder="Alamat pengiriman" /></div>
            <div><Label>KM Awal</Label><Input type="number" step="0.01" {...register("kmStart")} /></div>
            <div><Label>KM Akhir</Label><Input type="number" step="0.01" {...register("kmEnd")} /></div>
            <div>
              <Label>Status</Label>
              <select className={selectClass} {...register("status")}>
                {["Draft", "Disiapkan", "Berangkat", "Dalam Perjalanan", "Sampai", "Selesai", "Dibatalkan"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <p className="text-sm text-muted-foreground">Jarak: <span className="font-mono font-semibold text-foreground">{(kmEnd - kmStart).toLocaleString("id-ID")} KM</span></p>
            </div>
          </div>

          <Separator />
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Biaya Solar</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div><Label>Liter</Label><Input type="number" step="0.01" {...register("liters")} /></div>
            <div><Label>Harga / Liter</Label><Input type="number" step="0.01" {...register("pricePerLiter")} /></div>
            <div><Label>Total Solar</Label><Input readOnly value={`Rp ${(liters * pricePerLiter).toLocaleString("id-ID")}`} className="bg-muted font-mono" /></div>
          </div>

          <Separator />
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Biaya Perjalanan & Armada</p>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ category: "Tol", name: "", amount: 0 })}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Biaya
            </Button>
          </div>
          <div className="space-y-3">
            {fields.map((f, i) => (
              <div key={f.id} className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-3">
                <select className={selectClass + " w-36"} {...register(`costs.${i}.category`)}>
                  {COST_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <Input placeholder="Keterangan" className="min-w-[140px] flex-1" {...register(`costs.${i}.name`, { required: true })} />
                <Input type="number" step="0.01" placeholder="Rp" className="w-36" {...register(`costs.${i}.amount`)} />
                <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => router.back()}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
