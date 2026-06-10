import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Timer, RotateCcw, BookOpen, Trophy, Target, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { listFlashcards, type Flashcard } from "@/lib/flashcards";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

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

const optionColors = ["#6366F1", "#8B5CF6", "#06B6D4", "#F59E0B"];
const optionLetters = ["A", "B", "C", "D"];

function fireConfetti() {
  const count = 200;
  const defaults = { origin: { y: 0.7 }, zIndex: 1000 };
  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({ ...defaults, particleCount: Math.floor(count * particleRatio), ...opts });
  }
  fire(0.25, { spread: 26, startVelocity: 55, colors: ["#6366F1", "#8B5CF6"] });
  fire(0.2,  { spread: 60, colors: ["#06B6D4", "#22C55E"] });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ["#F59E0B", "#EC4899"] });
  fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ["#6366F1", "#8B5CF6", "#06B6D4"] });
  fire(0.1,  { spread: 120, startVelocity: 45, colors: ["#22C55E", "#F59E0B", "#EF4444"] });
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
    fireConfetti();
    if (!user) return;
    const total = quiz.length;
    const accuracy = Math.round((finalScore / total) * 100);
    const { error } = await supabase.from("quiz_results").insert({ user_id: user.id, score: finalScore, total, accuracy });
    if (error) toast.error(error.message);
    else { toast.success("Quiz saved! 🎉"); qc.invalidateQueries({ queryKey: ["quiz_results"] }); }
  }

  if (isLoading) return (
    <div className="mx-auto max-w-2xl">
      <div className="h-96 rounded-3xl bg-muted animate-pulse" />
    </div>
  );

  if (cards.length < 2) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-lg grid place-items-center rounded-3xl border border-border/60 bg-card p-16 text-center shadow-card"
      >
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/10">
          <BookOpen className="h-8 w-8 text-amber-500" />
        </div>
        <h3 className="mt-4 text-xl font-bold">You need at least 2 flashcards</h3>
        <p className="mt-2 text-muted-foreground">Add more cards to enable quiz mode.</p>
      </motion.div>
    );
  }

  if (done) {
    const total = quiz.length;
    const wrong = total - score;
    const pct = Math.round((score / total) * 100);
    const grade = pct >= 90 ? "Outstanding! 🏆" : pct >= 70 ? "Great job! 🌟" : pct >= 50 ? "Good effort! 💪" : "Keep practicing! 📚";
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto max-w-xl rounded-3xl border border-border/60 bg-card p-8 shadow-card"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30"
          >
            <Trophy className="h-9 w-9 text-white" />
          </motion.div>
          <h2 className="mt-5 text-3xl font-extrabold">Quiz Complete!</h2>
          <p className="mt-1 text-muted-foreground">{grade}</p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="my-8 text-7xl font-black text-gradient"
          >
            {pct}%
          </motion.div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Target, label: "Correct", value: score, color: "#22C55E" },
              { icon: Sparkles, label: "Wrong", value: wrong, color: "#EF4444" },
              { icon: Clock, label: "Time", value: `${seconds}s`, color: "#06B6D4" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-4 border border-border/60"
                style={{ background: `${s.color}08` }}
              >
                <s.icon className="mx-auto h-5 w-5" style={{ color: s.color }} />
                <div className="mt-2 text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          <Button
            onClick={start}
            className="mt-6 w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 hover:opacity-90 shadow-lg shadow-indigo-500/25"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Play Again
          </Button>
        </div>
      </motion.div>
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
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10">
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
            Quiz
          </h1>
          <p className="mt-1 text-muted-foreground">Question {i + 1} of {quiz.length}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium shadow-card">
          <Timer className="h-4 w-4 text-indigo-500" />
          <span className="tabular-nums">{seconds}s</span>
        </div>
      </motion.div>

      {/* Progress */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Progress value={((i + 1) / quiz.length) * 100} className="h-2 rounded-full" />
      </motion.div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="rounded-3xl border border-border/60 bg-card p-8 shadow-card"
        >
          <div className="mb-1 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/60">Question {i + 1}</div>
          <h3 className="text-2xl font-bold text-foreground">{q.card.question}</h3>

          {/* Options */}
          <div className="mt-6 grid gap-3">
            {q.options.map((opt, idx) => {
              const isCorrect = picked && opt === q.correct;
              const isWrong = picked === opt && opt !== q.correct;
              const color = optionColors[idx % optionColors.length];
              return (
                <motion.button
                  key={opt}
                  onClick={() => choose(opt)}
                  disabled={!!picked}
                  whileHover={!picked ? { scale: 1.015 } : {}}
                  whileTap={!picked ? { scale: 0.98 } : {}}
                  className={cn(
                    "flex items-center gap-4 w-full rounded-2xl border px-5 py-4 text-left font-medium transition-all duration-200",
                    !picked && "hover:border-indigo-500/50 bg-card hover:bg-muted/50",
                    isCorrect && "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
                    isWrong && "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400",
                    !isCorrect && !isWrong && picked && "opacity-50 border-border/60",
                  )}
                >
                  <span
                    className="grid h-8 w-8 place-items-center rounded-lg text-xs font-bold flex-shrink-0"
                    style={{
                      background: isCorrect ? "#22C55E" : isWrong ? "#EF4444" : `${color}15`,
                      color: isCorrect || isWrong ? "#fff" : color,
                    }}
                  >
                    {optionLetters[idx]}
                  </span>
                  <span className="flex-1 text-sm">{opt}</span>
                  {isCorrect && <span className="text-green-500 text-lg">✓</span>}
                  {isWrong && <span className="text-red-500 text-lg">✗</span>}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Score pill */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          <Target className="h-3.5 w-3.5" /> Score: {score}/{quiz.length}
        </div>
      </div>
    </div>
  );
}
