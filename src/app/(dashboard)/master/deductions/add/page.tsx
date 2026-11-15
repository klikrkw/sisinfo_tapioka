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
      { value: "per_sack", label: "Per Sak" },
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
  {
    name: "appliesTo",
    label: "Digunakan Pada",
    options: [
      { value: "RAW_MATERIAL", label: "Pembelian Ketela (bahan baku)" },
      { value: "FINISHED_GOOD", label: "Pembelian Produk Jadi" },
      { value: "BOTH", label: "Keduanya" },
    ],
  },
];

export default function AddDeductionPage() {
  return (
    <MasterForm
      title="Tambah Jenis Potongan"
      fields={fields}
      defaultValues={{ code: "", name: "", calculationType: "per_kg", defaultValue: "0", impactType: "SUPPLIER_DEDUCTION", appliesTo: "BOTH" }}
      submit={async (data) => await createDeductionType(data as any)}
      backHref="/master/deductions"
    />
  );
}
