"use client";

import { MasterList, type Column } from "@/components/master/master-list";
import { getPurchasesPaginated } from "@/actions/purchasing-actions";
import { Badge } from "@/components/ui/badge";

type Purchase = {
  id: number;
  number: string;
  date: Date;
  status: string | null;
  grossWeight: string;
};

const columns: Column<Purchase>[] = [
  { header: "No. Pembelian", cell: (r) => <span className="font-medium font-mono">{r.number}</span> },
  { header: "Tanggal", cell: (r) => new Date(r.date).toLocaleDateString("id-ID") },
  { header: "Berat Bruto", cell: (r) => `${Number(r.grossWeight || 0).toLocaleString("id-ID")} Kg` },
  {
    header: "Status",
    cell: (r) => (
      <Badge variant={r.status === "Draft" ? "outline" : "secondary"}>
        {r.status ?? "Draft"}
      </Badge>
    ),
  },
];

export default function WeighingPage() {
  return (
    <MasterList<Purchase>
      title="Penimbangan Ketela"
      queryKey="purchases"
      queryFn={getPurchasesPaginated}
      columns={columns}
      addHref="/purchasing/add"
      addLabel="Tambah Pembelian"
      searchPlaceholder="Cari nomor pembelian..."
      rowHref={(r) => `/purchasing/${r.id}/edit`}
    />
  );
}
