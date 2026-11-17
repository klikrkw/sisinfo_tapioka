"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { getUnits, createUnit } from "@/actions/unit-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const NEW_UNIT = "__new_unit";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

/**
 * Select satuan yang datanya berasal dari master `units`,
 * lengkap dengan dialog tambah satuan baru.
 */
export function UnitSelect({ value, onChange }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: units } = useQuery({ queryKey: ["units"], queryFn: () => getUnits() });
  const known = units?.some((u) => u.name === value);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const unit = await createUnit(name);
      await queryClient.invalidateQueries({ queryKey: ["units"] });
      onChange(unit.name);
      toast.success(`Satuan "${unit.name}" ditambahkan`);
      setOpen(false);
      setName("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menambah satuan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <select
        className={selectClass}
        value={value}
        onChange={(e) => {
          if (e.target.value === NEW_UNIT) {
            setName("");
            setOpen(true);
            return;
          }
          onChange(e.target.value);
        }}
      >
        <option value="">Pilih satuan</option>
        {units?.map((u) => (
          <option key={u.id} value={u.name}>{u.name}</option>
        ))}
        {value && !known && <option value={value}>{value}</option>}
        <option value={NEW_UNIT}>+ Tambah satuan baru…</option>
      </select>
      <p className="mt-1 text-xs text-muted-foreground">
        Satuan dipakai untuk stok, pembelian, dan penjualan.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Tambah Satuan Baru
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nama Satuan</Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave();
                }
              }}
              placeholder="Contoh: Kg, Sak, Pcs, Liter"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="button" onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? "Menyimpan..." : "Simpan Satuan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
