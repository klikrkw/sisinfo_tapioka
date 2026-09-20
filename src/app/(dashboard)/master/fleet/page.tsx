"use client";

import { MasterList, type Column } from "@/components/master/master-list";
import { getVehiclesPaginated, getDriversPaginated } from "@/actions/master-others";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type Vehicle = {
  id: number;
  code: string;
  policeNumber: string;
  brand: string | null;
  type: string | null;
  capacity: string | null;
  ownership: string | null;
};

type Driver = {
  id: number;
  code: string;
  name: string;
  phone: string | null;
  licenseNumber: string | null;
  licenseType: string | null;
};

const vehicleColumns: Column<Vehicle>[] = [
  { header: "Kode", cell: (r) => <span className="font-medium">{r.code}</span> },
  { header: "Nomor Polisi", cell: (r) => <span className="font-mono">{r.policeNumber}</span> },
  { header: "Merk / Jenis", cell: (r) => [r.brand, r.type].filter(Boolean).join(" · ") || "-" },
  { header: "Kapasitas", cell: (r) => `${Number(r.capacity || 0).toLocaleString("id-ID")} Kg` },
  { header: "Kepemilikan", cell: (r) => <Badge variant="outline">{r.ownership ?? "-"}</Badge> },
];

const driverColumns: Column<Driver>[] = [
  { header: "Kode", cell: (r) => <span className="font-medium">{r.code}</span> },
  { header: "Nama Sopir", cell: (r) => r.name },
  { header: "Telepon", cell: (r) => r.phone ?? "-" },
  { header: "No. SIM", cell: (r) => <span className="font-mono">{r.licenseNumber ?? "-"}</span> },
  { header: "Jenis SIM", cell: (r) => <Badge variant="outline">{r.licenseType ?? "-"}</Badge> },
];

export default function FleetPage() {
  return (
    <Tabs defaultValue="vehicles" className="space-y-4">
      <TabsList>
        <TabsTrigger value="vehicles">Armada / Truk</TabsTrigger>
        <TabsTrigger value="drivers">Sopir</TabsTrigger>
      </TabsList>
      <TabsContent value="vehicles">
        <MasterList<Vehicle>
          title="Daftar Armada"
          queryKey="vehicles"
          queryFn={getVehiclesPaginated}
          columns={vehicleColumns}
          addHref="/master/fleet/vehicles/add"
          addLabel="Tambah Armada"
          searchPlaceholder="Cari kode atau nomor polisi..."
        />
      </TabsContent>
      <TabsContent value="drivers">
        <MasterList<Driver>
          title="Daftar Sopir"
          queryKey="drivers"
          queryFn={getDriversPaginated}
          columns={driverColumns}
          addHref="/master/fleet/drivers/add"
          addLabel="Tambah Sopir"
          searchPlaceholder="Cari kode atau nama..."
        />
      </TabsContent>
    </Tabs>
  );
}
