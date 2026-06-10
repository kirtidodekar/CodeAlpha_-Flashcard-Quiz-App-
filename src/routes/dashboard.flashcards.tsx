import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, BookOpen, Layers, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { listFlashcards, type Flashcard } from "@/lib/flashcards";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/dashboard/flashcards")({
  validateSearch: (s: Record<string, unknown>) => ({ new: s.new === "1" ? "1" : undefined }),
  component: FlashcardsPage,
});

const schema = z.object({
  question: z.string().trim().min(1, "Question is required").max(500),
  answer: z.string().trim().min(1, "Answer is required").max(2000),
  category: z.string().trim().min(1).max(50),
});

// Category color palette
const catColors = ["#6366F1", "#8B5CF6", "#06B6D4", "#22C55E", "#F59E0B", "#EC4899", "#EF4444", "#3B82F6"];
function catColor(cat: string, all: string[]) {
  return catColors[all.indexOf(cat) % catColors.length];
}

function FlashcardsPage() {
  const search = Route.useSearch();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: cards = [], isLoading } = useQuery({ queryKey: ["flashcards"], queryFn: listFlashcards });
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [editing, setEditing] = useState<Flashcard | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (search.new === "1") { setEditing(null); setOpen(true); }
  }, [search.new]);

  const categories = useMemo(() => Array.from(new Set(cards.map((c) => c.category))), [cards]);
  const filtered = cards.filter((c) =>
    (cat === "all" || c.category === cat) &&
    (query === "" || c.question.toLowerCase().includes(query.toLowerCase()) || c.answer.toLowerCase().includes(query.toLowerCase()))
  );

  async function onDelete(id: string) {
    const { error } = await supabase.from("flashcards").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["flashcards"] });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      question: fd.get("question"),
      answer: fd.get("answer"),
      category: fd.get("category") || "General",
    });
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);

    const payload = { ...parsed.data, user_id: user.id };
    const { error } = editing
      ? await supabase.from("flashcards").update(parsed.data).eq("id", editing.id)
      : await supabase.from("flashcards").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Updated" : "Created");
    setOpen(false); setEditing(null);
    qc.invalidateQueries({ queryKey: ["flashcards"] });
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: (i: number) => ({
      opacity: 1, y: 0, scale: 1,
      transition: { delay: Math.min(i * 0.05, 0.4), duration: 0.35, ease: "easeOut" as const },
    }),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/10">
              <Layers className="h-5 w-5 text-indigo-500" />
            </div>
            My Flashcards
          </h1>
          <p className="mt-1 text-muted-foreground">{cards.length} card{cards.length === 1 ? "" : "s"} total</p>
        </div>
        <Button
          onClick={() => { setEditing(null); setOpen(true); }}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 hover:opacity-90 hover-lift shadow-lg shadow-indigo-500/25"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Flashcard
        </Button>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card"
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Search flashcards…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="w-44 border-0 bg-muted/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid place-items-center rounded-2xl border border-border/60 bg-card p-16 text-center shadow-card"
        >
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-indigo-500/10">
            <BookOpen className="h-8 w-8 text-indigo-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No flashcards yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Create your first flashcard to start learning.</p>
          <Button
            className="mt-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0"
            onClick={() => { setEditing(null); setOpen(true); }}
          >
            <Plus className="mr-2 h-4 w-4" /> Create Flashcard
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map((c, i) => {
              const color = catColor(c.category, categories);
              return (
                <motion.div
                  key={c.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group relative rounded-2xl border border-border/60 bg-card p-5 overflow-hidden cursor-default"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  {/* Gradient top bar */}
                  <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${color}, ${color}99)` }} />

                  {/* Category tag */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{ background: `${color}15`, color }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                      {c.category}
                    </span>
                    {c.learned && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-green-600 dark:text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Learned
                      </span>
                    )}
                  </div>

                  {/* Question */}
                  <h4 className="font-semibold text-foreground leading-snug line-clamp-2">{c.question}</h4>

                  {/* Answer preview */}
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{c.answer}</p>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border/50">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setEditing(c); setOpen(true); }}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(c.id)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-500/10">
                <Layers className="h-4 w-4 text-indigo-500" />
              </div>
              {editing ? "Edit Flashcard" : "New Flashcard"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Textarea
                id="question"
                name="question"
                defaultValue={editing?.question}
                required
                className="rounded-xl resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                name="answer"
                defaultValue={editing?.answer}
                required
                className="rounded-xl resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                defaultValue={editing?.category ?? "General"}
                className="rounded-xl"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
                {editing ? "Save Changes" : "Create Flashcard"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
