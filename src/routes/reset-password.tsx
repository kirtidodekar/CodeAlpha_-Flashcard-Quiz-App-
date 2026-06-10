import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { motion } from "framer-motion";

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
    <div className="relative grid min-h-screen place-items-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15)_0%,transparent_40%)]" />
      <motion.div
        className="absolute top-20 left-[15%] h-72 w-72 rounded-full bg-indigo-400/30 blur-3xl"
        animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.form
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={onSubmit}
        className="relative w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-7 space-y-5 shadow-2xl"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Set new password</h1>
          <p className="mt-1 text-sm text-white/70">Enter your new password below</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pw" className="text-white/80 text-sm">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              id="pw"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required
              placeholder="Min 6 characters"
              className="pl-10 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/40"
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={busy}
          className="w-full bg-white text-indigo-600 hover:bg-white/90 rounded-xl font-bold shadow-xl h-11"
        >
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update Password
        </Button>
      </motion.form>
    </div>
  );
}
