"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Placeholder update logic
    setTimeout(() => {
      toast.success("Profil berhasil diperbarui");
      setLoading(false);
    }, 1000);
  };

  return (
    <Card className="mx-auto max-w-xl shadow-sm">
      <CardHeader><CardTitle>Profil User</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nama</Label>
            <Input defaultValue={session.user?.name ?? ""} />
          </div>
          <div>
            <Label>Email</Label>
            <Input defaultValue={session.user?.email ?? ""} disabled />
          </div>
          <div>
            <Label>Role</Label>
            <Input defaultValue={(session.user as any)?.role ?? ""} disabled />
          </div>
          <div className="pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
