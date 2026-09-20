"use client";

import { useForm } from "react-hook-form";
import { createUser, getRoles } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export default function AddUserPage() {
  const router = useRouter();
  const { register, handleSubmit } = useForm({
    defaultValues: { name: "", email: "", password: "", roleId: "" },
  });

  const { data: roles } = useQuery({ queryKey: ["roles"], queryFn: getRoles });

  const onSubmit = async (data: any) => {
    try {
      await createUser({
        name: data.name,
        email: data.email,
        password: data.password,
        roleId: Number(data.roleId),
      });
      toast.success("User berhasil ditambah");
      router.push("/settings/users");
    } catch {
      toast.error("Gagal menambah user");
    }
  };

  return (
    <Card className="mx-auto max-w-2xl shadow-sm">
      <CardHeader>
        <CardTitle>Tambah User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nama</Label>
            <Input {...register("name", { required: true })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" {...register("email", { required: true })} />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" {...register("password", { required: true, minLength: 6 })} />
          </div>
          <div>
            <Label>Role</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("roleId", { required: true })}
            >
              <option value="">Pilih Role</option>
              {roles?.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => router.back()}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
