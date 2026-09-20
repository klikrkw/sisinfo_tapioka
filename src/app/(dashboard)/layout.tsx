"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layouts/sidebar";
import { Topbar } from "@/components/layouts/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col transition-all duration-300 lg:ml-64 print:ml-0">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-6 print:p-0">{children}</main>
        <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground print:hidden">
          © {new Date().getFullYear()} Sistem Informasi Tapioka · Manajemen Ketela & Tepung
        </footer>
      </div>
    </div>
  );
}
