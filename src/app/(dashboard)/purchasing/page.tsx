"use client";

import { MasterList, type Column } from "@/components/master/master-list";
import { getPurchasesPaginated } from "@/actions/purchasing-actions";
import { Badge } from "@/components/ui/badge";

type Purchase = {
  id: number;
  number: string;
  date: Date;
  grossWeight: string;
  payableWeight: string;
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

const columns: Column<Purchase>[] = [
  { header: "No. Pembelian", cell: (r) => <span className="font-medium font-mono">{r.number}</span> },
  { header: "Tanggal", cell: (r) => new Date(r.date).toLocaleDateString("id-ID") },
  { header: "Bruto", cell: (r) => `${Number(r.grossWeight || 0).toLocaleString("id-ID")} Kg` },
  { header: "Berat Dibayar", cell: (r) => `${Number(r.payableWeight || 0).toLocaleString("id-ID")} Kg` },
  { header: "Nilai", cell: (r) => <span className="font-mono">Rp {Number(r.netAmount || 0).toLocaleString("id-ID")}</span> },
  {
    header: "Status",
    cell: (r) => (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusVariant[r.status ?? "Draft"] ?? statusVariant.Draft}`}>
        {r.status ?? "Draft"}
      </span>
    ),
  },
];

export default function PurchasingPage() {
  return (
    <MasterList<Purchase>
      title="Transaksi Pembelian Ketela"
      queryKey="purchases"
      queryFn={getPurchasesPaginated}
      columns={columns}
      addHref="/purchasing/add"
      addLabel="Tambah Pembelian"
      searchPlaceholder="Cari nomor pembelian..."
    />
  );
}
