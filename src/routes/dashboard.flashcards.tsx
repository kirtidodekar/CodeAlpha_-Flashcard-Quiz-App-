import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Loader2, BookOpen } from "lucide-react";
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

export const Route = createFileRoute("/dashboard/flashcards")({
  validateSearch: (s: Record<string, unknown>) => ({ new: s.new === "1" ? "1" : undefined }),
  component: FlashcardsPage,
});

const schema = z.object({
  question: z.string().trim().min(1, "Question is required").max(500),
  answer: z.string().trim().min(1, "Answer is required").max(2000),
  category: z.string().trim().min(1).max(50),
});

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

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">My Flashcards</h1>
          <p className="text-muted-foreground">{cards.length} card{cards.length === 1 ? "" : "s"} total</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gradient-primary text-primary-foreground border-0">
          <Plus className="mr-2 h-4 w-4" /> Add Flashcard
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass h-40 animate-pulse rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass grid place-items-center rounded-2xl p-12 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 text-lg font-semibold">No flashcards yet</h3>
          <p className="text-sm text-muted-foreground">Create your first flashcard to start learning.</p>
          <Button className="mt-4 gradient-primary text-primary-foreground border-0" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Create Flashcard
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="glass flex flex-col rounded-2xl p-5 hover-lift">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="secondary">{c.category}</Badge>
                {c.learned && <Badge className="gradient-primary text-primary-foreground border-0">Learned</Badge>}
              </div>
              <h4 className="mt-3 font-semibold">{c.question}</h4>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{c.answer}</p>
              <div className="mt-auto flex gap-2 pt-4">
                <Button size="sm" variant="outline" onClick={() => { setEditing(c); setOpen(true); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => onDelete(c.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Flashcard" : "New Flashcard"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Textarea id="question" name="question" defaultValue={editing?.question} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea id="answer" name="answer" defaultValue={editing?.answer} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" defaultValue={editing?.category ?? "General"} />
            </div>
            <DialogFooter>
              <Button type="submit" className="gradient-primary text-primary-foreground border-0">
                {editing ? "Save Changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
