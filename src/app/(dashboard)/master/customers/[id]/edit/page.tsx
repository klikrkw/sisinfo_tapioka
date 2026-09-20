"use client";

import { MasterForm, type Field } from "@/components/master/master-form";
import { getCustomerById, updateCustomer, deleteCustomer } from "@/actions/master-others";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";

const fields: Field[] = [
  { name: "code", label: "Kode Pelanggan", required: true },
  { name: "name", label: "Nama Pelanggan", required: true },
  { name: "phone", label: "Telepon" },
  { name: "address", label: "Alamat" },
  { name: "creditLimit", label: "Limit Piutang (Rp)", type: "number" },
];

export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => getCustomerById(id),
  });

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <MasterForm
      title="Edit Pelanggan"
      fields={fields}
      defaultValues={customer || {}}
      initialData={customer}
      submit={async (data) => await updateCustomer(id, data as any)}
      deleteAction={async () => await deleteCustomer(id)}
      backHref="/master/customers"
    />
  );
}
