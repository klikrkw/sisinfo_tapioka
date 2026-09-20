"use client";

import { MasterList, type Column } from "@/components/master/master-list";
import { getShipmentsPaginated } from "@/actions/fleet-actions";

type Shipment = {
  id: number;
  number: string;
  date: Date;
  status: string | null;
  destination: string | null;
  vehicleName: string | null;
  driverName: string | null;
  distance: string | null;
};

const tone: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Disiapkan: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  Berangkat: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  "Dalam Perjalanan": "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
  Sampai: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400",
  Selesai: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  Dibatalkan: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
};

const columns: Column<Shipment>[] = [
  { header: "No. Pengiriman", cell: (r) => <span className="font-medium font-mono">{r.number}</span> },
  { header: "Tanggal", cell: (r) => new Date(r.date).toLocaleDateString("id-ID") },
  { header: "Armada", cell: (r) => r.vehicleName ?? "-" },
  { header: "Sopir", cell: (r) => r.driverName ?? "-" },
  { header: "Tujuan", cell: (r) => r.destination ?? "-" },
  { header: "Jarak", cell: (r) => `${Number(r.distance || 0).toLocaleString("id-ID")} KM` },
  {
    header: "Status",
    cell: (r) => (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tone[r.status ?? "Draft"] ?? tone.Draft}`}>
        {r.status ?? "Draft"}
      </span>
    ),
  },
];

export default function FleetPage() {
  return (
    <MasterList<Shipment>
      title="Pengiriman & Armada"
      queryKey="shipments"
      queryFn={getShipmentsPaginated}
      columns={columns}
      addHref="/fleet/add"
      addLabel="Tambah Pengiriman"
      searchPlaceholder="Cari nomor pengiriman..."
      rowHref={(r) => `/fleet/${r.id}`}
    />
  );
}
