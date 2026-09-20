"use client";

import { MasterForm, type Field } from "@/components/master/master-form";
import { getDriverById, updateDriver, deleteDriver } from "@/actions/master-others";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";

const fields: Field[] = [
  { name: "code", label: "Kode Sopir", required: true },
  { name: "name", label: "Nama Sopir", required: true },
  { name: "phone", label: "Telepon" },
  { name: "address", label: "Alamat" },
  { name: "licenseNumber", label: "No. SIM" },
  { name: "licenseType", label: "Jenis SIM" },
  { name: "licenseExpiry", label: "Masa Berlaku SIM", type: "date" },
];

export default function EditDriverPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);

  const { data: driver, isLoading } = useQuery({
    queryKey: ["driver", id],
    queryFn: () => getDriverById(id),
  });

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  const initialData = driver
    ? { ...driver, licenseExpiry: driver.licenseExpiry ? new Date(driver.licenseExpiry).toISOString().slice(0, 10) : "" }
    : {};

  return (
    <MasterForm
      title="Edit Sopir"
      fields={fields}
      defaultValues={initialData}
      initialData={initialData}
      submit={async (data) => await updateDriver(id, data as any)}
      deleteAction={async () => await deleteDriver(id)}
      backHref="/master/fleet"
    />
  );
}
