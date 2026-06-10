import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Library, Trophy, Target, Flame } from "lucide-react";
import { listFlashcards, listQuizResults } from "@/lib/flashcards";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const cardsQ = useQuery({ queryKey: ["flashcards"], queryFn: listFlashcards });
  const resultsQ = useQuery({ queryKey: ["quiz_results"], queryFn: listQuizResults });

  if (cardsQ.isLoading || resultsQ.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
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

  // streak: distinct days with quiz in last 14
  const days = new Set(results.map((r) => new Date(r.created_at).toDateString()));
  let streak = 0;
  for (let i = 0; i < 14; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (days.has(d.toDateString())) streak++;
    else if (i > 0) break;
  }

  // weekly chart
  const weekly = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const dayResults = results.filter((r) => new Date(r.created_at).toDateString() === key);
    return {
      day: d.toLocaleDateString(undefined, { weekday: "short" }),
      quizzes: dayResults.length,
      accuracy: dayResults.length ? Math.round(dayResults.reduce((a, r) => a + Number(r.accuracy), 0) / dayResults.length) : 0,
    };
  });

  const stats = [
    { label: "Total Flashcards", value: totalCards, icon: Library },
    { label: "Completed Quizzes", value: totalQuizzes, icon: Trophy },
    { label: "Accuracy", value: `${accuracy}%`, icon: Target },
    { label: "Study Streak", value: `${streak}d`, icon: Flame },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold">Welcome back 👋</h1>
        <p className="text-muted-foreground">Here's your learning overview.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-2xl p-5 hover-lift">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <div className="grid h-9 w-9 place-items-center rounded-lg gradient-primary text-primary-foreground">
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold">Weekly Learning Progress</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <LineChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="quizzes" stroke="oklch(0.6 0.22 285)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold">Quiz Performance (Accuracy %)</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="accuracy" fill="oklch(0.6 0.2 235)" radius={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
