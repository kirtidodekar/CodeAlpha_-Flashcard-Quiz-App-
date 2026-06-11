import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Timer, RotateCcw, BookOpen, CheckCircle2, XCircle, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { listFlashcards, type Flashcard } from "@/lib/flashcards";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

export const Route = createFileRoute("/dashboard/quiz")({
  component: QuizMode,
});

type QuizQuestion = {
  card: Flashcard;
  options: string[];
  correct: string;
};

/* ── Shuffle helper ─────────────────────────────────────────── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── Smart distractor generation ────────────────────────────── */
function isNumeric(val: string): boolean {
  return !isNaN(Number(val)) && val.trim() !== "";
}

function isBoolean(val: string): boolean {
  return val === "true" || val === "false";
}

function isCodeAnswer(val: string): boolean {
  const codeKeywords = ["error", "exception", "null", "undefined", "NaN", "compile", "runtime", "void", "output"];
  const lower = val.toLowerCase();
  return codeKeywords.some((k) => lower.includes(k)) || val.includes("(") || val.includes("{");
}

function generateNumericDistractors(correct: string, exclude: Set<string>): string[] {
  const num = Number(correct);
  const candidates: string[] = [];

  // Nearby integers
  for (const delta of [-2, -1, 1, 2, -3, 3, 5, 10, -5]) {
    const v = String(num + delta);
    if (!exclude.has(v)) candidates.push(v);
  }

  // Common off-by-one and zero
  for (const v of ["0", "1", String(num * 2), String(Math.abs(num))]) {
    if (!exclude.has(v) && !candidates.includes(v)) candidates.push(v);
  }

  return candidates;
}

function generateBooleanDistractors(exclude: Set<string>): string[] {
  const all = ["true", "false", "Compilation Error", "Runtime Error", "null", "undefined"];
  return all.filter((v) => !exclude.has(v));
}

function generateCodeDistractors(correct: string, allAnswers: string[], exclude: Set<string>): string[] {
  const candidates: string[] = [];

  // Common code-related wrong answers
  const generic = [
    "Compilation Error",
    "Runtime Error",
    "null",
    "undefined",
    "NaN",
    "0",
    "false",
    "true",
    "No output",
    "Infinite loop",
    "Exception thrown",
  ];

  // Use other flashcard answers as distractors (if they're different)
  for (const a of allAnswers) {
    if (!exclude.has(a) && !candidates.includes(a) && a !== correct) {
      candidates.push(a);
    }
  }

  // Fill remaining with generic code answers
  for (const g of generic) {
    if (!exclude.has(g) && !candidates.includes(g) && g !== correct) {
      candidates.push(g);
    }
  }

  return candidates;
}

function generateTextDistractors(correct: string, allAnswers: string[], exclude: Set<string>): string[] {
  const candidates: string[] = [];

  // Use other flashcard answers
  for (const a of allAnswers) {
    if (!exclude.has(a) && !candidates.includes(a) && a !== correct) {
      candidates.push(a);
    }
  }

  // Generic text distractors
  const generic = ["None of the above", "All of the above", "Cannot be determined", "Depends on context"];
  for (const g of generic) {
    if (!exclude.has(g) && !candidates.includes(g)) candidates.push(g);
  }

  return candidates;
}

/* ── Build a single question with guaranteed 4 unique options ── */
function buildQuestion(card: Flashcard, allCards: Flashcard[]): QuizQuestion | null {
  const correct = card.answer.trim();
  if (!correct) return null;

  const allAnswers = allCards.filter((c) => c.id !== card.id).map((c) => c.answer.trim());
  const exclude = new Set<string>([correct]);
  let distractorPool: string[];

  if (isBoolean(correct)) {
    distractorPool = generateBooleanDistractors(exclude);
  } else if (isNumeric(correct)) {
    distractorPool = generateNumericDistractors(correct, exclude);
    // Also add other card answers if they're unique
    for (const a of allAnswers) {
      if (!exclude.has(a) && !distractorPool.includes(a)) distractorPool.push(a);
    }
  } else if (isCodeAnswer(correct) || card.question.includes("```") || card.question.includes("System.") || card.question.includes("int ") || card.question.includes("function")) {
    distractorPool = generateCodeDistractors(correct, allAnswers, exclude);
  } else {
    distractorPool = generateTextDistractors(correct, allAnswers, exclude);
  }

  // Pick 3 unique distractors
  const picked = shuffle(distractorPool).slice(0, 3);

  // Must have exactly 3 distractors + 1 correct = 4 unique options
  if (picked.length < 3) return null;

  const options = shuffle([correct, ...picked]);
  return { card, options, correct };
}

/* ── Build the full quiz, skipping invalid questions ────────── */
function buildQuiz(cards: Flashcard[]): QuizQuestion[] {
  if (cards.length < 2) return [];
  const shuffled = shuffle(cards);
  const quiz: QuizQuestion[] = [];
  const maxQ = Math.min(10, cards.length);

  for (const card of shuffled) {
    if (quiz.length >= maxQ) break;
    const q = buildQuestion(card, cards);
    if (q) quiz.push(q); // skip invalid questions
  }

  return quiz;
}

/* ── Option letter labels ───────────────────────────────────── */
const LETTERS = ["A", "B", "C", "D"];

