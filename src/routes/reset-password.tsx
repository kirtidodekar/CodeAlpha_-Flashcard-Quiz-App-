import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) return toast.error("Password must be at least 6 characters");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="relative grid min-h-screen place-items-center px-4">
      <div className="absolute inset-0 gradient-hero opacity-90" />
      <form onSubmit={onSubmit} className="glass relative w-full max-w-md rounded-2xl p-6 space-y-4">
        <h1 className="text-2xl font-bold">Set new password</h1>
        <div className="space-y-2">
          <Label htmlFor="pw">New Password</Label>
          <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        </div>
        <Button type="submit" disabled={busy} className="w-full gradient-primary text-primary-foreground border-0">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update Password
        </Button>
      </form>
    </div>
  );
}
