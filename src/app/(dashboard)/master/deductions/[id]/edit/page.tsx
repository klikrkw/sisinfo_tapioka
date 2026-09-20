"use client";

import { MasterForm, type Field } from "@/components/master/master-form";
import { getDeductionTypeById, updateDeductionType, deleteDeductionType } from "@/actions/master-others";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";

const fields: Field[] = [
  { name: "code", label: "Kode Potongan", required: true },
  { name: "name", label: "Nama Potongan", required: true },
  {
    name: "calculationType",
    label: "Metode Hitung",
    options: [
      { value: "fixed", label: "Fixed (Tetap)" },
      { value: "per_kg", label: "Per Kg" },
      { value: "percentage", label: "Persentase (%)" },
    ],
  },
  { name: "defaultValue", label: "Nilai Default", type: "number", step: "0.01" },
  {
    name: "impactType",
    label: "Dampak Finansial",
    options: [
      { value: "SUPPLIER_DEDUCTION", label: "Pengurang Pembayaran Supplier" },
      { value: "PURCHASE_COST", label: "Menambah Biaya Pembelian" },
      { value: "PRODUCTION_COST", label: "Menambah Biaya Produksi" },
      { value: "OTHER", label: "Lainnya" },
    ],
  },
];

export default function EditDeductionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);

  const { data: ded, isLoading } = useQuery({
    queryKey: ["deduction", id],
    queryFn: () => getDeductionTypeById(id),
  });

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <MasterForm
      title="Edit Jenis Potongan"
      fields={fields}
      defaultValues={ded || {}}
      initialData={ded}
      submit={async (data) => await updateDeductionType(id, data as any)}
      deleteAction={async () => await deleteDeductionType(id)}
      backHref="/master/deductions"
    />
  );
}
