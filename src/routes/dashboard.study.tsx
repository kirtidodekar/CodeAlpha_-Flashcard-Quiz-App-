import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Check, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { listFlashcards } from "@/lib/flashcards";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/study")({
  component: StudyMode,
});

function StudyMode() {
  const qc = useQueryClient();
  const { data: cards = [], isLoading } = useQuery({ queryKey: ["flashcards"], queryFn: listFlashcards });
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (isLoading) return <div className="glass h-80 animate-pulse rounded-2xl" />;
  if (cards.length === 0) {
    return (
      <div className="glass grid place-items-center rounded-2xl p-12 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground" />
        <h3 className="mt-3 text-lg font-semibold">Nothing to study yet</h3>
        <p className="text-sm text-muted-foreground">Create flashcards first.</p>
      </div>
    );
  }

  const card = cards[i];
  const go = (delta: number) => { setFlipped(false); setI((p) => (p + delta + cards.length) % cards.length); };

  async function markLearned() {
    const { error } = await supabase.from("flashcards").update({ learned: !card.learned }).eq("id", card.id);
    if (error) return toast.error(error.message);
    toast.success(card.learned ? "Unmarked" : "Marked as learned");
    qc.invalidateQueries({ queryKey: ["flashcards"] });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold">Study Mode</h1>
        <p className="text-muted-foreground">Card {i + 1} of {cards.length}</p>
        <Progress value={((i + 1) / cards.length) * 100} className="mt-3" />
      </div>

      <div className="[perspective:1200px]">
        <button
          onClick={() => setFlipped((f) => !f)}
          className="relative block h-80 w-full rounded-3xl transition-transform duration-500 [transform-style:preserve-3d]"
          style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0)" }}
        >
          <div className="absolute inset-0 glass grid place-items-center rounded-3xl p-8 text-center [backface-visibility:hidden]">
            <div>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Question</span>
              <p className="mt-4 text-2xl font-semibold">{card.question}</p>
              <p className="mt-6 text-sm text-muted-foreground">Click to reveal answer</p>
            </div>
          </div>
          <div className="absolute inset-0 gradient-primary grid place-items-center rounded-3xl p-8 text-center text-primary-foreground [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div>
              <span className="text-xs uppercase tracking-widest opacity-80">Answer</span>
              <p className="mt-4 text-2xl font-semibold">{card.answer}</p>
            </div>
          </div>
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => go(-1)}><ChevronLeft className="mr-1 h-4 w-4" /> Previous</Button>
        <Button onClick={markLearned} variant={card.learned ? "secondary" : "default"} className={card.learned ? "" : "gradient-primary text-primary-foreground border-0"}>
          <Check className="mr-1 h-4 w-4" /> {card.learned ? "Learned" : "Mark Learned"}
        </Button>
        <Button variant="outline" onClick={() => go(1)}>Next <ChevronRight className="ml-1 h-4 w-4" /></Button>
      </div>
    </div>
  );
}
