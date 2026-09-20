"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Factory, Leaf, ShieldCheck, TrendingUp, Warehouse } from "lucide-react";

const highlights = [
  { icon: Factory, title: "Pembelian & Rifaksi", desc: "Timbang, rifaksi, potongan otomatis" },
  { icon: Warehouse, title: "Stock Ledger", desc: "Riwayat stok immutable per gudang" },
  { icon: TrendingUp, title: "HPP & Margin", desc: "Lacak HPP hingga penjualan" },
  { icon: ShieldCheck, title: "Role & Audit", desc: "Permission granular + audit log" },
];

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">Memuat...</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, handleSubmit } = useForm({ defaultValues: { email: "", password: "" } });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: { email: string; password: string }) => {
    setLoading(true);
    const res = await signIn("credentials", { ...data, redirect: false });
    setLoading(false);
    if (res?.error) {
      toast.error("Email atau password salah");
      return;
    }
    toast.success("Login berhasil");
    router.push(searchParams.get("callbackUrl") ?? "/dashboard");
    router.refresh();
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-sidebar-primary/30 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-lg">
            <Leaf className="h-6 w-6" />
          </span>
          <div>
            <p className="text-lg font-bold tracking-wide">TAPIOKA</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-sidebar-foreground/50">Management System</p>
          </div>
        </div>

        <div className="relative mt-auto">
          <h1 className="max-w-md text-3xl font-bold leading-tight">
            Kelola ketela hingga tepung dalam satu sistem terintegrasi.
          </h1>
          <p className="mt-3 max-w-md text-sm text-sidebar-foreground/70">
            Pembelian, penimbangan, rifaksi, produksi, HPP, penjualan, dan armada — tercatat rapi dan dapat diaudit.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {highlights.map((h) => (
              <div key={h.title} className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/40 p-3 backdrop-blur">
                <h.icon className="h-5 w-5 text-accent" />
                <p className="mt-2 text-sm font-semibold">{h.title}</p>
                <p className="mt-0.5 text-xs text-sidebar-foreground/60">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md shadow-md">
          <CardHeader className="items-center text-center">
            <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-sm lg:hidden">
              <Leaf className="h-6 w-6" />
            </span>
            <CardTitle className="text-xl">Masuk ke Akun</CardTitle>
            <CardDescription>Gunakan email dan password Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="admin@tapioka.id" autoComplete="email" {...register("email", { required: true })} />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" placeholder="••••••••" autoComplete="current-password" {...register("password", { required: true })} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Memproses..." : "Masuk"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Demo: <span className="font-mono">admin@tapioka.id</span> / <span className="font-mono">admin123</span>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
