"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, Search, Bell, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserMenu } from "@/components/layouts/user-menu";
import Link from "next/link";

function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const labels: Record<string, string> = {
    dashboard: "Dashboard",
    master: "Master Data",
    suppliers: "Supplier",
    products: "Produk",
    warehouses: "Gudang",
    customers: "Pelanggan",
    fleet: "Armada & Sopir",
    deductions: "Jenis Potongan",
    purchasing: "Pembelian",
    warehouse: "Gudang",
    production: "Produksi",
    sales: "Penjualan",
    finance: "Keuangan",
    reports: "Laporan",
    settings: "Pengaturan",
    users: "User & Role",
    add: "Tambah",
    edit: "Edit",
  };

  return (
    <nav className="hidden items-center gap-1 text-sm md:flex">
      {segments.map((seg, i) => {
        const href = "/" + segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        return (
          <span key={href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            {isLast ? (
              <span className="font-semibold text-foreground">{labels[seg] ?? seg}</span>
            ) : (
              <Link href={href} className="text-muted-foreground transition-colors hover:text-foreground">
                {labels[seg] ?? seg}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:px-6 print:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Buka menu navigasi"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Breadcrumb />

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari transaksi, supplier..."
            className="w-56 pl-8 lg:w-72"
          />
        </div>
        <Button variant="ghost" size="icon" aria-label="Notifikasi" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
        </Button>
        <UserMenu />
      </div>
    </header>
  );
}
