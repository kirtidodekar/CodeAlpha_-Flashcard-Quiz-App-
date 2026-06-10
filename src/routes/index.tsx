import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Brain, LineChart, Sparkles, Moon, BookOpen, Trophy,
  Github, Twitter, Linkedin, Mail, ArrowRight, Zap, Shield, BarChart2,
  ChevronRight,
} from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlashMaster — Learn Faster with Interactive Flashcards" },
      { name: "description", content: "Create flashcards, practice with quizzes, and track your learning progress. Study smarter with FlashMaster." },
    ],
  }),
  component: Landing,
});

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

function Landing() {
  const featuresRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: featuresRef, offset: ["start end", "end start"] });
  const featuresY = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <div className="min-h-screen overflow-hidden">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 glass-strong">
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              Flash<span className="text-gradient">Master</span>
            </span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            {["Home", "Features", "About"].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {l}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/auth">
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 hover:opacity-90 shadow-lg shadow-indigo-500/25 rounded-xl">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section id="home" className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(99,102,241,0.6)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.4)_0%,transparent_40%)]" />

        {/* Animated blobs */}
        <motion.div
          className="absolute top-20 left-[10%] h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl"
          animate={{ scale: [1, 1.3, 1], x: [0, 40, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-[15%] h-80 w-80 rounded-full bg-purple-400/20 blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/15 blur-3xl"
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating flashcard decorations */}
        <motion.div
          className="absolute top-32 right-[8%] hidden lg:block"
          animate={{ y: [0, -16, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-44 rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/20 shadow-2xl">
            <div className="h-2 w-12 rounded-full bg-white/30 mb-2" />
            <div className="h-2 w-full rounded-full bg-white/20 mb-1.5" />
            <div className="h-2 w-3/4 rounded-full bg-white/15" />
            <div className="mt-3 text-[10px] text-white/70 font-medium">Flashcard</div>
          </div>
        </motion.div>
        <motion.div
          className="absolute bottom-32 left-[5%] hidden lg:block"
          animate={{ y: [0, -12, 0], rotate: [0, -3, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <div className="w-40 rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/20 shadow-2xl">
            <div className="h-2 w-10 rounded-full bg-white/30 mb-2" />
            <div className="h-2 w-full rounded-full bg-white/20 mb-1.5" />
            <div className="h-2 w-2/3 rounded-full bg-white/15" />
            <div className="mt-3 text-[10px] text-white/70 font-medium">Quiz Result</div>
          </div>
        </motion.div>

        {/* Hero content */}
        <div className="container relative mx-auto grid gap-12 px-4 py-24 md:grid-cols-2 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col justify-center text-white"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium backdrop-blur-sm border border-white/20"
            >
              <Sparkles className="h-3 w-3" /> Smarter studying starts here
            </motion.span>
            <h1 className="text-5xl font-black leading-[1.1] tracking-tight md:text-7xl">
              Learn Faster<br />with Interactive<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-white">Flashcards</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-white/85 leading-relaxed">
              FlashMaster helps you create flashcards, master topics with adaptive quizzes,
              and track your progress — all in one beautiful study companion.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/auth">
                <Button
                  size="lg"
                  className="bg-white text-indigo-600 hover:bg-white/90 hover-lift rounded-xl font-bold shadow-xl shadow-black/20 text-base px-8"
                >
                  Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-white/10 text-white hover:bg-white/20 rounded-xl font-medium backdrop-blur-sm text-base"
                >
                  Explore Features <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex items-center justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-white/10 blur-xl scale-110" />
              <img
                src={heroImg}
                alt="Student studying with flashcards"
                width={560}
                height={560}
                className="relative w-full max-w-md rounded-3xl shadow-2xl shadow-black/30 border border-white/10"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" ref={featuresRef} className="container mx-auto px-4 py-24">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.h2 variants={fadeUp} className="text-4xl font-extrabold md:text-5xl tracking-tight">
            Everything you need to <span className="text-gradient">study smarter</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg text-muted-foreground">
            Powerful features designed for focused, effective learning.
          </motion.p>
        </motion.div>

        <motion.div
          style={{ y: featuresY }}
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4"
        >
          {[
            { icon: BookOpen, title: "Create Flashcards", desc: "Build decks organized by category in seconds.", color: "#6366F1" },
            { icon: BarChart2, title: "Track Progress", desc: "Visualize accuracy and weekly study streaks.", color: "#8B5CF6" },
            { icon: Trophy, title: "Quiz Practice", desc: "Multiple-choice quizzes with instant feedback.", color: "#06B6D4" },
            { icon: Moon, title: "Dark / Light Mode", desc: "Beautiful interface, day or night.", color: "#F59E0B" },
          ].map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group rounded-2xl border border-border/60 bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div
                className="grid h-12 w-12 place-items-center rounded-xl transition-transform group-hover:scale-110"
                style={{ background: `${f.color}12` }}
              >
                <f.icon className="h-5 w-5" style={{ color: f.color }} />
              </div>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-12 md:grid-cols-4">
          {[
            { value: "10K+", label: "Flashcards Created" },
            { value: "5K+", label: "Quizzes Taken" },
            { value: "95%", label: "Satisfaction Rate" },
            { value: "24/7", label: "Available" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black text-gradient">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── About / CTA ── */}
      <section id="about" className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
          <div className="relative p-12 text-center md:p-20">
            <h2 className="text-4xl font-extrabold text-white md:text-5xl">Built for ambitious learners</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-white/85">
              Whether you're cramming for finals or picking up a new language, FlashMaster gives you the
              tools and momentum to retain what matters.
            </p>
            <Link to="/auth">
              <Button
                size="lg"
                className="mt-8 bg-white text-indigo-600 hover:bg-white/90 hover-lift rounded-xl font-bold shadow-xl text-base px-8"
              >
                Start Learning Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/60">
        <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <span className="font-extrabold text-gradient text-lg">FlashMaster</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Learn faster. Remember longer.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Contact</h4>
            <p className="mt-2 text-sm text-muted-foreground">hello@flashmaster.app</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Follow</h4>
            <div className="mt-3 flex gap-3 text-muted-foreground">
              {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                <a key={i} href="#" className="grid h-9 w-9 place-items-center rounded-lg bg-muted/60 hover:bg-indigo-500/10 hover:text-indigo-500 transition-colors">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} FlashMaster. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
