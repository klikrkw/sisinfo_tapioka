"use client";

import { MasterList, type Column } from "@/components/master/master-list";
import { getCustomersPaginated } from "@/actions/master-others";
import { Badge } from "@/components/ui/badge";

type Customer = { id: number; code: string; name: string; phone: string | null; creditLimit: string | null; status: boolean };

const columns: Column<Customer>[] = [
  { header: "Kode", cell: (r) => <span className="font-medium">{r.code}</span> },
  { header: "Nama Pelanggan", cell: (r) => r.name },
  { header: "Telepon", cell: (r) => r.phone ?? "-" },
  { header: "Limit Piutang", cell: (r) => `Rp ${Number(r.creditLimit || 0).toLocaleString("id-ID")}` },
];

export default function CustomersPage() {
  return (
    <MasterList<Customer>
      title="Daftar Pelanggan"
      queryKey="customers"
      queryFn={getCustomersPaginated}
      columns={columns}
      addHref="/master/customers/add"
      addLabel="Tambah Pelanggan"
      searchPlaceholder="Cari kode atau nama..."
    />
  );
}
