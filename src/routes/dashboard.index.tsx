import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Library, Trophy, Target, Flame, TrendingUp, TrendingDown, BookOpen, Zap } from "lucide-react";
import { listFlashcards, listQuizResults } from "@/lib/flashcards";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip,
  BarChart, Bar, CartesianGrid, Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

const statCards = [
  {
    key: "cards",
    label: "Cards Studied",
    icon: Library,
    gradient: "linear-gradient(135deg, #6366F1, #818CF8)",
    shadow: "0 8px 32px -8px rgba(99,102,241,0.45)",
    iconBg: "rgba(255,255,255,0.2)",
    trend: "+12%",
    trendUp: true,
  },
  {
    key: "accuracy",
    label: "Avg Accuracy",
    icon: Target,
    gradient: "linear-gradient(135deg, #8B5CF6, #A78BFA)",
    shadow: "0 8px 32px -8px rgba(139,92,246,0.45)",
    iconBg: "rgba(255,255,255,0.2)",
    trend: "+5%",
    trendUp: true,
  },
  {
    key: "quizzes",
    label: "Quizzes Taken",
    icon: Trophy,
    gradient: "linear-gradient(135deg, #06B6D4, #22D3EE)",
    shadow: "0 8px 32px -8px rgba(6,182,212,0.45)",
    iconBg: "rgba(255,255,255,0.2)",
    trend: "+8%",
    trendUp: true,
  },
  {
    key: "streak",
    label: "Study Streak",
    icon: Flame,
    gradient: "linear-gradient(135deg, #F59E0B, #F97316)",
    shadow: "0 8px 32px -8px rgba(245,158,11,0.45)",
    iconBg: "rgba(255,255,255,0.2)",
    trend: "Active",
    trendUp: true,
  },
];

const barColors = ["#6366F1", "#8B5CF6", "#06B6D4", "#22C55E", "#F59E0B", "#EC4899", "#6366F1"];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] } }),
};

function DashboardHome() {
  const cardsQ = useQuery({ queryKey: ["flashcards"], queryFn: listFlashcards });
  const resultsQ = useQuery({ queryKey: ["quiz_results"], queryFn: listQuizResults });

  if (cardsQ.isLoading || resultsQ.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    );
  }

  const cards = cardsQ.data ?? [];
  const results = resultsQ.data ?? [];
  const totalCards = cards.length;
  const totalQuizzes = results.length;
  const accuracy = results.length
    ? Math.round(results.reduce((a, r) => a + Number(r.accuracy), 0) / results.length)
    : 0;

  const days = new Set(results.map((r) => new Date(r.created_at).toDateString()));
  let streak = 0;
  for (let i = 0; i < 14; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (days.has(d.toDateString())) streak++;
    else if (i > 0) break;
  }

  const weekly = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const dayResults = results.filter((r) => new Date(r.created_at).toDateString() === key);
    return {
      day: d.toLocaleDateString(undefined, { weekday: "short" }),
      quizzes: dayResults.length,
      accuracy: dayResults.length
        ? Math.round(dayResults.reduce((a, r) => a + Number(r.accuracy), 0) / dayResults.length)
        : 0,
    };
  });

  const values: Record<string, string | number> = {
    cards: totalCards,
    accuracy: `${accuracy}%`,
    quizzes: totalQuizzes,
    streak: `${streak}d`,
  };

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-extrabold tracking-tight">
          Welcome back{" "}
          <span className="inline-block animate-pulse">👋</span>
        </h1>
        <p className="mt-1 text-muted-foreground">Here's your learning overview for this week.</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.key}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="relative overflow-hidden rounded-2xl p-6 text-white cursor-default"
            style={{ background: s.gradient, boxShadow: s.shadow }}
          >
            {/* Background pattern */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10" style={{ background: "white" }} />
            <div className="absolute -right-2 -bottom-6 h-20 w-20 rounded-full opacity-5" style={{ background: "white" }} />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">{s.label}</p>
                <p className="mt-2 text-4xl font-extrabold tracking-tight">{values[s.key]}</p>
              </div>
              <div
                className="grid h-11 w-11 place-items-center rounded-xl"
                style={{ background: s.iconBg }}
              >
                <s.icon className="h-5 w-5 text-white" />
              </div>
            </div>

            <div className="relative mt-4 flex items-center gap-1.5 text-xs font-medium text-white/90">
              {s.trendUp ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              <span>{s.trend}</span>
              <span className="text-white/60">vs last week</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Area Chart – Quizzes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="rounded-2xl border border-border/60 bg-card p-6 shadow-card"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Weekly Progress</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Quizzes completed per day</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
              <Zap className="h-3 w-3" /> This week
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer>
              <AreaChart data={weekly}>
                <defs>
                  <linearGradient id="quizzesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="quizzes"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  fill="url(#quizzesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Bar Chart – Accuracy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="rounded-2xl border border-border/60 bg-card p-6 shadow-card"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Quiz Performance</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Accuracy percentage by day</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
              <Target className="h-3 w-3" /> {accuracy}% avg
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart data={weekly} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  }}
                />
                <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                  {weekly.map((_, idx) => (
                    <Cell key={idx} fill={barColors[idx % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="grid gap-4 md:grid-cols-3"
      >
        {[
          { icon: BookOpen, label: "Study Flashcards", desc: "Review your cards", to: "/dashboard/study", color: "#6366F1" },
          { icon: Zap, label: "Take a Quiz", desc: "Test your knowledge", to: "/dashboard/quiz", color: "#8B5CF6" },
          { icon: Library, label: "Browse Decks", desc: "Manage flashcards", to: "/dashboard/flashcards", color: "#06B6D4" },
        ].map((a) => (
          <a
            key={a.label}
            href={a.to}
            className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-5 transition-all duration-200 hover:border-indigo-500/40 hover:shadow-card-hover"
          >
            <div
              className="grid h-12 w-12 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-110"
              style={{ background: `${a.color}15` }}
            >
              <a.icon className="h-5 w-5" style={{ color: a.color }} />
            </div>
            <div>
              <p className="font-semibold text-foreground">{a.label}</p>
              <p className="text-xs text-muted-foreground">{a.desc}</p>
            </div>
          </a>
        ))}
      </motion.div>
    </div>
  );
}
