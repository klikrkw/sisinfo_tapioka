"use client";

import { getExpensesPaginated } from "@/actions/finance-actions";
import { MasterList, type Column } from "@/components/master/master-list";

type Expense = { id: number; date: Date; category: string; name: string; amount: string };

const columns: Column<Expense>[] = [
  { header: "Tanggal", cell: (r) => new Date(r.date).toLocaleDateString("id-ID") },
  { header: "Kategori", cell: (r) => r.category },
  { header: "Nama Biaya", cell: (r) => <span className="font-medium">{r.name}</span> },
  { header: "Jumlah", cell: (r) => <span className="font-mono">Rp {Number(r.amount).toLocaleString("id-ID")}</span> },
];

async function queryExpenses(page: number, limit: number, search?: string) {
  const res = await getExpensesPaginated(page, limit, search);
  return { data: res.data, total: res.total };
}

export default function ExpensesPage() {
  return (
    <MasterList<Expense>
      title="Biaya Operasional"
      queryKey="expenses"
      queryFn={queryExpenses}
      columns={columns}
      addHref="/finance/expenses/add"
      addLabel="Tambah Biaya"
      searchPlaceholder="Cari nama biaya..."
    />
  );
}
