"use client";

import { MasterForm, type Field } from "@/components/master/master-form";
import { createDeductionType } from "@/actions/master-others";

const fields: Field[] = [
  { name: "code", label: "Kode Potongan", required: true, autoCodeEntity: "deductions" },
  { name: "name", label: "Nama Potongan", required: true, placeholder: "Pikulan" },
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

export default function AddDeductionPage() {
  return (
    <MasterForm
      title="Tambah Jenis Potongan"
      fields={fields}
      defaultValues={{ code: "", name: "", calculationType: "per_kg", defaultValue: "0", impactType: "SUPPLIER_DEDUCTION" }}
      submit={async (data) => await createDeductionType(data as any)}
      backHref="/master/deductions"
    />
  );
}