/* ── Main component ─────────────────────────────────────────── */
function QuizMode() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: cards = [], isLoading } = useQuery({ queryKey: ["flashcards"], queryFn: listFlashcards });
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [answered, setAnswered] = useState(0);

  const start = useCallback(() => {
    setQuiz(buildQuiz(cards));
    setI(0);
    setPicked(null);
    setScore(0);
    setDone(false);
    setSeconds(0);
    setAnswered(0);
  }, [cards]);

  useEffect(() => {
    if (cards.length >= 2 && quiz.length === 0 && !done) start();
  }, [cards, quiz.length, done, start]);

  useEffect(() => {
    if (done || quiz.length === 0) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [done, quiz.length]);

  async function finishQuiz(finalScore: number) {
    setDone(true);
    // Fire confetti
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#6366F1", "#8B5CF6", "#06B6D4", "#F59E0B", "#22C55E"] });
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
    const grade = pct >= 90 ? "Outstanding!" : pct >= 70 ? "Great job!" : pct >= 50 ? "Good effort!" : "Keep practicing!";
    return (
      <div className="mx-auto max-w-xl glass rounded-3xl p-8 text-center animate-fade-in-up">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl gradient-primary shadow-glow">
          <Trophy className="h-8 w-8 text-primary-foreground" />
        </div>
        <h2 className="text-3xl font-bold">Quiz Complete!</h2>
        <p className="mt-1 text-muted-foreground">{grade}</p>
        <div className="my-6 text-6xl font-extrabold text-gradient">{pct}%</div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl bg-green-500/10 p-3 border border-green-500/20">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">{score}</div>
            <div className="text-xs text-muted-foreground">Correct</div>
          </div>
          <div className="rounded-xl bg-red-500/10 p-3 border border-red-500/20">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">{wrong}</div>
            <div className="text-xs text-muted-foreground">Wrong</div>
          </div>
          <div className="rounded-xl bg-blue-500/10 p-3 border border-blue-500/20">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{seconds}s</div>
            <div className="text-xs text-muted-foreground">Time</div>
          </div>
        </div>
        <Button onClick={start} className="mt-6 gradient-primary text-primary-foreground border-0 hover-lift">
          <RotateCcw className="mr-2 h-4 w-4" /> Play Again
        </Button>
      </div>
    );
  }

  if (quiz.length === 0) return null;
  const q = quiz[i];

  function choose(opt: string) {
    if (picked) return;
    setPicked(opt);
    setAnswered((a) => a + 1);
    const correct = opt === q.correct;
    const next = score + (correct ? 1 : 0);
    if (correct) setScore(next);
    setTimeout(() => {
      if (i + 1 >= quiz.length) finishQuiz(next);
      else { setI(i + 1); setPicked(null); }
    }, 1200);
  }

  const progressPct = ((i + 1) / quiz.length) * 100;

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-7 w-7 text-primary" /> Quiz
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Question <span className="font-semibold text-foreground">{i + 1}</span> of {quiz.length}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-sm font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>{score}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-sm font-medium">
            <Timer className="h-3.5 w-3.5 text-muted-foreground" />
            {seconds}s
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <Progress value={progressPct} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{answered} answered</span>
          <span>{Math.round(progressPct)}%</span>
        </div>
      </div>

      {/* Question card */}
      <div className="glass rounded-3xl p-6 md:p-8">
        {q.card.category && (
          <span className="inline-block mb-3 rounded-full gradient-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground uppercase tracking-wider">
            {q.card.category}
          </span>
        )}
        <h3 className="text-xl md:text-2xl font-semibold leading-relaxed whitespace-pre-wrap">{q.card.question}</h3>
      </div>

      {/* Options */}
      <div className="grid gap-3">
        {q.options.map((opt, idx) => {
          const isPicked = picked === opt;
          const isCorrect = opt === q.correct;
          const showCorrect = picked && isCorrect;
          const showWrong = isPicked && !isCorrect;

          return (
            <button
              key={`${i}-${idx}`}
              onClick={() => choose(opt)}
              disabled={!!picked}
              className={cn(
                "group relative w-full rounded-2xl border-2 px-5 py-4 text-left transition-all duration-300",
                "flex items-center gap-4",
                // Default state
                !picked && "border-border/60 bg-card hover:border-primary/50 hover:shadow-glow hover:-translate-y-0.5 cursor-pointer",
                // Disabled (not picked, after answer)
                picked && !isPicked && !isCorrect && "border-border/30 bg-card/50 opacity-50",
                // Correct answer revealed
                showCorrect && "border-green-500 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.2)]",
                // Wrong pick
                showWrong && "border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]",
                // Correct pick (green gradient)
                isPicked && isCorrect && "border-green-500 bg-gradient-to-r from-green-500/15 to-emerald-500/10 shadow-[0_0_24px_rgba(34,197,94,0.25)]",
              )}
            >
              {/* Letter badge */}
              <span
                className={cn(
                  "grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl text-sm font-bold transition-all duration-300",
                  !picked && "bg-muted text-muted-foreground group-hover:gradient-primary group-hover:text-primary-foreground",
                  picked && !isPicked && !isCorrect && "bg-muted/50 text-muted-foreground/50",
                  showCorrect && !isPicked && "bg-green-500 text-white",
                  isPicked && isCorrect && "bg-green-500 text-white",
                  showWrong && "bg-red-500 text-white",
                )}
              >
                {LETTERS[idx]}
              </span>

              {/* Answer text */}
              <span className={cn(
                "flex-1 text-[15px] font-medium transition-colors duration-300",
                !picked && "text-foreground",
                picked && !isPicked && !isCorrect && "text-muted-foreground/60",
                showCorrect && "text-green-700 dark:text-green-300 font-semibold",
                showWrong && "text-red-700 dark:text-red-300",
                isPicked && isCorrect && "text-green-700 dark:text-green-300 font-semibold",
              )}>
                {opt}
              </span>

              {/* Result icon */}
              {picked && isCorrect && (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500 animate-fade-in-up" />
              )}
              {showWrong && (
                <XCircle className="h-5 w-5 flex-shrink-0 text-red-500 animate-fade-in-up" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
