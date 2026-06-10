import { supabase } from "@/integrations/supabase/client";

export type Flashcard = {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  category: string;
  learned: boolean;
  created_at: string;
  updated_at: string;
};

export type QuizResult = {
  id: string;
  user_id: string;
  score: number;
  total: number;
  accuracy: number;
  created_at: string;
};

export async function listFlashcards(): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Flashcard[];
}

export async function listQuizResults(): Promise<QuizResult[]> {
  const { data, error } = await supabase
    .from("quiz_results")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as QuizResult[];
}
