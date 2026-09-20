"use client";

import { MasterList, type Column } from "@/components/master/master-list";
import { getSalesPaginated } from "@/actions/sales-actions";

type Sale = { id: number; number: string; date: Date; paymentMethod: string | null; totalAmount: string; status: string | null };

const tone: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Posted: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  Paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
};

const columns: Column<Sale>[] = [
  { header: "No. Penjualan", cell: (r) => <span className="font-medium font-mono">{r.number}</span> },
  { header: "Tanggal", cell: (r) => new Date(r.date).toLocaleDateString("id-ID") },
  { header: "Pembayaran", cell: (r) => r.paymentMethod ?? "-" },
  { header: "Total", cell: (r) => <span className="font-mono">Rp {Number(r.totalAmount || 0).toLocaleString("id-ID")}</span> },
  {
    header: "Status",
    cell: (r) => (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tone[r.status ?? "Draft"] ?? tone.Draft}`}>
        {r.status ?? "Draft"}
      </span>
    ),
  },
];

export default function SalesPage() {
  return (
    <MasterList<Sale>
      title="Transaksi Penjualan"
      queryKey="sales"
      queryFn={getSalesPaginated}
      columns={columns}
      addHref="/sales/add"
      addLabel="Tambah Penjualan"
      searchPlaceholder="Cari nomor penjualan..."
      rowHref={(r) => `/sales/${r.id}`}
    />
  );
}
