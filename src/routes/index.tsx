import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Brain, LineChart, Sparkles, Moon, BookOpen, Trophy,
  Github, Twitter, Linkedin, Mail, ArrowRight,
} from "lucide-react";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlashMaster — Learn Faster with Interactive Flashcards" },
      { name: "description", content: "Create flashcards, practice with quizzes, and track your learning progress. Study smarter with FlashMaster." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-40 glass">
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg gradient-primary shadow-glow">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-gradient">FlashMaster</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#home" className="text-sm hover:text-primary transition">Home</a>
            <a href="#features" className="text-sm hover:text-primary transition">Features</a>
            <a href="#about" className="text-sm hover:text-primary transition">About</a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/auth">
              <Button className="gradient-primary text-primary-foreground border-0 hover:opacity-90">Login</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_40%)] opacity-10" />
        <div className="container relative mx-auto grid gap-12 px-4 py-20 md:grid-cols-2 md:py-32">
          <div className="flex flex-col justify-center text-primary-foreground animate-fade-in-up">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
              <Sparkles className="h-3 w-3" /> Smarter studying starts here
            </span>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
              Learn Faster with<br />Interactive Flashcards
            </h1>
            <p className="mt-6 max-w-lg text-lg text-white/90">
              FlashMaster helps you create flashcards, master topics with adaptive quizzes,
              and track your progress — all in one beautiful study companion.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/auth">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 hover-lift">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-primary-foreground hover:bg-white/20">
                  Explore Features
                </Button>
              </a>
            </div>
          </div>
          <div className="flex items-center justify-center animate-fade-in-up">
            <img
              src={heroImg}
              alt="Student studying with flashcards"
              width={560}
              height={560}
              className="w-full max-w-md rounded-3xl shadow-glow"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Everything you need to <span className="text-gradient">study smarter</span></h2>
          <p className="mt-4 text-muted-foreground">Powerful features designed for focused, effective learning.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BookOpen, title: "Create Flashcards", desc: "Build decks organized by category in seconds." },
            { icon: LineChart, title: "Track Progress", desc: "Visualize accuracy and weekly study streaks." },
            { icon: Trophy, title: "Quiz Practice", desc: "Multiple-choice quizzes with instant feedback." },
            { icon: Moon, title: "Dark / Light Mode", desc: "Beautiful interface, day or night." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 hover-lift">
              <div className="grid h-12 w-12 place-items-center rounded-xl gradient-primary text-primary-foreground">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About / CTA */}
      <section id="about" className="container mx-auto px-4 py-20">
        <div className="glass rounded-3xl p-10 text-center md:p-16">
          <h2 className="text-3xl font-bold md:text-4xl">Built for ambitious learners</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Whether you're cramming for finals or picking up a new language, FlashMaster gives you the
            tools and momentum to retain what matters.
          </p>
          <Link to="/auth">
            <Button size="lg" className="mt-8 gradient-primary text-primary-foreground border-0 hover-lift">
              Start Learning Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary">
                <Brain className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-gradient">FlashMaster</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Learn faster. Remember longer.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Contact</h4>
            <p className="mt-2 text-sm text-muted-foreground">hello@flashmaster.app</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Follow</h4>
            <div className="mt-2 flex gap-3 text-muted-foreground">
              <a href="#" aria-label="Twitter"><Twitter className="h-5 w-5 hover:text-primary" /></a>
              <a href="#" aria-label="GitHub"><Github className="h-5 w-5 hover:text-primary" /></a>
              <a href="#" aria-label="LinkedIn"><Linkedin className="h-5 w-5 hover:text-primary" /></a>
              <a href="#" aria-label="Email"><Mail className="h-5 w-5 hover:text-primary" /></a>
            </div>
          </div>
        </div>
        <div className="border-t py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} FlashMaster. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
