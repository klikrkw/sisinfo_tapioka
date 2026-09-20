"use client";

import { MasterForm, type Field } from "@/components/master/master-form";
import { getVehicleById, updateVehicle, deleteVehicle } from "@/actions/master-others";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";

const fields: Field[] = [
  { name: "code", label: "Kode Armada", required: true },
  { name: "policeNumber", label: "Nomor Polisi", required: true },
  { name: "brand", label: "Merk" },
  { name: "type", label: "Jenis" },
  { name: "capacity", label: "Kapasitas (Kg)", type: "number", step: "0.01" },
  {
    name: "ownership",
    label: "Kepemilikan",
    options: [
      { value: "Milik Sendiri", label: "Milik Sendiri" },
      { value: "Sewa", label: "Sewa" },
      { value: "Pihak Ketiga", label: "Pihak Ketiga" },
    ],
  },
];

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => getVehicleById(id),
  });

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <MasterForm
      title="Edit Armada"
      fields={fields}
      defaultValues={vehicle || {}}
      initialData={vehicle}
      submit={async (data) => await updateVehicle(id, data as any)}
      deleteAction={async () => await deleteVehicle(id)}
      backHref="/master/fleet"
    />
  );
}
