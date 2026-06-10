import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listFlashcards, listQuizResults } from "@/lib/flashcards";
import { Award, Flame, Target, Trophy, BookOpen, Zap, Star, Crown } from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/progress")({
  component: ProgressPage,
});

const statCards = [
  { key: "studied", label: "Cards Studied", icon: BookOpen, gradient: "linear-gradient(135deg,#6366F1,#818CF8)", shadow: "rgba(99,102,241,0.4)" },
  { key: "avgAcc",  label: "Avg Accuracy", icon: Target,   gradient: "linear-gradient(135deg,#8B5CF6,#A78BFA)", shadow: "rgba(139,92,246,0.4)" },
  { key: "quizzes", label: "Quizzes Taken", icon: Trophy,  gradient: "linear-gradient(135deg,#06B6D4,#22D3EE)", shadow: "rgba(6,182,212,0.4)" },
  { key: "streak",  label: "Day Streak",    icon: Flame,   gradient: "linear-gradient(135deg,#F59E0B,#F97316)", shadow: "rgba(245,158,11,0.4)" },
];

const allBadges = [
  { name: "First Steps",     desc: "Complete your first quiz",  icon: Star,    color: "#6366F1" },
  { name: "Quick Learner",   desc: "Study 5 cards",             icon: Zap,     color: "#8B5CF6" },
  { name: "On Fire",         desc: "3-day streak",              icon: Flame,   color: "#F59E0B" },
  { name: "Perfectionist",   desc: "Score 100% on a quiz",      icon: Trophy,  color: "#22C55E" },
  { name: "Bookworm",        desc: "Create 20 flashcards",      icon: BookOpen,color: "#06B6D4" },
  { name: "Champion",        desc: "Complete 10 quizzes",       icon: Crown,   color: "#EC4899" },
];

function ProgressPage() {
  const [range, setRange] = useState<"week" | "month">("week");
  const cardsQ = useQuery({ queryKey: ["flashcards"], queryFn: listFlashcards });
  const resultsQ = useQuery({ queryKey: ["quiz_results"], queryFn: listQuizResults });
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

  const daysBack = range === "week" ? 7 : 30;
  const chartData = Array.from({ length: daysBack }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (daysBack - 1 - i));
    const key = d.toDateString();
    const dayResults = results.filter((r) => new Date(r.created_at).toDateString() === key);
    return {
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      accuracy: dayResults.length ? Math.round(dayResults.reduce((a, r) => a + Number(r.accuracy), 0) / dayResults.length) : 0,
      quizzes: dayResults.length,
    };
  });

  const values: Record<string, string | number> = { studied, avgAcc: `${avgAcc}%`, quizzes: results.length, streak: `${streak}d` };

  const earnedBadges = [
    results.length >= 1,
    studied >= 5,
    streak >= 3,
    results.some((r) => Number(r.accuracy) === 100),
    cards.length >= 20,
    results.length >= 10,
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-green-500/10">
            <Target className="h-5 w-5 text-green-500" />
          </div>
          Progress
        </h1>
        <p className="mt-1 text-muted-foreground">Track your learning journey.</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="relative overflow-hidden rounded-2xl p-5 text-white"
            style={{ background: s.gradient, boxShadow: `0 8px 24px -6px ${s.shadow}` }}
          >
            <div className="absolute -right-3 -top-3 h-20 w-20 rounded-full bg-white/10" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">{s.label}</p>
                <p className="mt-2 text-3xl font-extrabold">{values[s.key]}</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20">
                <s.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-border/60 bg-card p-6 shadow-card"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold">Accuracy Over Time</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Your quiz performance trend</p>
          </div>
          <div className="flex rounded-xl border border-border/60 bg-muted/50 p-0.5">
            {(["week", "month"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-xs font-medium transition-all duration-200",
                  range === r
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r === "week" ? "7 Days" : "30 Days"}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
              <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{
                  background: "var(--card)", border: "1px solid var(--border)",
                  borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                }}
                formatter={(v: number) => [`${v}%`, "Accuracy"]}
              />
              <Area type="monotone" dataKey="accuracy" stroke="#8B5CF6" strokeWidth={2.5} fill="url(#accGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-xl font-bold mb-4">Achievements</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allBadges.map((b, i) => {
            const earned = earnedBadges[i];
            return (
              <motion.div
                key={b.name}
                whileHover={{ scale: earned ? 1.02 : 1 }}
                className={cn(
                  "flex items-center gap-4 rounded-2xl border p-5 transition-all duration-200",
                  earned
                    ? "border-border/60 bg-card shadow-card"
                    : "border-border/40 bg-muted/30 opacity-50",
                )}
              >
                <div
                  className="grid h-12 w-12 place-items-center rounded-xl flex-shrink-0"
                  style={{
                    background: earned ? `${b.color}15` : "var(--muted)",
                    boxShadow: earned ? `0 4px 12px ${b.color}25` : "none",
                  }}
                >
                  <b.icon className="h-5 w-5" style={{ color: earned ? b.color : "var(--muted-foreground)" }} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.desc}</p>
                  <p className={cn("mt-1 text-[11px] font-semibold", earned ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
                    {earned ? "✓ Earned" : "🔒 Locked"}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
