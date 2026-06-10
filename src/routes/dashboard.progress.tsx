import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listFlashcards, listQuizResults } from "@/lib/flashcards";
import { Award, Flame, Target, Trophy } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/dashboard/progress")({
  component: ProgressPage,
});

function ProgressPage() {
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

  const chart = [...results].reverse().slice(-10).map((r, i) => ({
    name: `#${i + 1}`,
    accuracy: Number(r.accuracy),
  }));

  const badges = [
    { name: "First Steps", earned: results.length >= 1, icon: Award },
    { name: "Quick Learner", earned: studied >= 5, icon: Target },
    { name: "On Fire", earned: streak >= 3, icon: Flame },
    { name: "Perfectionist", earned: results.some((r) => Number(r.accuracy) === 100), icon: Trophy },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="text-3xl font-bold">Progress</h1>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Cards Studied", value: studied },
          { label: "Avg Accuracy", value: `${avgAcc}%` },
          { label: "Quizzes Taken", value: results.length },
          { label: "Streak", value: `${streak}d` },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-5">
            <div className="text-sm text-muted-foreground">{s.label}</div>
            <div className="mt-2 text-3xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold">Accuracy over time</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer>
            <LineChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="accuracy" stroke="oklch(0.6 0.22 285)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold">Achievements</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          {badges.map((b) => (
            <div key={b.name} className={`glass rounded-2xl p-5 text-center ${b.earned ? "" : "opacity-40"}`}>
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full gradient-primary text-primary-foreground">
                <b.icon className="h-6 w-6" />
              </div>
              <div className="mt-2 font-semibold">{b.name}</div>
              <div className="text-xs text-muted-foreground">{b.earned ? "Earned" : "Locked"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
