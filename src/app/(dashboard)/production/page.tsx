"use client";

import { MasterList, type Column } from "@/components/master/master-list";
import { getProductionBatchesPaginated } from "@/actions/production-actions";

type Batch = { id: number; number: string; date: Date; status: string | null };

const tone: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Processing: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
};

const columns: Column<Batch>[] = [
  { header: "No. Batch", cell: (r) => <span className="font-medium font-mono">{r.number}</span> },
  { header: "Tanggal", cell: (r) => new Date(r.date).toLocaleDateString("id-ID") },
  {
    header: "Status",
    cell: (r) => (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tone[r.status ?? "Draft"] ?? tone.Draft}`}>
        {r.status ?? "Draft"}
      </span>
    ),
  },
];

export default function ProductionPage() {
  return (
    <MasterList<Batch>
      title="Batch Produksi Tepung Tapioka"
      queryKey="production-batches"
      queryFn={getProductionBatchesPaginated}
      columns={columns}
      addHref="/production/add"
      addLabel="Tambah Batch"
      searchPlaceholder="Cari nomor batch..."
      rowHref={(r) => `/production/${r.id}`}
    />
  );
}
