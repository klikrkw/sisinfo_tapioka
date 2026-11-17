"use client";

import { MasterList, type Column } from "@/components/master/master-list";
import { getUnitsPaginated } from "@/actions/unit-actions";
import { Badge } from "@/components/ui/badge";

type Unit = { id: number; name: string; status: boolean | null };

const columns: Column<Unit>[] = [
  { header: "Nama Satuan", cell: (r) => <span className="font-medium">{r.name}</span> },
  {
    header: "Status",
    cell: (r) => (
      <Badge variant="outline" className={r.status === false ? "text-muted-foreground" : "text-emerald-600 dark:text-emerald-400"}>
        {r.status === false ? "Nonaktif" : "Aktif"}
      </Badge>
    ),
  },
];

export default function UnitsPage() {
  return (
    <MasterList<Unit>
      title="Daftar Satuan"
      queryKey="units"
      queryFn={getUnitsPaginated}
      columns={columns}
      addHref="/master/units/add"
      addLabel="Tambah Satuan"
      searchPlaceholder="Cari satuan..."
      rowHref={(r) => `/master/units/${r.id}/edit`}
    />
  );
}
