"use client";

import { useForm } from "react-hook-form";
import { getCompanySettings, saveCompanySettings } from "@/actions/settings-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { useState } from "react";
import Image from "next/image";

export default function CompanySettingsPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({ queryKey: ["company-settings"], queryFn: getCompanySettings });
  const { register, handleSubmit, reset } = useForm();
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      reset({
        ...data,
        permitDate: data.permitDate ? new Date(data.permitDate).toISOString().slice(0, 10) : "",
      });
      setLogo(data.logo);
    }
  }, [data, reset]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const result = await res.json();
    if (result.success) {
      setLogo(result.url);
      toast.success("Logo berhasil diunggah");
    } else {
      toast.error("Gagal mengunggah logo");
    }
  };

  const onSubmit = async (formData: any) => {
    try {
      await saveCompanySettings({
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        latitude: formData.latitude,
        longitude: formData.longitude,
        permitNumber: formData.permitNumber,
        permitDate: formData.permitDate ? new Date(formData.permitDate) : null,
        logo: logo,
      });
      toast.success("Pengaturan perusahaan tersimpan");
    } catch {
      toast.error("Gagal menyimpan pengaturan");
    }
  };


  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <Card className="mx-auto max-w-3xl shadow-sm">
      <CardHeader><CardTitle>Profil Perusahaan</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label>Logo Perusahaan</Label>
            <div className="flex items-center gap-4">
              {logo && (
                <div className="relative h-16 w-16 overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo} alt="Logo" className="h-full w-full object-cover" />
                </div>
              )}
              <Input type="file" accept="image/*" onChange={handleLogoUpload} className="max-w-xs" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Nama Perusahaan</Label><Input {...register("name", { required: true })} /></div>
            <div className="sm:col-span-2"><Label>Alamat</Label><Textarea {...register("address")} rows={2} /></div>
            <div><Label>Telepon</Label><Input {...register("phone")} /></div>
            <div><Label>Email</Label><Input type="email" {...register("email")} /></div>
            <div className="sm:col-span-2"><Label>Website</Label><Input {...register("website")} /></div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><Label>Latitude</Label><Input {...register("latitude")} placeholder="-6.200000" /></div>
            <div><Label>Longitude</Label><Input {...register("longitude")} placeholder="106.816666" /></div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><Label>Nomor Perizinan</Label><Input {...register("permitNumber")} /></div>
            <div><Label>Tanggal Perizinan</Label><Input type="date" {...register("permitDate")} /></div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => router.back()}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
