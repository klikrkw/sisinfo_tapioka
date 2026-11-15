"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/purchasing", label: "Pembelian Ketela" },
  { href: "/purchasing/finished", label: "Pembelian Produk Jadi" },
];

export function PurchaseTabs() {
  const pathname = usePathname();

  return (
    <div className="flex w-fit flex-wrap gap-1 rounded-xl border bg-card p-1 shadow-sm">
      {tabs.map((tab) => {
        const active =
          tab.href === "/purchasing" ? pathname === "/purchasing" || pathname === "/purchasing/add" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
