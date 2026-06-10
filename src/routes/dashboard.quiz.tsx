import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Timer, RotateCcw, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { listFlashcards, type Flashcard } from "@/lib/flashcards";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/quiz")({
  component: QuizMode,
});

type Q = { card: Flashcard; options: string[]; correct: string };

function shuffle<T>(arr: T[]) { return [...arr].sort(() => Math.random() - 0.5); }

function buildQuiz(cards: Flashcard[]): Q[] {
  if (cards.length < 2) return [];
  const pool = shuffle(cards).slice(0, Math.min(10, cards.length));
  return pool.map((c) => {
    const distractors = shuffle(cards.filter((x) => x.id !== c.id)).slice(0, 3).map((x) => x.answer);
    const options = shuffle([c.answer, ...distractors]);
    return { card: c, options, correct: c.answer };
  });
}

function QuizMode() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: cards = [], isLoading } = useQuery({ queryKey: ["flashcards"], queryFn: listFlashcards });
  const [quiz, setQuiz] = useState<Q[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const start = useMemo(() => () => {
    setQuiz(buildQuiz(cards)); setI(0); setPicked(null); setScore(0); setDone(false); setSeconds(0);
  }, [cards]);

  useEffect(() => { if (cards.length >= 2 && quiz.length === 0 && !done) start(); }, [cards, quiz.length, done, start]);

  useEffect(() => {
    if (done || quiz.length === 0) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [done, quiz.length]);

  async function finishQuiz(finalScore: number) {
    setDone(true);
    if (!user) return;
    const total = quiz.length;
    const accuracy = Math.round((finalScore / total) * 100);
    const { error } = await supabase.from("quiz_results").insert({ user_id: user.id, score: finalScore, total, accuracy });
    if (error) toast.error(error.message);
    else { toast.success("Quiz saved!"); qc.invalidateQueries({ queryKey: ["quiz_results"] }); }
  }

  if (isLoading) return <div className="glass h-80 animate-pulse rounded-2xl" />;
  if (cards.length < 2) {
    return (
      <div className="glass grid place-items-center rounded-2xl p-12 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground" />
        <h3 className="mt-3 text-lg font-semibold">You need at least 2 flashcards</h3>
        <p className="text-sm text-muted-foreground">Add more cards to enable quiz mode.</p>
      </div>
    );
  }

  if (done) {
    const total = quiz.length;
    const wrong = total - score;
    const pct = Math.round((score / total) * 100);
    return (
      <div className="mx-auto max-w-xl glass rounded-3xl p-8 text-center animate-fade-in-up">
        <Sparkles className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-4 text-3xl font-bold">Quiz Complete!</h2>
        <div className="my-6 text-6xl font-extrabold text-gradient">{pct}%</div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl bg-muted p-3"><div className="font-semibold">{score}</div><div className="text-muted-foreground">Correct</div></div>
          <div className="rounded-xl bg-muted p-3"><div className="font-semibold">{wrong}</div><div className="text-muted-foreground">Wrong</div></div>
          <div className="rounded-xl bg-muted p-3"><div className="font-semibold">{seconds}s</div><div className="text-muted-foreground">Time</div></div>
        </div>
        <Button onClick={start} className="mt-6 gradient-primary text-primary-foreground border-0">
          <RotateCcw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  if (quiz.length === 0) return null;
  const q = quiz[i];

  function choose(opt: string) {
    if (picked) return;
    setPicked(opt);
    const correct = opt === q.correct;
    const next = score + (correct ? 1 : 0);
    if (correct) setScore(next);
    setTimeout(() => {
      if (i + 1 >= quiz.length) finishQuiz(next);
      else { setI(i + 1); setPicked(null); }
    }, 900);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quiz</h1>
          <p className="text-muted-foreground">Question {i + 1} of {quiz.length}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full glass px-4 py-2 text-sm">
          <Timer className="h-4 w-4" /> {seconds}s
        </div>
      </div>
      <Progress value={((i + 1) / quiz.length) * 100} />

      <div className="glass rounded-3xl p-8">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Question</span>
        <h3 className="mt-2 text-2xl font-semibold">{q.card.question}</h3>
        <div className="mt-6 grid gap-3">
          {q.options.map((opt) => {
            const isCorrect = picked && opt === q.correct;
            const isWrong = picked === opt && opt !== q.correct;
            return (
              <button
                key={opt}
                onClick={() => choose(opt)}
                disabled={!!picked}
                className={cn(
                  "w-full rounded-xl border bg-card px-4 py-3 text-left transition hover:border-primary hover:bg-accent",
                  isCorrect && "border-green-500 bg-green-500/10",
                  isWrong && "border-destructive bg-destructive/10",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
