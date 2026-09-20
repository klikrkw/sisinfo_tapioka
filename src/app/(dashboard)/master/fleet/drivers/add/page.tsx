"use client";

import { MasterForm, type Field } from "@/components/master/master-form";
import { createDriver } from "@/actions/master-others";

const fields: Field[] = [
  { name: "code", label: "Kode Sopir", required: true, autoCodeEntity: "drivers" },
  { name: "name", label: "Nama Sopir", required: true },
  { name: "phone", label: "Telepon" },
  { name: "address", label: "Alamat" },
  { name: "licenseNumber", label: "No. SIM" },
  { name: "licenseType", label: "Jenis SIM", placeholder: "A / B1" },
  { name: "licenseExpiry", label: "Masa Berlaku SIM", type: "date" },
];

export default function AddDriverPage() {
  return (
    <MasterForm
      title="Tambah Sopir"
      fields={fields}
      defaultValues={{ code: "", name: "" }}
      submit={async (data) => await createDriver(data as any)}
      backHref="/master/fleet"
    />
  );
}
