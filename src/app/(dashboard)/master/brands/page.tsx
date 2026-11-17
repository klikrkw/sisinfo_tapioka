"use client";

import { MasterList, type Column } from "@/components/master/master-list";
import { getBrandsPaginated } from "@/actions/brand-actions";
import { Badge } from "@/components/ui/badge";

type Brand = { id: number; name: string; status: boolean | null };

const columns: Column<Brand>[] = [
  { header: "Nama Merek", cell: (r) => <span className="font-medium">{r.name}</span> },
  {
    header: "Status",
    cell: (r) => (
      <Badge variant="outline" className={r.status === false ? "text-muted-foreground" : "text-emerald-600 dark:text-emerald-400"}>
        {r.status === false ? "Nonaktif" : "Aktif"}
      </Badge>
    ),
  },
];

export default function BrandsPage() {
  return (
    <MasterList<Brand>
      title="Daftar Merek (Brand)"
      queryKey="brands"
      queryFn={getBrandsPaginated}
      columns={columns}
      addHref="/master/brands/add"
      addLabel="Tambah Merek"
      searchPlaceholder="Cari merek..."
      rowHref={(r) => `/master/brands/${r.id}/edit`}
    />
  );
}
