"use client";

import { MasterList, type Column } from "@/components/master/master-list";
import { getDriversPaginated } from "@/actions/master-others";
import { Badge } from "@/components/ui/badge";

type Driver = {
  id: number;
  code: string;
  name: string;
  phone: string | null;
  address: string | null;
  licenseNumber: string | null;
  licenseType: string | null;
  status: boolean;
};

const columns: Column<Driver>[] = [
  { header: "Kode", cell: (r) => <span className="font-medium">{r.code}</span> },
  { header: "Nama Sopir", cell: (r) => <span className="font-medium">{r.name}</span> },
  { header: "Telepon", cell: (r) => r.phone ?? "-" },
  { header: "Alamat", cell: (r) => <span className="text-muted-foreground">{r.address ?? "-"}</span> },
  { header: "No. SIM", cell: (r) => <span className="font-mono">{r.licenseNumber ?? "-"}</span> },
  { header: "Jenis SIM", cell: (r) => <Badge variant="outline">{r.licenseType ?? "-"}</Badge> },
  {
    header: "Status",
    cell: (r) =>
      r.status ? (
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

export default function DriversMasterPage() {
  return (
    <MasterList<Driver>
      title="Daftar Sopir"
      queryKey="drivers-master"
      queryFn={getDriversPaginated}
      columns={columns}
      addHref="/master/fleet/drivers/add"
      addLabel="Tambah Sopir"
      searchPlaceholder="Cari kode atau nama sopir..."
    />
  );
}
