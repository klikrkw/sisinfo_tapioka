"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getOrCreateDeliveryNoteNumber, getSaleById } from "@/actions/sales-actions";
import { getProducts } from "@/actions/master-actions";
import { getCompanySettings } from "@/actions/settings-actions";
import { getShipmentBySaleId } from "@/actions/fleet-actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Leaf, Printer, Truck } from "lucide-react";

export default function SuratJalanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const saleId = Number(id);
  const router = useRouter();

  const { data: sale, isLoading } = useQuery({ queryKey: ["sale", saleId], queryFn: () => getSaleById(saleId) });
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const { data: company } = useQuery({ queryKey: ["company-settings"], queryFn: getCompanySettings });
  const { data: shipment } = useQuery({ queryKey: ["shipment-by-sale", saleId], queryFn: () => getShipmentBySaleId(saleId) });
  const { data: deliveryNoteNumber } = useQuery({
    queryKey: ["delivery-note-number", saleId],
    queryFn: () => getOrCreateDeliveryNoteNumber(saleId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }
  if (!sale) return <div className="p-8 text-center text-muted-foreground">Transaksi tidak ditemukan.</div>;

  const saleDate = new Date(sale.date);
  const docNumber = deliveryNoteNumber ?? "…";

  const customer = sale.customer as { name: string; address: string | null; phone: string | null } | null;
  const productName = (pid: number) => products?.find((p) => p.id === pid)?.name ?? `#${pid}`;
  const productUnit = (pid: number) => products?.find((p) => p.id === pid)?.unit ?? "Kg";

  const totalQty = sale.items.reduce((a, it) => a + Number(it.quantity), 0);

  return (
    <>
      {/* Toolbar (tidak tercetak) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Surat Jalan {docNumber}</h2>
          <p className="text-sm text-muted-foreground">
            Untuk penjualan {sale.number} · {customer?.name ?? "-"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Cetak Surat Jalan
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/sales/${saleId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
        </div>
      </div>

      {/* Dokumen Surat Jalan */}
      <div className="mx-auto max-w-[210mm] rounded-lg bg-white p-8 text-black shadow-sm print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        {/* Kop Surat */}
        <div className="border-b-2 border-gray-800 pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-800 text-white">
                <Leaf className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-wide">{company?.name ?? "Perusahaan Tapioka"}</h1>
                <p className="text-xs text-gray-700">{company?.address ?? "Alamat perusahaan"}</p>
                <p className="text-xs text-gray-700">
                  {[company?.phone, company?.email].filter(Boolean).join(" · ") || "Telepon / Email"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold uppercase tracking-wide">Surat Jalan</h2>
              <p className="font-mono text-sm">{docNumber}</p>
              <p className="text-xs text-gray-700">
                {saleDate.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Info Pengiriman */}
        <div className="mt-5 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Kepada Yth.</p>
            <p className="mt-1 font-semibold">{customer?.name ?? "-"}</p>
            <p className="text-xs text-gray-700">{customer?.address ?? "-"}</p>
            {customer?.phone && <p className="text-xs text-gray-700">Telp: {customer.phone}</p>}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">No. Invoice</span>
              <span className="font-mono font-medium">{sale.number}</span>
            </div>
            {shipment?.number && (
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">No. Pengiriman</span>
                <span className="font-mono font-medium">{shipment.number}</span>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">No. Polisi</span>
              <span className="font-medium">{shipment?.vehiclePolice ?? "-"}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Sopir</span>
              <span className="font-medium">{shipment?.driverName ?? "-"}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Tujuan</span>
              <span className="text-right font-medium">{shipment?.destination ?? customer?.address ?? "-"}</span>
            </div>
          </div>
        </div>

        {/* Tabel Barang */}
        <table className="mt-5 w-full border-collapse text-sm">
          <thead>
            <tr className="border-y-2 border-gray-800 text-left">
              <th className="w-10 py-2">No</th>
              <th className="py-2">Nama Barang</th>
              <th className="w-24 py-2 text-right">Qty</th>
              <th className="w-20 py-2 text-left">Satuan</th>
              <th className="w-40 py-2">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((it, idx) => (
              <tr key={it.id} className="border-b border-gray-300">
                <td className="py-2">{idx + 1}</td>
                <td className="py-2">{productName(it.productId)}</td>
                <td className="py-2 text-right font-mono">{Number(it.quantity).toLocaleString("id-ID")}</td>
                <td className="py-2">{productUnit(it.productId)}</td>
                <td className="py-2"></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-800">
              <td colSpan={2} className="py-2 text-right text-xs font-bold uppercase">Total</td>
              <td className="py-2 text-right font-mono font-bold">{totalQty.toLocaleString("id-ID")}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-4 text-xs text-gray-700">
          Barang tersebut di atas dikirim sesuai dengan pesanan dan diterima dalam keadaan baik dan cukup jumlahnya.
        </p>
        {sale.notes && <p className="mt-1 text-xs text-gray-700">Catatan: {sale.notes}</p>}

        {/* Tanda Tangan */}
        <div className="mt-12 grid grid-cols-3 gap-6 text-center text-xs">
          <div>
            <p className="text-gray-600">Pengirim,</p>
            <div className="h-20" />
            <p className="border-t border-gray-400 pt-1 font-semibold">{company?.name ?? "Perusahaan"}</p>
          </div>
          <div>
            <p className="text-gray-600">Sopir / Pembawa,</p>
            <div className="h-20" />
            <p className="border-t border-gray-400 pt-1 font-semibold">{shipment?.driverName ?? "................"}</p>
          </div>
          <div>
            <p className="text-gray-600">Penerima,</p>
            <div className="h-20" />
            <p className="border-t border-gray-400 pt-1 font-semibold">{customer?.name ?? "................"}</p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-dashed pt-2 text-[10px] text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Truck className="h-3 w-3" /> Dokumen pengiriman barang
          </span>
          <span>Dicetak {new Date().toLocaleString("id-ID")}</span>
        </div>
      </div>
    </>
  );
}
