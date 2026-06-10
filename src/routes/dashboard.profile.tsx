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
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

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

  const initials = (fullName || user?.email || "U").slice(0, 2).toUpperCase();
  const joined = user ? new Date(user.created_at).toLocaleDateString() : "";

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in-up">
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="grid h-20 w-20 place-items-center rounded-full gradient-primary text-2xl font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{fullName || "Your Profile"}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
            <p className="text-sm text-muted-foreground">Joined {joined}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-muted p-3"><div className="text-2xl font-bold">{cardsQ.data?.length ?? 0}</div><div className="text-xs text-muted-foreground">Cards</div></div>
            <div className="rounded-xl bg-muted p-3"><div className="text-2xl font-bold">{resultsQ.data?.length ?? 0}</div><div className="text-xs text-muted-foreground">Quizzes</div></div>
          </div>
        </div>
      </div>

      <form onSubmit={saveProfile} className="glass space-y-4 rounded-2xl p-6">
        <h3 className="text-lg font-semibold">Edit Profile</h3>
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <Button type="submit" className="gradient-primary text-primary-foreground border-0">Save</Button>
      </form>

      <form onSubmit={changePassword} className="glass space-y-4 rounded-2xl p-6">
        <h3 className="text-lg font-semibold">Change Password</h3>
        <div className="space-y-2">
          <Label htmlFor="np">New Password</Label>
          <Input id="np" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <Button type="submit" variant="outline">Update Password</Button>
      </form>

      <Button variant="destructive" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
        <LogOut className="mr-2 h-4 w-4" /> Logout
      </Button>
    </div>
  );
}
