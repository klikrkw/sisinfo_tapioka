"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSaleById, recordReceivablePayment } from "@/actions/sales-actions";
import { getProducts } from "@/actions/master-actions";
import { getCompanySettings } from "@/actions/settings-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Printer, Leaf } from "lucide-react";

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const saleId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: sale, isLoading } = useQuery({ queryKey: ["sale", saleId], queryFn: () => getSaleById(saleId) });
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const { data: company } = useQuery({ queryKey: ["company-settings"], queryFn: getCompanySettings });

  const payMutation = useMutation({
    mutationFn: () => recordReceivablePayment(saleId, Number(payAmount), payDate),
    onSuccess: () => {
      toast.success("Pembayaran piutang dicatat");
      queryClient.invalidateQueries({ queryKey: ["sale", saleId] });
      setPayAmount("");
    },
    onError: () => toast.error("Gagal mencatat pembayaran"),
  });

  if (isLoading) return <div className="space-y-4">{[0, 1].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;
  if (!sale) return <div className="p-8 text-center text-muted-foreground">Transaksi tidak ditemukan.</div>;

  const productName = (pid: number) => products?.find((p) => p.id === pid)?.name ?? `#${pid}`;
  const isCredit = sale.paymentMethod === "Credit";
  const paidTotal = isCredit
    ? sale.payments.reduce((a, p) => a + Number(p.amount), 0)
    : Number(sale.totalAmount);
  const outstanding = isCredit ? Number(sale.totalAmount) - paidTotal : 0;
  const customer = sale.customer as { name: string; address: string | null; phone: string | null } | null;

  return (
    <>
      {/* ===== Tampilan Layar ===== */}
      <div className="space-y-6 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Penjualan {sale.number}</h2>
            <p className="text-sm text-muted-foreground">
              {new Date(sale.date).toLocaleDateString("id-ID")} · {sale.paymentMethod}
              {sale.dueDate ? ` · Jatuh tempo ${new Date(sale.dueDate).toLocaleDateString("id-ID")}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge>{sale.status}</Badge>
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Cetak Invoice
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/sales")}>Kembali</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card><CardContent className="pt-2"><p className="text-xs text-muted-foreground">Total</p><p className="font-mono text-lg font-bold">{formatRp(Number(sale.totalAmount))}</p></CardContent></Card>
          <Card><CardContent className="pt-2"><p className="text-xs text-muted-foreground">Dibayar</p><p className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatRp(paidTotal)}</p></CardContent></Card>
          <Card><CardContent className="pt-2">
            <p className="text-xs text-muted-foreground">{isCredit ? "Sisa Piutang" : "Status Bayar"}</p>
            {isCredit ? (
              <p className="font-mono text-lg font-bold text-red-600 dark:text-red-400">{formatRp(outstanding)}</p>
            ) : (
              <p className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">Lunas</p>
            )}
          </CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Item Penjualan</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Produk</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Harga</TableHead><TableHead className="text-right">Diskon</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader>
              <TableBody>
                {sale.items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium">{productName(it.productId)}</TableCell>
                    <TableCell className="text-right font-mono">{Number(it.quantity).toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right font-mono">{formatRp(Number(it.price))}</TableCell>
                    <TableCell className="text-right font-mono">{formatRp(Number(it.discount))}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">{formatRp(Number(it.subtotal))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {sale.paymentMethod === "Credit" && (
          <Card>
            <CardHeader><CardTitle>Pembayaran Piutang</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {sale.payments.length > 0 && (
                <Table>
                  <TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead className="text-right">Jumlah</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {sale.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{new Date(p.date).toLocaleDateString("id-ID")}</TableCell>
                        <TableCell className="text-right font-mono">{formatRp(Number(p.amount))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {outstanding > 0 && (
                <div className="flex flex-wrap items-end gap-3">
                  <div><Label>Tanggal</Label><Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="w-40" /></div>
                  <div><Label>Jumlah (Rp)</Label><Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="w-48" /></div>
                  <Button onClick={() => payMutation.mutate()} disabled={!payAmount || payMutation.isPending}>Catat Pembayaran</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ===== INVOICE (Cetak) ===== */}
      <div id="invoice" className="hidden print:block bg-white p-8 print:p-0 text-black">
        {/* Kop Surat */}
        <div className="border-b-2 border-gray-800 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {company?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={company.logo} alt="Logo" className="h-14 w-14 object-contain" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-800 text-white print:bg-gray-800 print:text-white">
                  <Leaf className="h-6 w-6" />
                </span>
              )}
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-wide">{company?.name ?? "Perusahaan Tapioka"}</h1>
                <p className="text-xs text-gray-700">{company?.address ?? "Alamat perusahaan"}</p>
                <p className="text-xs text-gray-700">
                  {[company?.phone, company?.email].filter(Boolean).join(" · ") || "Telepon / Email"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold uppercase">Invoice</h2>
              <p className="text-sm font-mono">{sale.number}</p>
              <p className="text-xs text-gray-700">{new Date(sale.date).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>
        </div>

        {/* Info Pelanggan */}
        <div className="mt-6 grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Kepada Yth.</p>
            <p className="mt-1 font-semibold">{customer?.name ?? "-"}</p>
            <p className="text-xs text-gray-700">{customer?.address ?? "-"}</p>
            {customer?.phone && <p className="text-xs text-gray-700">Telp: {customer.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Metode Pembayaran</p>
            <p className="mt-1 font-semibold">{sale.paymentMethod}</p>
            {sale.dueDate && (
              <>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-gray-500">Jatuh Tempo</p>
                <p className="text-xs">{new Date(sale.dueDate).toLocaleDateString("id-ID")}</p>
              </>
            )}
          </div>
        </div>

        {/* Tabel Item */}
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-800 text-left">
              <th className="py-2">No</th>
              <th className="py-2">Produk</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Harga</th>
              <th className="py-2 text-right">Diskon</th>
              <th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((it, idx) => (
              <tr key={it.id} className="border-b border-gray-300">
                <td className="py-2">{idx + 1}</td>
                <td className="py-2">{productName(it.productId)}</td>
                <td className="py-2 text-right font-mono">{Number(it.quantity).toLocaleString("id-ID")}</td>
                <td className="py-2 text-right font-mono">{formatRp(Number(it.price))}</td>
                <td className="py-2 text-right font-mono">{formatRp(Number(it.discount))}</td>
                <td className="py-2 text-right font-mono font-semibold">{formatRp(Number(it.subtotal))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="py-2 text-right font-bold">Total</td>
              <td className="py-2 text-right font-mono text-lg font-bold">{formatRp(Number(sale.totalAmount))}</td>
            </tr>
            {sale.paymentMethod === "Credit" && (
              <tr>
                <td colSpan={5} className="py-1 text-right text-xs">Terbayar: {formatRp(paidTotal)} · Sisa: {formatRp(outstanding)}</td>
                <td></td>
              </tr>
            )}
          </tfoot>
        </table>

        {/* Tanda Tangan */}
        <div className="mt-16 grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs">Penerima,</p>
            <div className="h-20" />
            <p className="text-sm font-semibold underline">{customer?.name ?? "................"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs">{company?.name ?? "Perusahaan"},</p>
            <div className="h-20" />
            <p className="text-sm font-semibold underline">( ______________ )</p>
          </div>
        </div>
      </div>
    </>
  );
}
