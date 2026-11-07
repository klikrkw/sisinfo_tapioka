"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

export type PurchaseReceiptData = {
  number: string;
  date: string;
  supplierName: string;
  materialName: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  refactionWeight: number;
  payableWeight: number;
  pricePerKg: number;
  baseAmount: number;
  policeNumber?: string;
  poNumber?: string;
  entryTime?: string;
  exitDate?: string;
  exitTime?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
};

const MM = 10;
const PAGE_W = 148; // A5 portrait
const RIGHT = PAGE_W - MM;

async function buildReceiptPdf(data: PurchaseReceiptData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a5", orientation: "portrait" });

  const truncate = (text: string, maxWidth: number) => {
    if (!text) return "-";
    if (doc.getTextWidth(text) <= maxWidth) return text;
    let s = text;
    while (s.length > 1 && doc.getTextWidth(s + "…") > maxWidth) s = s.slice(0, -1);
    return s + "…";
  };

  const fmt = (n: number) =>
    Number(n || 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });
  const fmtDate = (value: string) => {
    if (!value) return "-";
    const d = new Date(value);
    return isNaN(d.getTime())
      ? value
      : d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  let y = 15;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(data.companyName || "Nama Perusahaan", MM, y);
  y += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  if (data.companyAddress) {
    const lines = doc.splitTextToSize(data.companyAddress, RIGHT - MM);
    doc.text(lines, MM, y);
    y += lines.length * 3.4;
  }
  if (data.companyPhone) {
    doc.text(`Telp: ${data.companyPhone}`, MM, y);
    y += 3.4;
  }

  // Dotted separator
  y += 1.5;
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([0.8, 0.8], 0);
  doc.line(MM, y, RIGHT, y);
  doc.setLineDashPattern([], 0);
  y += 6;

  // Identity rows
  const colonX = 44;
  const valueX = 48;
  const row = (label: string, value: string, gap = 5.2) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(label, MM, y);
    doc.text(":", colonX, y);
    doc.text(truncate(value, RIGHT - valueX), valueX, y);
    y += gap;
  };

  row("NO. RECORD", data.number);
  row("NO. POLISI", data.policeNumber || "-");
  row("SUPPLIER", data.supplierName);
  row("MATERIAL", data.materialName);
  row("NO. PO/DO", data.poNumber || "-");

  // Masuk / Keluar rows
  doc.setFontSize(9);
  doc.text("MASUK", MM, y);
  doc.text("TGL", 44, y);
  doc.text(fmtDate(data.date), 54, y);
  doc.text("JAM", 100, y);
  doc.text(data.entryTime || "-", 112, y);
  y += 5.2;
  doc.text("KELUAR", MM, y);
  doc.text("TGL", 44, y);
  doc.text(data.exitDate ? fmtDate(data.exitDate) : "-", 54, y);
  doc.text("JAM", 100, y);
  doc.text(data.exitTime || "-", 112, y);
  y += 4;

  const weightRow = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 10.5 : 10);
    doc.text(label, MM, y);
    doc.text(":", colonX, y);
    doc.text(value, RIGHT, y, { align: "right" });
    y += bold ? 6.5 : 6;
  };

  weightRow("BRUTO", `${fmt(data.grossWeight)} Kg`);
  weightRow("TARA", `${fmt(data.tareWeight)} Kg`);

  // Line above netto
  y -= 1.5;
  doc.setLineWidth(0.3);
  doc.line(colonX, y, RIGHT, y);
  y += 5;

  weightRow("NETTO", `${fmt(data.netWeight)} Kg`, true);

  // Detail rifaksi / pembayaran
  y += 1;
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([0.8, 0.8], 0);
  doc.line(MM, y, RIGHT, y);
  doc.setLineDashPattern([], 0);
  y += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Rifaksi: ${fmt(data.refactionWeight)} Kg`, MM, y);
  doc.text(`Berat Dibayar: ${fmt(data.payableWeight)} Kg`, RIGHT, y, { align: "right" });
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("KET", MM, y);
  doc.text(":", colonX, y);
  doc.text(`${fmt(data.payableWeight)} x ${fmt(data.pricePerKg)}`, valueX, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Nilai Bahan Baku", MM, y);
  doc.text(":", colonX, y);
  doc.text(`Rp ${fmt(data.baseAmount)}`, RIGHT, y, { align: "right" });
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TOTAL", MM, y);
  doc.text(":", colonX, y);
  doc.text(`Rp ${fmt(data.baseAmount)}`, RIGHT, y, { align: "right" });

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text(
    `Dicetak ${new Date().toLocaleString("id-ID")}`,
    MM,
    210 - 8
  );
  doc.setTextColor(0);

  return doc;
}

export function PurchaseReceiptDialog({
  open,
  onOpenChange,
  data,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PurchaseReceiptData | null;
}) {
  const [url, setUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";
    if (!open || !data) return;

    buildReceiptPdf(data)
      .then((doc) => {
        if (cancelled) return;
        const blob = doc.output("blob");
        objectUrl = URL.createObjectURL(blob);
        setError("");
        setUrl(objectUrl);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Gagal membuat PDF");
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, data]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setUrl("");
      setError("");
    }
    onOpenChange(next);
  };

  const fileName = `nota-pembelian-${data?.number ?? "transaksi"}.pdf`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Nota Pembelian
          </DialogTitle>
        </DialogHeader>

        <div className="h-[65vh] w-full overflow-hidden rounded-lg border bg-muted">
          {error ? (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-destructive">
              {error}
            </div>
          ) : url ? (
            <iframe src={url} title="Preview Nota Pembelian" className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Membuat PDF...
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>
            Tutup
          </Button>
          <a
            href={url || undefined}
            download={fileName}
            aria-disabled={!url}
            className={buttonVariants({ variant: "default" }) + (!url ? " pointer-events-none opacity-50" : "")}
          >
            <Download className="h-4 w-4" /> Download PDF
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
