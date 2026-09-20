"use client";

import { MasterList, type Column } from "@/components/master/master-list";
import { getUsersPaginated } from "@/actions/user-actions";
import { Badge } from "@/components/ui/badge";

type User = {
  id: number;
  name: string;
  email: string;
  status: boolean;
  roleName: string | null;
};

const columns: Column<User>[] = [
  { header: "Nama", cell: (r) => <span className="font-medium">{r.name}</span> },
  { header: "Email", cell: (r) => r.email },
  {
    header: "Role",
    cell: (r) => <Badge variant="outline">{r.roleName ?? "-"}</Badge>,
  },
  {
    header: "Status",
    cell: (r) =>
      r.status ? (
        <Badge className="bg-accent text-accent-foreground">Aktif</Badge>
      ) : (
        <Badge variant="destructive">Nonaktif</Badge>
      ),
  },
];

export default function UsersPage() {
  return (
    <MasterList<User>
      title="User & Role Management"
      queryKey="users"
      queryFn={getUsersPaginated}
      columns={columns}
      addHref="/settings/users/add"
      addLabel="Tambah User"
      searchPlaceholder="Cari nama atau email..."
    />
  );
}
