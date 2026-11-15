"use client";

import { use, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getPurchaseById } from "@/actions/purchasing-actions";
import { getProducts, getSuppliers, getWarehouses } from "@/actions/master-actions";
import { getCompanySettings } from "@/actions/settings-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ArrowLeft, FileText } from "lucide-react";
import { PurchaseReceiptDialog, type PurchaseReceiptData } from "@/components/purchasing/purchase-receipt-dialog";

const formatRp = (n: number | string | null | undefined) => `Rp ${Number(n || 0).toLocaleString("id-ID")}`;

export default function FinishedPurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const purchaseId = Number(id);
  const router = useRouter();
  const [receiptOpen, setReceiptOpen] = useState(false);

  const { data: purchase, isLoading } = useQuery({
    queryKey: ["finished-purchase", purchaseId],
    queryFn: () => getPurchaseById(purchaseId),
  });
  const { data: suppliers } = useQuery({ queryKey: ["suppliers"], queryFn: getSuppliers });
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const { data: warehouses } = useQuery({ queryKey: ["warehouses"], queryFn: getWarehouses });
  const { data: company } = useQuery({ queryKey: ["companySettings"], queryFn: getCompanySettings });

  const supplierName = suppliers?.find((s) => s.id === purchase?.supplierId)?.name ?? "-";
  const product = products?.find((p) => p.id === purchase?.rawMaterialId);
  const warehouseName = warehouses?.find((w) => w.id === purchase?.warehouseId)?.name ?? "-";

  const receiptData = useMemo<PurchaseReceiptData | null>(() => {
    if (!purchase) return null;
    return {
      number: purchase.number,
      date: String(purchase.date ?? ""),
      supplierName,
      materialName: product?.name ?? "-",
      grossWeight: Number(purchase.grossWeight),
      tareWeight: Number(purchase.tareWeight),
      netWeight: Number(purchase.netWeight),
      refactionWeight: Number(purchase.refactionWeight ?? 0),
      payableWeight: Number(purchase.payableWeight),
      pricePerKg: Number(purchase.pricePerKg),
      baseAmount: Number(purchase.baseAmount),
      sackCount: Number(purchase.sackCount ?? 0),
      deductions: (purchase.deductions ?? []).map((d) => ({
        name: d.name,
        calculationType: d.calculationType,
        impactType: d.impactType,
        quantity: Number(d.quantity ?? 0),
        rate: Number(d.rate ?? 0),
        amount: Number(d.amount),
      })),
      policeNumber: purchase.policeNumber ?? undefined,
      poNumber: purchase.poNumber ?? undefined,
      entryTime: purchase.entryTime ?? undefined,
      exitDate: purchase.exitDate ? String(purchase.exitDate) : undefined,
      exitTime: purchase.exitTime ?? undefined,
      companyName: company?.name ?? undefined,
      companyAddress: company?.address ?? undefined,
      companyPhone: company?.phone ?? undefined,
    };
  }, [purchase, supplierName, product, company]);

  if (isLoading) return <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;
  if (!purchase) return <div className="p-8 text-center text-muted-foreground">Transaksi tidak ditemukan.</div>;

  const totalDeductions = (purchase.deductions ?? [])
    .filter((d) => d.impactType !== "PURCHASE_COST")
    .reduce((a, d) => a + Number(d.amount), 0);
  const totalCosts = (purchase.deductions ?? [])
    .filter((d) => d.impactType === "PURCHASE_COST")
    .reduce((a, d) => a + Number(d.amount), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pembelian Produk Jadi {purchase.number}</h2>
          <p className="text-sm text-muted-foreground">
            {new Date(purchase.date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })} · {supplierName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={purchase.status === "Completed" ? "default" : "secondary"}>{purchase.status}</Badge>
          <Button size="sm" onClick={() => setReceiptOpen(true)}>
            <FileText className="mr-2 h-4 w-4" /> Nota / PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/purchasing/finished")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-2">
            <p className="text-xs text-muted-foreground">Nilai Produk</p>
            <p className="font-mono text-lg font-bold">{formatRp(purchase.baseAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2">
            <p className="text-xs text-muted-foreground">Total Potongan</p>
            <p className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">− {formatRp(totalDeductions)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2">
            <p className="text-xs text-muted-foreground">Total Biaya</p>
            <p className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400">+ {formatRp(totalCosts)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2">
            <p className="text-xs text-muted-foreground">Total Pembayaran</p>
            <p className="font-mono text-lg font-bold text-accent">{formatRp(purchase.netAmount)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rincian Penimbangan</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow><TableCell className="text-muted-foreground">Produk</TableCell><TableCell className="text-right font-medium">{product?.name ?? "-"}</TableCell></TableRow>
              <TableRow><TableCell className="text-muted-foreground">Gudang Tujuan</TableCell><TableCell className="text-right">{warehouseName}</TableCell></TableRow>
              <TableRow><TableCell className="text-muted-foreground">Berat Timbang</TableCell><TableCell className="text-right font-mono">{Number(purchase.grossWeight).toLocaleString("id-ID")} Kg</TableCell></TableRow>
              <TableRow><TableCell className="text-muted-foreground">Berat Tara</TableCell><TableCell className="text-right font-mono">{Number(purchase.tareWeight).toLocaleString("id-ID")} Kg</TableCell></TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground">Berat Bersih / Netto</TableCell>
                <TableCell className="text-right font-mono font-semibold">{Number(purchase.netWeight).toLocaleString("id-ID")} Kg</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground">Rifaksi</TableCell>
                <TableCell className="text-right font-mono">
                  {Number(purchase.refactionPercent ?? 0).toLocaleString("id-ID")}% (
                  {Number(purchase.refactionWeight ?? 0).toLocaleString("id-ID")} Kg
                  {Number(purchase.sackCount ?? 0) > 0 && (
                    <>
                      {" · "}
                      {(Number(purchase.refactionWeight ?? 0) / Number(purchase.sackCount)).toLocaleString("id-ID", {
                        maximumFractionDigits: 2,
                      })}{" "}
                      Kg/sak
                    </>
                  )}
                  )
                </TableCell>
              </TableRow>
              <TableRow><TableCell className="text-muted-foreground">Berat Dibayar</TableCell><TableCell className="text-right font-mono font-semibold">{Number(purchase.payableWeight).toLocaleString("id-ID")} Kg</TableCell></TableRow>
              <TableRow><TableCell className="text-muted-foreground">Jumlah Sak</TableCell><TableCell className="text-right font-mono">{Number(purchase.sackCount ?? 0).toLocaleString("id-ID")} sak</TableCell></TableRow>
              <TableRow><TableCell className="text-muted-foreground">Harga / Kg</TableCell><TableCell className="text-right font-mono">{formatRp(purchase.pricePerKg)}</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Potongan &amp; Biaya Tambahan</CardTitle>
        </CardHeader>
        <CardContent>
          {(purchase.deductions ?? []).length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Tidak ada potongan.</p>
          ) : (
            <Table>
              <TableBody>
                {(purchase.deductions ?? []).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {d.calculationType === "per_sack"
                        ? `${Number(d.quantity).toLocaleString("id-ID")} sak × ${formatRp(d.rate)}`
                        : d.calculationType === "per_kg"
                          ? `${Number(d.quantity).toLocaleString("id-ID")} Kg × ${formatRp(d.rate)}`
                          : d.calculationType === "percentage"
                            ? `${Number(d.rate).toLocaleString("id-ID")}%`
                            : "Nominal tetap"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {d.impactType === "PURCHASE_COST" ? "+" : "−"} {formatRp(d.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-semibold">Total Potongan</TableCell>
                  <TableCell />
                  <TableCell className="text-right font-mono font-bold">− {formatRp(totalDeductions)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Total Biaya</TableCell>
                  <TableCell />
                  <TableCell className="text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                    + {formatRp(totalCosts)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Total Pembayaran</TableCell>
                  <TableCell />
                  <TableCell className="text-right font-mono text-base font-bold text-accent">{formatRp(purchase.netAmount)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PurchaseReceiptDialog open={receiptOpen} onOpenChange={setReceiptOpen} data={receiptData} />
    </div>
  );
}
