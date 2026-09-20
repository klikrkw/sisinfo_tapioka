"use client";

import { useQuery } from "@tanstack/react-query";
import { getCompanySettings } from "@/actions/settings-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight, ShieldCheck, Hash, FileText, Database } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const { data } = useQuery({ queryKey: ["company-settings"], queryFn: getCompanySettings });

  const items = [
    { title: "Profil Perusahaan", desc: "Nama, alamat, kontak, logo, peta & perizinan", icon: Building2, href: "/settings/company" },
    { title: "User & Role", desc: "Kelola user, role, dan permission", icon: ShieldCheck, href: "/settings/users" },
    { title: "Nomor Dokumen", desc: "Format penomoran pembelian, produksi, penjualan", icon: Hash, href: "/settings/numbering" },
    { title: "Audit Log", desc: "Riwayat perubahan data penting", icon: FileText, href: "/settings/audit-log" },
    { title: "Backup & Restore", desc: "Cadangkan dan pulihkan data database", icon: Database, href: "/settings/backup" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pengaturan Sistem</h2>
        {data && <p className="text-sm text-muted-foreground">Perusahaan: {data.name}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((it) => (
          <Card key={it.title} className="cursor-pointer" onClick={() => router.push(it.href)}>
            <CardContent className="flex items-center justify-between pt-2">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <it.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">{it.title}</p>
                  <p className="text-xs text-muted-foreground">{it.desc}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
