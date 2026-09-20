"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Database,
  ShoppingCart,
  Warehouse,
  Factory,
  CircleDollarSign,
  Truck,
  FileText,
  Settings,
  Menu,
  X,
  Users,
  Box,
  Store,
  Package,
  Scale,
  ReceiptText,
  Tags,
  CreditCard,
  Wallet,
  BarChart3,
  ShieldCheck,
  Building2,
  ChevronDown,
  Leaf,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type NavChild = { label: string; href: string; icon: React.ElementType };
type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: NavChild[];
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Master Data",
    href: "/master",
    icon: Database,
    children: [
      { label: "Supplier", href: "/master/suppliers", icon: Users },
      { label: "Produk", href: "/master/products", icon: Box },
      { label: "Gudang", href: "/master/warehouses", icon: Store },
      { label: "Pelanggan", href: "/master/customers", icon: Building2 },
      { label: "Armada & Sopir", href: "/master/fleet", icon: Truck },
      { label: "Jenis Potongan", href: "/master/deductions", icon: Tags },
    ],
  },
  {
    label: "Pembelian",
    href: "/purchasing",
    icon: ShoppingCart,
    children: [
      { label: "Pembelian Ketela", href: "/purchasing", icon: ShoppingCart },
      { label: "Penimbangan & Rifaksi", href: "/purchasing/weighing", icon: Scale },
      { label: "Potongan", href: "/purchasing/deductions", icon: ReceiptText },
      { label: "Hutang Supplier", href: "/purchasing/payables", icon: CreditCard },
    ],
  },
  {
    label: "Gudang",
    href: "/warehouse",
    icon: Warehouse,
    children: [
      { label: "Stok Bahan Baku", href: "/warehouse", icon: Package },
      { label: "Stock Ledger", href: "/warehouse/movements", icon: FileText },
      { label: "Produk Jadi", href: "/warehouse/finished", icon: Box },
    ],
  },
  {
    label: "Produksi",
    href: "/production",
    icon: Factory,
    children: [
      { label: "Batch Produksi", href: "/production", icon: Factory },
      { label: "Biaya Produksi", href: "/production/costs", icon: ReceiptText },
      { label: "HPP", href: "/production/hpp", icon: BarChart3 },
    ],
  },
  {
    label: "Penjualan",
    href: "/sales",
    icon: CircleDollarSign,
    children: [
      { label: "Penjualan", href: "/sales", icon: CircleDollarSign },
      { label: "Piutang Pelanggan", href: "/sales/receivables", icon: CreditCard },
    ],
  },
  {
    label: "Armada",
    href: "/fleet",
    icon: Truck,
    children: [
      { label: "Pengiriman", href: "/fleet", icon: Truck },
      { label: "Biaya Solar", href: "/fleet/fuel", icon: Package },
      { label: "Biaya Armada", href: "/fleet/costs", icon: ReceiptText },
    ],
  },
  {
    label: "Keuangan",
    href: "/finance",
    icon: Wallet,
    children: [
      { label: "Kas & Bank", href: "/finance", icon: Wallet },
      { label: "Biaya Operasional", href: "/finance/expenses", icon: ReceiptText },
    ],
  },
  {
    label: "Laporan",
    href: "/reports",
    icon: FileText,
    children: [
      { label: "Semua Laporan", href: "/reports", icon: FileText },
      { label: "Laba Rugi", href: "/reports/profit-loss", icon: BarChart3 },
    ],
  },
  {
    label: "Pengaturan",
    href: "/settings",
    icon: Settings,
    children: [
      { label: "Profil Perusahaan", href: "/settings/company", icon: Building2 },
      { label: "Profil Saya", href: "/settings/profile", icon: Users },
      { label: "User & Role", href: "/settings/users", icon: ShieldCheck },
      { label: "Nomor Dokumen", href: "/settings/numbering", icon: ReceiptText },
      { label: "Audit Log", href: "/settings/audit-log", icon: FileText },
      { label: "Backup & Restore", href: "/settings/backup", icon: Database },
    ],
  },
];

export function Sidebar({ mobileOpen, onMobileClose }: { mobileOpen: boolean; onMobileClose: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedOverride, setExpandedOverride] = useState<string | null>(null);

  const activeGroup = navItems.find(
    (item) => item.children && (pathname === item.href || pathname.startsWith(item.href + "/"))
  )?.label ?? null;
  const expanded = expandedOverride ?? activeGroup;

  const isCollapsed = collapsed;

  const NavContent = (
    <>
      <div className={cn("flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-4")}>
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-sm">
            <Leaf className="h-5 w-5" />
          </span>
          {!isCollapsed && (
            <span className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-wide text-sidebar-foreground">TAPIOKA</span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/50">
                Management System
              </span>
            </span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto hidden text-sidebar-foreground hover:bg-sidebar-accent lg:flex"
          onClick={() => setCollapsed((c) => !c)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
          onClick={onMobileClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const showChildren = !isCollapsed && item.children && expanded === item.label;
          const baseClass = cn(
            "group flex items-center rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200",
            isActive
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isCollapsed && "justify-center"
          );

          return (
            <div key={item.label}>
              {item.children ? (
                <button
                  type="button"
                  title={isCollapsed ? item.label : undefined}
                  onClick={() => {
                    if (isCollapsed) setCollapsed(false);
                    setExpandedOverride(expanded === item.label ? "" : item.label);
                  }}
                  className={cn(baseClass, "w-full cursor-pointer")}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", !isCollapsed && "mr-3")} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", expanded === item.label && "rotate-180")} />
                    </>
                  )}
                </button>
              ) : (
                <Link href={item.href} title={isCollapsed ? item.label : undefined} className={baseClass}>
                  <item.icon className={cn("h-5 w-5 shrink-0", !isCollapsed && "mr-3")} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              )}
              {showChildren && (
                <div className="mt-1 ml-4 space-y-0.5 border-l border-sidebar-border pl-2">
                  {item.children!.map((child) => {
                    const childActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onMobileClose}
                        className={cn(
                          "flex items-center rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                          childActive
                            ? "bg-sidebar-accent text-sidebar-primary"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        <child.icon className="mr-2 h-3.5 w-3.5" />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {!isCollapsed && (
        <div className="shrink-0 border-t border-sidebar-border p-3">
          <div className="rounded-lg bg-sidebar-accent/60 p-3">
            <p className="text-xs font-semibold text-sidebar-foreground">Butuh bantuan?</p>
            <p className="mt-0.5 text-[11px] text-sidebar-foreground/60">Lihat panduan penggunaan sistem.</p>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 hidden flex-col bg-sidebar transition-all duration-300 lg:flex print:hidden",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {NavContent}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onMobileClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar transition-transform duration-300 lg:hidden print:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {NavContent}
      </aside>
    </>
  );
}
