import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Check, BookOpen, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { listFlashcards } from "@/lib/flashcards";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/dashboard/study")({
  component: StudyMode,
});

function StudyMode() {
  const qc = useQueryClient();
  const { data: cards = [], isLoading } = useQuery({ queryKey: ["flashcards"], queryFn: listFlashcards });
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (isLoading) return (
    <div className="mx-auto max-w-2xl">
      <div className="h-96 rounded-3xl bg-muted animate-pulse" />
    </div>
  );

  if (cards.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-lg grid place-items-center rounded-3xl border border-border/60 bg-card p-16 text-center shadow-card"
      >
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-cyan-500/10">
          <BookOpen className="h-8 w-8 text-cyan-500" />
        </div>
        <h3 className="mt-4 text-xl font-bold">Nothing to study yet</h3>
        <p className="mt-2 text-muted-foreground">Create flashcards first to start your study session.</p>
      </motion.div>
    );
  }

  const card = cards[i];
  const progress = ((i + 1) / cards.length) * 100;

  const go = (delta: number) => {
    setFlipped(false);
    setI((p) => (p + delta + cards.length) % cards.length);
  };

  async function markLearned() {
    const { error } = await supabase.from("flashcards").update({ learned: !card.learned }).eq("id", card.id);
    if (error) return toast.error(error.message);
    toast.success(card.learned ? "Unmarked" : "Marked as learned! 🎉");
    qc.invalidateQueries({ queryKey: ["flashcards"] });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-500/10">
              <Sparkles className="h-5 w-5 text-cyan-500" />
            </div>
            Study Mode
          </h1>
          <p className="mt-1 text-muted-foreground">Card {i + 1} of {cards.length}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl hover:bg-muted/80"
          onClick={() => { setFlipped(false); setI(0); }}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Progress bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center gap-3">
          <Progress value={progress} className="h-2 flex-1 rounded-full" />
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">{Math.round(progress)}%</span>
        </div>
      </motion.div>

      {/* 3D Flashcard */}
      <div className="[perspective:1200px]">
        <AnimatePresence mode="wait">
          <motion.button
            key={i}
            onClick={() => setFlipped((f) => !f)}
            className="relative block h-80 w-full rounded-3xl [transform-style:preserve-3d] cursor-pointer"
            style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0)" }}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Front — Question */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden [backface-visibility:hidden]">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10" />
              <div className="absolute inset-0 border border-border/60 rounded-3xl" />
              <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 grid h-8 w-8 place-items-center rounded-full bg-indigo-500/10">
                  <span className="text-xs font-bold text-indigo-500">Q</span>
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/60 mb-3">Question</span>
                <p className="text-2xl font-bold text-foreground leading-relaxed">{card.question}</p>
                <p className="mt-6 text-xs text-muted-foreground flex items-center gap-1.5">
                  <RotateCcw className="h-3 w-3" /> Click to reveal answer
                </p>
              </div>
            </div>

            {/* Back — Answer */}
            <div
              className="absolute inset-0 rounded-3xl overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
              <div className="relative h-full flex flex-col items-center justify-center p-8 text-center text-white">
                <div className="mb-4 grid h-8 w-8 place-items-center rounded-full bg-white/20">
                  <span className="text-xs font-bold text-white">A</span>
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/70 mb-3">Answer</span>
                <p className="text-2xl font-bold leading-relaxed">{card.answer}</p>
              </div>
            </div>
          </motion.button>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between gap-3"
      >
        <Button
          variant="outline"
          onClick={() => go(-1)}
          className="rounded-xl gap-1.5 border-border/60 hover:border-indigo-500/40"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>

        <Button
          onClick={markLearned}
          className={[
            "rounded-xl gap-1.5 transition-all duration-200",
            card.learned
              ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30 hover:bg-green-500/20"
              : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 hover:opacity-90 shadow-lg shadow-indigo-500/25",
          ].join(" ")}
        >
          <Check className="h-4 w-4" /> {card.learned ? "Learned ✓" : "Mark Learned"}
        </Button>

        <Button
          variant="outline"
          onClick={() => go(1)}
          className="rounded-xl gap-1.5 border-border/60 hover:border-indigo-500/40"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Card dots */}
      <div className="flex justify-center gap-1.5 flex-wrap">
        {cards.map((_, idx) => (
          <button
            key={idx}
            onClick={() => { setFlipped(false); setI(idx); }}
            className={[
              "h-2 rounded-full transition-all duration-200",
              idx === i ? "w-6 bg-indigo-500" : "w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}
