"use client";

import { useForm } from "react-hook-form";
import { updateUser, getUserById, getRoles, deleteUser } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: "", email: "", password: "", roleId: "" },
  });

  const { data: user, isLoading } = useQuery({ queryKey: ["user", id], queryFn: () => getUserById(id) });
  const { data: roles } = useQuery({ queryKey: ["roles"], queryFn: getRoles });

  useEffect(() => {
    if (user) {
      reset({ name: user.name, email: user.email, roleId: String(user.roleId), password: "" });
    }
  }, [user, reset]);

  const deleteMut = useMutation({
    mutationFn: () => deleteUser(id),
    onSuccess: () => {
      toast.success("User dinonaktifkan");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      router.push("/settings/users");
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await updateUser(id, {
        name: data.name,
        email: data.email,
        roleId: Number(data.roleId),
        password: data.password || undefined,
      });
      toast.success("User berhasil diupdate");
      router.push("/settings/users");
    } catch {
      toast.error("Gagal update user");
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <Card className="mx-auto max-w-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Edit User</CardTitle>
        <Button variant="destructive" size="sm" onClick={() => { if (confirm("Nonaktifkan user ini?")) deleteMut.mutate(); }}>
          <Trash2 className="mr-2 h-4 w-4" /> Nonaktifkan
        </Button>
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
            <Label>Password (kosongkan jika tidak diubah)</Label>
            <Input type="password" {...register("password")} />
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
            <Button type="submit">Update</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
