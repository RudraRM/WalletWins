import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SummaryCards } from "@/components/summary-cards";
import { CreditCardsSection } from "@/components/credit-cards-section";
import { TransactionsSection } from "@/components/transactions-section";
import { InsightsSection } from "@/components/insights-section";
import { ExpiringRewards } from "@/components/expiring-rewards";
import { RewardChart } from "@/components/reward-chart";
import { MissedOpportunities } from "@/components/missed-opportunities";
import { DigitalVsPhysical } from "@/components/digital-vs-physical";
import { RewardsLeak } from "@/components/rewards-leak";
import { RedemptionSuggestions } from "@/components/redemption-suggestions";
import { HowItWorks } from "@/components/how-it-works";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Link } from "wouter";
import { Sparkles, Wallet, FileText, FlaskConical, Plus } from "lucide-react";
import type { DashboardSummary, CreditCard, RewardCategory, Transaction, Reward, Insight } from "@shared/schema";

export default function Dashboard() {
  const [demoMode, setDemoMode] = useState(true);
  const [filterSaveProMax, setFilterSaveProMax] = useState(false);
  const [filterMidnightSnacks, setFilterMidnightSnacks] = useState(false);

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

  const { data: rewards, isLoading: rewardsLoading } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
  });

  const { data: insights, isLoading: insightsLoading } = useQuery<Insight[]>({
    queryKey: ["/api/insights"],
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
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  AI
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-1">
                <Switch
                  checked={demoMode}
                  onCheckedChange={setDemoMode}
                  data-testid="switch-demo-mode"
                />
                <span className="text-xs text-muted-foreground hidden sm:inline">Demo</span>
              </div>
              {demoMode && (
                <Badge variant="outline" className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] no-default-hover-elevate no-default-active-elevate" data-testid="badge-demo-mode">
                  <FlaskConical className="w-3 h-3 mr-1" />
                  Demo Mode Active
                </Badge>
              )}
              <Link href="/onboard">
                <Button variant="ghost" size="sm" data-testid="button-add-card">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Card</span>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-heading">
            Reward Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your credit card rewards at a glance
          </p>
        </div>

        <SummaryCards summary={summary} isLoading={summaryLoading} />

        <MissedOpportunities
          transactions={transactions}
          cards={cards}
          isLoading={transactionsLoading || cardsLoading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RewardsLeak />
          <div className="space-y-6">
            <ExpiringRewards
              rewards={rewards}
              cards={cards}
              isLoading={rewardsLoading || cardsLoading}
            />
            <RewardChart cards={cards} isLoading={cardsLoading} />
          </div>
        </div>

        <RedemptionSuggestions />

        <CreditCardsSection
          cards={cards}
          categories={categories}
          isLoading={cardsLoading || categoriesLoading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TransactionsSection
            transactions={transactions}
            cards={cards}
            isLoading={transactionsLoading || cardsLoading}
            filterCardName={filterSaveProMax ? "Card-SaveProMax" : filterMidnightSnacks ? "Card-MidnightSnacks" : null}
          />
          <InsightsSection insights={insights} isLoading={insightsLoading} />
        </div>

        <DigitalVsPhysical
          cardName="Card-SaveProMax"
          accentColor="blue"
          filterActive={filterSaveProMax}
          onFilterToggle={setFilterSaveProMax}
        />

        <DigitalVsPhysical
          cardName="Card-MidnightSnacks"
          accentColor="amber"
          filterActive={filterMidnightSnacks}
          onFilterToggle={setFilterMidnightSnacks}
        />

        <HowItWorks />
      </main>

      <footer className="border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                <Wallet className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs text-muted-foreground">
                WalletWins AI
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Sample data for demo purposes
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
