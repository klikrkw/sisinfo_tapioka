"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReceivables, recordReceivablePayment } from "@/actions/sales-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, CheckCircle2, Clock, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Receivable = {
  id: number;
  number: string;
  date: Date;
  dueDate: Date | null;
  totalAmount: string;
  status: string | null;
  customerName: string;
  paidTotal: number;
  outstanding: number;
  payments: { id: number; date: Date; amount: string }[];
};

const statusStyle: Record<string, string> = {
  Lunas: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  Sebagian: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  "Belum Bayar": "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
};

const statusIcon: Record<string, React.ElementType> = {
  Lunas: CheckCircle2,
  Sebagian: Clock,
  "Belum Bayar": Clock,
};

const paymentStatus = (r: Receivable) =>
  r.outstanding <= 0 ? "Lunas" : r.paidTotal > 0 ? "Sebagian" : "Belum Bayar";

export default function ReceivablesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "Lunas" | "Sebagian" | "Belum Bayar">("all");
  const limit = 10;

  const { data, isLoading } = useQuery({ queryKey: ["receivables"], queryFn: getReceivables });

  const all = data ?? [];
  const filtered = all.filter((r) => {
    const matchSearch = r.customerName.toLowerCase().includes(search.toLowerCase()) || r.number.toLowerCase().includes(search.toLowerCase());
    const st = paymentStatus(r);
    return matchSearch && (filter === "all" || st === filter);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const pageData = filtered.slice((page - 1) * limit, page * limit);

  const summary = all.reduce(
    (acc, r) => {
      acc.total += Number(r.totalAmount);
      acc.paid += r.paidTotal;
      acc.outstanding += r.outstanding;
      return acc;
    },
    { total: 0, paid: 0, outstanding: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center justify-between pt-2">
          <div><p className="text-xs text-muted-foreground">Total Piutang</p><p className="font-mono text-lg font-bold">Rp {summary.total.toLocaleString("id-ID")}</p></div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400"><Wallet className="h-5 w-5" /></span>
        </CardContent></Card>
        <Card><CardContent className="flex items-center justify-between pt-2">
          <div><p className="text-xs text-muted-foreground">Sudah Diterima</p><p className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">Rp {summary.paid.toLocaleString("id-ID")}</p></div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-5 w-5" /></span>
        </CardContent></Card>
        <Card><CardContent className="flex items-center justify-between pt-2">
          <div><p className="text-xs text-muted-foreground">Sisa Piutang</p><p className="font-mono text-lg font-bold text-red-600 dark:text-red-400">Rp {summary.outstanding.toLocaleString("id-ID")}</p></div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400"><Clock className="h-5 w-5" /></span>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Piutang Pelanggan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nomor atau pelanggan..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8"
              />
            </div>
            <div className="flex gap-1">
              {(["all", "Belum Bayar", "Sebagian", "Lunas"] as const).map((f) => (
                <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => { setFilter(f); setPage(1); }}>
                  {f === "all" ? "Semua" : f}
                </Button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : pageData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Penjualan</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Diterima</TableHead>
                  <TableHead className="text-right">Sisa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.map((r) => {
                  const st = paymentStatus(r);
                  const Icon = statusIcon[st] ?? Clock;
                  const overdue = r.dueDate && new Date(r.dueDate) < new Date() && r.outstanding > 0;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-medium">{r.number}</TableCell>
                      <TableCell>{r.customerName}</TableCell>
                      <TableCell className={overdue ? "font-medium text-red-600 dark:text-red-400" : ""}>
                        {r.dueDate ? new Date(r.dueDate).toLocaleDateString("id-ID") : "-"}
                        {overdue && <span className="ml-1 text-xs">(lewat)</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono">Rp {Number(r.totalAmount).toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400">Rp {r.paidTotal.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right font-mono text-red-600 dark:text-red-400">Rp {r.outstanding.toLocaleString("id-ID")}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle[st]}`}>
                          <Icon className="h-3 w-3" /> {st}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/sales/${r.id}`)}>Invoice</Button>
                          <PaymentDialog receivable={r} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada piutang.</p>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Halaman {page} dari {totalPages} · Total {filtered.length}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentDialog({ receivable }: { receivable: Receivable }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(receivable.outstanding > 0 ? receivable.outstanding : ""));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: (payAmount: number) => recordReceivablePayment(receivable.id, payAmount, date, notes || undefined),
    onSuccess: () => {
      toast.success("Pembayaran pelanggan dicatat");
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      setOpen(false);
      setNotes("");
    },
    onError: () => toast.error("Gagal mencatat pembayaran"),
  });

  const isLunas = receivable.outstanding <= 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={isLunas ? "ghost" : "outline"} size="sm" disabled={isLunas}>
            {isLunas ? "Lunas" : "Bayar"}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pembayaran Pelanggan {receivable.number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Pelanggan</p><p className="font-semibold">{receivable.customerName}</p></div>
            <div><p className="text-xs text-muted-foreground">Sisa Piutang</p><p className="font-mono font-semibold text-red-600 dark:text-red-400">Rp {receivable.outstanding.toLocaleString("id-ID")}</p></div>
          </div>

          {receivable.payments.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Riwayat Pembayaran</p>
              <div className="space-y-1">
                {receivable.payments.map((pm) => (
                  <div key={pm.id} className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1 text-sm">
                    <span className="text-muted-foreground">{new Date(pm.date).toLocaleDateString("id-ID")}</span>
                    <span className="font-mono">Rp {Number(pm.amount).toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label>Tanggal Pembayaran</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Jumlah Diterima (Rp)</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button
              type="button"
              className="mt-1 text-xs text-accent hover:underline"
              onClick={() => setAmount(String(receivable.outstanding))}
            >
              Lunasi: Rp {receivable.outstanding.toLocaleString("id-ID")}
            </button>
          </div>
          <div>
            <Label>Catatan</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opsional" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button
              variant="secondary"
              onClick={() => mutation.mutate(receivable.outstanding)}
              disabled={receivable.outstanding <= 0 || mutation.isPending}
            >
              Lunasi Penuh
            </Button>
            <Button
              onClick={() => mutation.mutate(Number(amount))}
              disabled={!amount || Number(amount) <= 0 || mutation.isPending}
            >
              Simpan Pembayaran
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
