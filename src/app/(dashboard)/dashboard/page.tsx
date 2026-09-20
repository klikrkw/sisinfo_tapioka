"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@/actions/dashboard-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Users,
  Box,
  Wallet,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const trendData = [
  { name: "Apr", pembelian: 120, produksi: 80, penjualan: 210 },
  { name: "Mei", pembelian: 145, produksi: 95, penjualan: 240 },
  { name: "Jun", pembelian: 132, produksi: 88, penjualan: 225 },
  { name: "Jul", pembelian: 168, produksi: 110, penjualan: 280 },
  { name: "Agu", pembelian: 155, produksi: 102, penjualan: 260 },
  { name: "Sep", pembelian: 190, produksi: 125, penjualan: 310 },
];

const costData = [
  { name: "Bahan Baku", value: 14.4 },
  { name: "Tenaga", value: 2.0 },
  { name: "Listrik", value: 1.5 },
  { name: "Reparasi", value: 0.5 },
  { name: "Sak", value: 0.3 },
  { name: "Lainnya", value: 0.2 },
];

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
  });

  const kpis = [
    {
      title: "Total Pembelian",
      value: isLoading ? "..." : formatRp(data?.purchaseTotal ?? 0),
      sub: `${data?.purchaseCount ?? 0} transaksi`,
      icon: ShoppingCart,
      tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Supplier Aktif",
      value: isLoading ? "..." : String(data?.supplierCount ?? 0),
      sub: "Total terdaftar",
      icon: Users,
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Produk & Bahan",
      value: isLoading ? "..." : String(data?.productCount ?? 0),
      sub: "Bahan + produk jadi",
      icon: Box,
      tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      title: "Estimasi Margin",
      value: "Rp 2,5 Jt",
      sub: "+12% bulan ini",
      icon: Wallet,
      tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Ringkasan operasional ketela, produksi tepung, dan penjualan.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="overflow-hidden">
            <CardContent className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{kpi.title}</p>
                {isLoading ? (
                  <Skeleton className="mt-2 h-8 w-28" />
                ) : (
                  <p className="mt-2 truncate text-2xl font-bold">{kpi.value}</p>
                )}
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3.5 w-3.5 text-accent" />
                  {kpi.sub}
                </p>
              </div>
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${kpi.tone}`}>
                <kpi.icon className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" /> Tren Pembelian, Produksi & Penjualan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gPurchase" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gSale" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-5)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--chart-5)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--popover)",
                      color: "var(--popover-foreground)",
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="penjualan" stroke="var(--chart-5)" fill="url(#gSale)" strokeWidth={2} />
                  <Area type="monotone" dataKey="pembelian" stroke="var(--chart-1)" fill="url(#gPurchase)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Komposisi Biaya Produksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costData} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} unit=" Jt" />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={11} width={72} />
                  <Tooltip
                    formatter={(v) => [`Rp ${v} Jt`, "Biaya"]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--popover)",
                      color: "var(--popover-foreground)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Purchases */}
      <Card>
        <CardHeader>
          <CardTitle>Pembelian Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : data?.recentPurchases.length ? (
            <div className="divide-y">
              {data.recentPurchases.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <ShoppingCart className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{p.number}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.date).toLocaleDateString("id-ID")} · {Number(p.grossWeight).toLocaleString("id-ID")} Kg
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono">{formatRp(Number(p.netAmount))}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada transaksi pembelian.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
