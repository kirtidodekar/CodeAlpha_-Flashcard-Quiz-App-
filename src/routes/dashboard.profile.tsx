import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { listFlashcards, listQuizResults } from "@/lib/flashcards";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  LogOut, User, Mail, Calendar, BookOpen, Trophy, Target, Flame,
  Star, Zap, Crown, Settings, Shield,
} from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

const profileBadges = [
  { name: "First Steps", icon: Star, color: "#6366F1", check: (q: number, s: number, st: number) => q >= 1 },
  { name: "Quick Learner", icon: Zap, color: "#8B5CF6", check: (q: number, s: number) => s >= 5 },
  { name: "On Fire", icon: Flame, color: "#F59E0B", check: (_q: number, _s: number, st: number) => st >= 3 },
  { name: "Champion", icon: Crown, color: "#EC4899", check: (q: number) => q >= 10 },
];

function ProfilePage() {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [pw, setPw] = useState("");

  const profileQ = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const cardsQ = useQuery({ queryKey: ["flashcards"], queryFn: listFlashcards });
  const resultsQ = useQuery({ queryKey: ["quiz_results"], queryFn: listQuizResults });

  useEffect(() => { if (profileQ.data?.full_name) setFullName(profileQ.data.full_name); }, [profileQ.data]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("profiles").upsert({ id: user.id, full_name: fullName });
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) return toast.error("Password must be at least 6 characters");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    setPw("");
  }

  const name = fullName || user?.email?.split("@")[0] || "User";
  const initials = name.slice(0, 2).toUpperCase();
  const joined = user ? new Date(user.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "";
  const cards = cardsQ.data ?? [];
  const results = resultsQ.data ?? [];
  const studied = cards.filter((c) => c.learned).length;
  const avgAcc = results.length ? Math.round(results.reduce((a, r) => a + Number(r.accuracy), 0) / results.length) : 0;

  const days = new Set(results.map((r) => new Date(r.created_at).toDateString()));
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (days.has(d.toDateString())) streak++;
    else if (i > 0) break;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Profile Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.2)_0%,transparent_50%)]" />

        <div className="relative p-8 pb-6">
          <div className="flex flex-wrap items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="grid h-24 w-24 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm text-3xl font-black text-white border-2 border-white/30 shadow-xl">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-green-500 text-white border-2 border-white">
                <span className="text-[10px]">✓</span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-extrabold text-white">{fullName || "Your Profile"}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/80">
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {user?.email}</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined {joined}</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-4 gap-3">
            {[
              { icon: BookOpen, label: "Cards", value: cards.length, color: "#818cf8" },
              { icon: Trophy, label: "Quizzes", value: results.length, color: "#22d3ee" },
              { icon: Target, label: "Accuracy", value: `${avgAcc}%`, color: "#a78bfa" },
              { icon: Flame, label: "Streak", value: `${streak}d`, color: "#fbbf24" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/10 backdrop-blur-sm p-3 text-center border border-white/10">
                <s.icon className="mx-auto h-4 w-4 text-white/80" />
                <div className="mt-1 text-xl font-bold text-white">{s.value}</div>
                <div className="text-[11px] text-white/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border/60 bg-card p-6 shadow-card"
      >
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-indigo-500" /> Achievement Badges
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {profileBadges.map((b) => {
            const earned = b.check(results.length, studied, streak);
            return (
              <div key={b.name} className={`text-center p-3 rounded-xl border transition-all ${earned ? "border-border/60 bg-card" : "border-transparent bg-muted/30 opacity-40"}`}>
                <div
                  className="mx-auto grid h-10 w-10 place-items-center rounded-xl"
                  style={{ background: earned ? `${b.color}15` : "var(--muted)" }}
                >
                  <b.icon className="h-4 w-4" style={{ color: earned ? b.color : "var(--muted-foreground)" }} />
                </div>
                <p className="mt-2 text-xs font-semibold">{b.name}</p>
                <p className="text-[10px] text-muted-foreground">{earned ? "✓ Earned" : "Locked"}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Edit Profile Form */}
      <motion.form
        onSubmit={saveProfile}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border/60 bg-card p-6 shadow-card space-y-4"
      >
        <h3 className="font-semibold flex items-center gap-2">
          <User className="h-4 w-4 text-indigo-500" /> Edit Profile
        </h3>
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <Button type="submit" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 hover:opacity-90">
          Save Changes
        </Button>
      </motion.form>

      {/* Change Password */}
      <motion.form
        onSubmit={changePassword}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border/60 bg-card p-6 shadow-card space-y-4"
      >
        <h3 className="font-semibold flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" /> Change Password
        </h3>
        <div className="space-y-2">
          <Label htmlFor="np">New Password</Label>
          <Input
            id="np"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="rounded-xl"
            placeholder="Min 6 characters"
          />
        </div>
        <Button type="submit" variant="outline" className="rounded-xl border-border/60">
          Update Password
        </Button>
      </motion.form>

      {/* Logout */}
      <Button
        variant="destructive"
        className="w-full rounded-xl"
        onClick={async () => { await signOut(); navigate({ to: "/" }); }}
      >
        <LogOut className="mr-2 h-4 w-4" /> Logout
      </Button>
    </div>
  );
}
