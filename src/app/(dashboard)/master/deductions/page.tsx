"use client";

import { MasterList, type Column } from "@/components/master/master-list";
import { getDeductionTypesPaginated } from "@/actions/master-others";
import { Badge } from "@/components/ui/badge";

type DedType = {
  id: number;
  code: string;
  name: string;
  calculationType: string;
  impactType: string;
  appliesTo: string;
  isActive: boolean;
};

const appliesLabel: Record<string, string> = {
  RAW_MATERIAL: "Pembelian Ketela",
  FINISHED_GOOD: "Pembelian Produk Jadi",
  BOTH: "Keduanya",
};

const columns: Column<DedType>[] = [
  { header: "Kode", cell: (r) => <span className="font-medium">{r.code}</span> },
  { header: "Nama Potongan", cell: (r) => r.name },
  { header: "Metode", cell: (r) => <Badge variant="outline">{r.calculationType}</Badge> },
  { header: "Dampak", cell: (r) => <Badge variant="secondary">{r.impactType}</Badge> },
  { header: "Digunakan Pada", cell: (r) => appliesLabel[r.appliesTo] ?? r.appliesTo },
  {
    header: "Status",
    cell: (r) =>
      r.isActive ? (
        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
          Aktif
        </span>
      ) : (
        <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          Nonaktif
        </span>
      ),
  },
];

export default function DeductionTypesPage() {
  return (
    <MasterList<DedType>
      title="Daftar Jenis Potongan"
      queryKey="deductions"
      queryFn={getDeductionTypesPaginated}
      columns={columns}
      addHref="/master/deductions/add"
      addLabel="Tambah Potongan"
      searchPlaceholder="Cari kode atau nama..."
    />
  );
}
