"use client";

import { MasterList, type Column } from "@/components/master/master-list";
import { getFinishedPurchasesPaginated } from "@/actions/purchasing-actions";
import { PurchaseTabs } from "@/components/purchasing/purchase-tabs";

type FinishedPurchase = {
  id: number;
  number: string;
  date: Date;
  productName: string | null;
  productUnit: string | null;
  netWeight: string;
  payableWeight: string;
  sackCount: string | null;
  pricePerKg: string;
  baseAmount: string;
  totalDeductions: string | null;
  totalCosts: string | null;
  netAmount: string;
  status: string | null;
};

const statusVariant: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  Approved: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
};

const columns: Column<FinishedPurchase>[] = [
  { header: "No. Pembelian", cell: (r) => <span className="font-medium font-mono">{r.number}</span> },
  { header: "Tanggal", cell: (r) => new Date(r.date).toLocaleDateString("id-ID") },
  {
    header: "Produk",
    cell: (r) => <span className="font-medium">{r.productName ?? "-"}</span>,
  },
  {
    header: "Berat Bersih",
    cell: (r) => (
      <span className="font-mono">
        {Number(r.netWeight || 0).toLocaleString("id-ID")} {r.productUnit ?? "Kg"}
      </span>
    ),
  },
  { header: "Sak", cell: (r) => <span className="font-mono">{Number(r.sackCount || 0).toLocaleString("id-ID")}</span> },
  { header: "Harga / Kg", cell: (r) => <span className="font-mono">Rp {Number(r.pricePerKg || 0).toLocaleString("id-ID")}</span> },
  {
    header: "Potongan / Biaya",
    cell: (r) => (
      <div className="font-mono text-xs">
        {Number(r.totalDeductions || 0) > 0 && (
          <div className="text-emerald-600 dark:text-emerald-400">− Rp {Number(r.totalDeductions).toLocaleString("id-ID")}</div>
        )}
        {Number(r.totalCosts || 0) > 0 && (
          <div className="text-amber-600 dark:text-amber-400">+ Rp {Number(r.totalCosts).toLocaleString("id-ID")}</div>
        )}
        {Number(r.totalDeductions || 0) === 0 && Number(r.totalCosts || 0) === 0 && (
          <span className="text-muted-foreground">Rp 0</span>
        )}
      </div>
    ),
  },
  { header: "Dibayar", cell: (r) => <span className="font-mono font-semibold">Rp {Number(r.netAmount || 0).toLocaleString("id-ID")}</span> },
  {
    header: "Status",
    cell: (r) => (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusVariant[r.status ?? "Draft"] ?? statusVariant.Draft}`}>
        {r.status ?? "Draft"}
      </span>
    ),
  },
];

export default function FinishedPurchasingPage() {
  return (
    <div className="space-y-4">
      <PurchaseTabs />
      <MasterList<FinishedPurchase>
        title="Pembelian Produk Jadi (Tapioka)"
        queryKey="finished-purchases"
        queryFn={getFinishedPurchasesPaginated}
        columns={columns}
        addHref="/purchasing/finished/add"
        addLabel="Tambah Pembelian"
        searchPlaceholder="Cari nomor pembelian..."
        rowHref={(r) => `/purchasing/finished/${r.id}`}
      />
    </div>
  );
}
