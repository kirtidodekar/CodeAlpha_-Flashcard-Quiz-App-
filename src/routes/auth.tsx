import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Brain, Eye, EyeOff, Loader2, Mail, Lock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In — FlashMaster" }] }),
  component: AuthPage,
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
  confirm: z.string(),
}).refine((f) => f.password === f.confirm, { message: "Passwords don't match", path: ["confirm"] });

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Required"),
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard" });
  }, [session, loading, navigate]);

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15)_0%,transparent_40%)]" />

      {/* Animated blobs */}
      <motion.div
        className="absolute top-20 left-[15%] h-72 w-72 rounded-full bg-indigo-400/30 blur-3xl"
        animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-[10%] h-64 w-64 rounded-full bg-cyan-400/25 blur-3xl"
        animate={{ scale: [1, 1.2, 1], x: [0, -25, 0], y: [0, 25, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating decoration cards */}
      <motion.div
        className="absolute top-[15%] right-[8%] hidden lg:block"
        animate={{ y: [0, -14, 0], rotate: [0, 3, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-36 rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/20">
          <div className="h-2 w-10 rounded-full bg-white/30 mb-2" />
          <div className="h-2 w-full rounded-full bg-white/20 mb-1" />
          <div className="h-2 w-3/4 rounded-full bg-white/15" />
        </div>
      </motion.div>

      {/* Auth form container */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="mb-8 flex items-center justify-center gap-3 text-white">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-xl">
            <Brain className="h-5 w-5" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight">FlashMaster</span>
        </Link>

        {/* Glass card */}
        <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-7 shadow-2xl">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-white">Welcome back</h2>
            <p className="mt-1 text-sm text-white/70">Sign in to continue your learning journey</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 border-0 rounded-xl p-0.5">
              <TabsTrigger
                value="login"
                className="rounded-lg text-white/80 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-lg text-white/80 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login"><LoginForm /></TabsContent>
            <TabsContent value="signup"><SignUpForm /></TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}

function LoginForm() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back! 🎉");
    navigate({ to: "/dashboard" });
  }

  async function onForgot() {
    const email = (document.getElementById("login-email") as HTMLInputElement)?.value;
    if (!email) return toast.error("Enter your email first");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("Password reset link sent");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-white/80 text-sm">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            id="login-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            className="pl-10 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/40 focus-visible:border-white/40"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password" className="text-white/80 text-sm">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            id="login-password"
            name="password"
            type={show ? "text" : "password"}
            required
            className="pl-10 pr-10 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/40 focus-visible:border-white/40"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-white/70">
          <input type="checkbox" className="rounded border-white/30" /> Remember me
        </label>
        <button type="button" onClick={onForgot} className="text-white/90 hover:text-white font-medium transition">
          Forgot password?
        </button>
      </div>
      <Button
        type="submit"
        disabled={busy}
        className="w-full bg-white text-indigo-600 hover:bg-white/90 rounded-xl font-bold shadow-xl h-11 text-sm"
      >
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Login
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      fullName: fd.get("fullName"),
      email: fd.get("email"),
      password: fd.get("password"),
      confirm: fd.get("confirm"),
    });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: parsed.data.fullName },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created! You can now log in.");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="su-name" className="text-white/80 text-sm">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            id="su-name"
            name="fullName"
            required
            placeholder="John Doe"
            className="pl-10 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/40 focus-visible:border-white/40"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-email" className="text-white/80 text-sm">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            id="su-email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="pl-10 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/40 focus-visible:border-white/40"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-password" className="text-white/80 text-sm">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            id="su-password"
            name="password"
            type={show ? "text" : "password"}
            required
            placeholder="Min 6 characters"
            className="pl-10 pr-10 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/40 focus-visible:border-white/40"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-confirm" className="text-white/80 text-sm">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            id="su-confirm"
            name="confirm"
            type={show ? "text" : "password"}
            required
            placeholder="Repeat password"
            className="pl-10 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/40 focus-visible:border-white/40"
          />
        </div>
      </div>
      <Button
        type="submit"
        disabled={busy}
        className="w-full bg-white text-indigo-600 hover:bg-white/90 rounded-xl font-bold shadow-xl h-11 text-sm"
      >
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Account <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
