"use client";

import { MasterForm, type Field } from "@/components/master/master-form";
import { createCustomer } from "@/actions/master-others";

const fields: Field[] = [
  { name: "code", label: "Kode Pelanggan", required: true, autoCodeEntity: "customers" },
  { name: "name", label: "Nama Pelanggan", required: true },
  { name: "phone", label: "Telepon" },
  { name: "address", label: "Alamat" },
  { name: "creditLimit", label: "Limit Piutang (Rp)", type: "number" },
];

export default function AddCustomerPage() {
  return (
    <MasterForm
      title="Tambah Pelanggan"
      fields={fields}
      defaultValues={{ code: "", name: "", creditLimit: "0" }}
      submit={async (data) => await createCustomer(data as any)}
      backHref="/master/customers"
    />
  );
}
