"use client";

import { MasterForm, type Field } from "@/components/master/master-form";
import { createVehicle } from "@/actions/master-others";

const fields: Field[] = [
  { name: "code", label: "Kode Armada", required: true, autoCodeEntity: "vehicles" },
  { name: "policeNumber", label: "Nomor Polisi", required: true, placeholder: "B 9123 KTA" },
  { name: "brand", label: "Merk", placeholder: "Hino" },
  { name: "type", label: "Jenis", placeholder: "Truk Engkel" },
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

export default function AddVehiclePage() {
  return (
    <MasterForm
      title="Tambah Armada"
      fields={fields}
      defaultValues={{ code: "", policeNumber: "", ownership: "Milik Sendiri" }}
      submit={async (data) => await createVehicle(data as any)}
      backHref="/master/fleet"
    />
  );
}
