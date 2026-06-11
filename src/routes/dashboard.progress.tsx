import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listFlashcards, listQuizResults } from "@/lib/flashcards";
import { Award, Flame, Target, Trophy, Lock, CheckCircle2 } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";

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
    {
      name: "First Steps",
      earned: results.length >= 1,
      icon: Award,
      description: "Start your learning journey by successfully completing any quiz.",
      condition: "Complete 1 quiz",
      progress: Math.min(results.length, 1),
      target: 1,
      progressLabel: `${Math.min(results.length, 1)}/1 quiz`,
    },
    {
      name: "Quick Learner",
      earned: studied >= 5,
      icon: Target,
      description: "Study and master at least 5 flashcards to earn this badge.",
      condition: "Mark 5 cards as learned",
      progress: Math.min(studied, 5),
      target: 5,
      progressLabel: `${Math.min(studied, 5)}/5 cards`,
    },
    {
      name: "On Fire",
      earned: streak >= 3,
      icon: Flame,
      description: "Build a 3-day quiz streak to prove your consistency.",
      condition: "Take a quiz 3 days in a row",
      progress: Math.min(streak, 3),
      target: 3,
      progressLabel: `${Math.min(streak, 3)}/3 day streak`,
    },
    {
      name: "Perfectionist",
      earned: results.some((r) => Number(r.accuracy) === 100),
      icon: Trophy,
      description: "Score 100% on any quiz to claim this prestigious badge.",
      condition: "Get a perfect score on any quiz",
      progress: results.some((r) => Number(r.accuracy) === 100) ? 1 : 0,
      target: 1,
      progressLabel: results.some((r) => Number(r.accuracy) === 100) ? "1/1 perfect score" : "0/1 perfect score",
    },
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
          {badges.map((b) => {
            const pct = Math.round((b.progress / b.target) * 100);
            return (
              <Popover key={b.name}>
                <PopoverTrigger asChild>
                  <button
                    className={`glass rounded-2xl p-5 text-center transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-glow ${b.earned ? "" : "opacity-50 hover:opacity-75"}`}
                  >
                    <div className={`mx-auto grid h-12 w-12 place-items-center rounded-full transition-all duration-300 ${b.earned ? "gradient-primary text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground"}`}>
                      <b.icon className="h-6 w-6" />
                    </div>
                    <div className="mt-2 font-semibold">{b.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      {b.earned ? (
                        <><CheckCircle2 className="h-3 w-3 text-green-500" /> Earned</>
                      ) : (
                        <><Lock className="h-3 w-3" /> Locked</>
                      )}
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64" side="top" align="center">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl ${b.earned ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        <b.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{b.name}</h4>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${b.earned ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                          {b.earned ? <><CheckCircle2 className="h-3 w-3" /> Earned</> : <><Lock className="h-3 w-3" /> Locked</>}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground leading-relaxed">{b.description}</p>

                    {/* Unlock condition */}
                    <div className="rounded-lg bg-muted/60 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Unlock Condition</div>
                      <div className="text-xs font-medium mt-0.5">{b.condition}</div>
                    </div>

                    {/* Progress (only when locked) */}
                    {!b.earned && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{b.progressLabel}</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      </div>
    </div>
  );
}
