import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { SummaryCards } from "@/components/summary-cards";
import { CreditCardsSection } from "@/components/credit-cards-section";
import { TransactionsSection } from "@/components/transactions-section";
import { RewardChart } from "@/components/reward-chart";
import { MissedOpportunities } from "@/components/missed-opportunities";
import { HowItWorks } from "@/components/how-it-works";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, FileText, Wallet } from "lucide-react";
import type { DashboardSummary, CreditCard, RewardCategory, Transaction } from "@shared/schema";

export default function Dashboard() {
  const reduceMotion = useReducedMotion();
  const { data: summary, isLoading: summaryLoading } = useQuery<DashboardSummary>({
    queryKey: ["/api/dashboard/summary"],
  });

  const { data: cards, isLoading: cardsLoading } = useQuery<CreditCard[]>({
    queryKey: ["/api/cards"],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<RewardCategory[]>({
    queryKey: ["/api/categories"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight" data-testid="text-app-name">
                WalletWins
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/onboard">
                <Button variant="ghost" size="sm" data-testid="button-upload-statement">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload statement</span>
                </Button>
              </Link>
              <Link href="/statements">
                <Button variant="ghost" size="sm" data-testid="button-statements">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Statements</span>
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <motion.main
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-heading">
            Reward Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your credit card rewards at a glance
          </p>
        </div>

        {!cardsLoading && cards?.length === 0 ? (
          <div className="rounded-2xl border bg-card px-6 py-14 text-center sm:px-12">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-semibold">Start with a real statement</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Import a CSV or OFX export from your card issuer. WalletWins will organize purchases and estimate rewards from the rates you provide.
            </p>
            <Link href="/onboard">
              <Button className="mt-6" data-testid="button-empty-upload">Upload a statement <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        ) : (
          <>
            <SummaryCards summary={summary} isLoading={summaryLoading} />
            <MissedOpportunities transactions={transactions} cards={cards} isLoading={transactionsLoading || cardsLoading} />
            <RewardChart cards={cards} isLoading={cardsLoading} />
            <CreditCardsSection cards={cards} categories={categories} isLoading={cardsLoading || categoriesLoading} />
            <TransactionsSection transactions={transactions} cards={cards} isLoading={transactionsLoading || cardsLoading} />
            <HowItWorks />
          </>
        )}
      </motion.main>

      <footer className="border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                <Wallet className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs text-muted-foreground">
                WalletWins
              </span>
            </div>
            <Link href="/onboard" className="text-xs text-muted-foreground hover:text-foreground">Import another statement</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
