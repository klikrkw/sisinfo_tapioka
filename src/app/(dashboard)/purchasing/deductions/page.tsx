"use client";

import { MasterList, type Column } from "@/components/master/master-list";
import { getDeductionTypesPaginated } from "@/actions/master-others";
import { Badge } from "@/components/ui/badge";

type DedType = { id: number; code: string; name: string; calculationType: string; impactType: string; appliesTo: string };

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
];

export default function PurchasingDeductionsPage() {
  return (
    <MasterList<DedType>
      title="Jenis Potongan Pembelian"
      queryKey="purchasing-deductions"
      queryFn={getDeductionTypesPaginated}
      columns={columns}
      addHref="/master/deductions/add"
      addLabel="Tambah Potongan"
      searchPlaceholder="Cari kode atau nama..."
      rowHref={(r) => `/master/deductions/${r.id}/edit`}
    />
  );
}
