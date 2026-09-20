"use client";

import { MasterList, type Column } from "@/components/master/master-list";
import { getDeductionTypesPaginated } from "@/actions/master-others";
import { Badge } from "@/components/ui/badge";

type DedType = { id: number; code: string; name: string; calculationType: string; impactType: string };

const columns: Column<DedType>[] = [
  { header: "Kode", cell: (r) => <span className="font-medium">{r.code}</span> },
  { header: "Nama Potongan", cell: (r) => r.name },
  { header: "Metode", cell: (r) => <Badge variant="outline">{r.calculationType}</Badge> },
  { header: "Dampak", cell: (r) => <Badge variant="secondary">{r.impactType}</Badge> },
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
