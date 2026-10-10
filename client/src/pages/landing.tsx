import { useLocation } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Wallet,
  ArrowRight,
  FileUp,
  ChartNoAxesCombined,
  CircleDollarSign,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  ReceiptText,
} from "lucide-react";

const features = [
  {
    icon: CircleDollarSign,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    title: "Know what you earned",
    description: "Turn real purchases into clear reward estimates using the rates you set for each category.",
  },
  {
    icon: ChartNoAxesCombined,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    title: "Compare your cards",
    description: "See where another card in your wallet could have earned more on the same purchase.",
  },
  {
    icon: ShieldCheck,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
    title: "Stay in control",
    description: "Review every imported row and category before it becomes part of your dashboard.",
  },
];

const steps = [
  { icon: FileUp, title: "Upload a statement", description: "Import a CSV or OFX export from your card issuer." },
  { icon: ReceiptText, title: "Review your purchases", description: "Check the merchants, dates, and categories before saving." },
  { icon: ChartNoAxesCombined, title: "See your reward picture", description: "Set category rates and compare your cards using your own data." },
];

const sectionMotion = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export default function Landing() {
  const [, navigate] = useLocation();
  const reduceMotion = useReducedMotion();
  const entrance = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : sectionMotion;

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <motion.header
        initial={reduceMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md"
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button className="flex items-center gap-2" onClick={() => navigate("/")} aria-label="WalletWins home">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-emerald-500">
              <Wallet className="h-4 w-4 text-white" />
            </span>
            <span className="text-lg font-bold tracking-tight" data-testid="text-landing-logo">WalletWins</span>
          </button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="hidden sm:inline-flex">Dashboard</Button>
            <ThemeToggle />
          </div>
        </div>
      </motion.header>

      <main>
        <section className="relative isolate overflow-hidden py-20 sm:py-28 lg:py-36">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <motion.div
              className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl"
              animate={reduceMotion ? undefined : { x: [0, 24, 0], y: [0, -20, 0] }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"
              animate={reduceMotion ? undefined : { x: [0, -20, 0], y: [0, 18, 0] }}
              transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <motion.div
            className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.12 } } }}
          >
            <motion.div variants={entrance} className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">A clearer view of your credit card rewards</span>
            </motion.div>

            <motion.h1
              variants={entrance}
              className="mx-auto max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-7xl"
              data-testid="text-hero-heading"
            >
              Make every card purchase count.
              <span className="mt-2 block bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                See what your rewards could be.
              </span>
            </motion.h1>

            <motion.p variants={entrance} className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg" data-testid="text-hero-subtitle">
              Bring in a statement from your bank, review your spending, and compare estimated rewards across the cards you use.
            </motion.p>

            <motion.div variants={entrance} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <motion.div whileHover={reduceMotion ? undefined : { scale: 1.035 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                <Button size="lg" onClick={() => navigate("/onboard")} data-testid="button-upload-statement">
                  <FileUp className="h-4 w-4" /> Upload a statement <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
              <Button variant="outline" size="lg" onClick={() => navigate("/dashboard")} data-testid="button-view-dashboard">
                View dashboard <ArrowUpRight className="h-4 w-4" />
              </Button>
            </motion.div>

            <motion.div variants={entrance} className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span>CSV and OFX exports</span><span className="hidden h-1 w-1 rounded-full bg-muted-foreground/50 sm:block" />
              <span>Review before import</span><span className="hidden h-1 w-1 rounded-full bg-muted-foreground/50 sm:block" />
              <span>No bank login required</span>
            </motion.div>
          </motion.div>
        </section>

        <motion.section
          className="border-y bg-muted/20 py-16 sm:py-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.12 } } }}
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
            {features.map((feature) => (
              <motion.article
                key={feature.title}
                variants={entrance}
                whileHover={reduceMotion ? undefined : { y: -6, transition: { duration: 0.2 } }}
                className="rounded-2xl border border-border/80 bg-card p-6 text-center shadow-sm sm:p-7"
                data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${feature.iconBg}`}>
                  <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <h2 className="text-base font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </motion.article>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="py-16 sm:py-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.14 } } }}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div variants={entrance} className="mx-auto mb-12 max-w-xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">Simple, by design</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Your spending, turned into a useful picture.</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">You choose what to import and set the reward rates. WalletWins handles the comparison.</p>
            </motion.div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {steps.map((step, index) => (
                <motion.article key={step.title} variants={entrance} className="relative flex flex-col items-center text-center" data-testid={`card-step-${index + 1}`}>
                  {index < steps.length - 1 && <div className="absolute left-[62%] top-6 hidden h-px w-[76%] bg-gradient-to-r from-blue-500/30 to-emerald-500/30 md:block" />}
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-lg shadow-blue-500/15">
                    <step.icon className="h-5 w-5" />
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">{index + 1}</span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold">{step.title}</h3>
                  <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">{step.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: 18 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border bg-card p-8 text-center shadow-lg sm:p-12">
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-14 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="relative">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 text-white">
                <Wallet className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">Start with one statement.</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Review your purchases, enter your card's reward rates, and get a dashboard based on your own data.
              </p>
              <motion.div className="mt-7 inline-block" whileHover={reduceMotion ? undefined : { scale: 1.035 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                <Button size="lg" onClick={() => navigate("/onboard")} data-testid="button-cta-bottom">
                  Upload a statement <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-emerald-500"><Wallet className="h-3 w-3 text-white" /></span>
            <span className="text-xs text-muted-foreground">WalletWins</span>
          </div>
          <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => navigate("/dashboard")}>Go to dashboard</button>
        </div>
      </footer>
    </div>
  );
}
