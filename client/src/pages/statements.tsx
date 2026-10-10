import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Wallet,
  ChevronDown,
  ChevronRight,
  CreditCard,
  ArrowLeft,
  DollarSign,
  Percent,
  TrendingUp,
  Receipt,
  CircleDollarSign,
} from "lucide-react";
import type { CreditCard as CreditCardType, Transaction } from "@shared/schema";

type CategoryBreakdown = {
  category: string;
  rewardRate: number;
  spend: number;
  rewards: number;
  transactions: Transaction[];
};

type CardStatement = {
  card: CreditCardType;
  totalSpend: number;
  rewardsEarned: number;
  effectiveCashback: number;
  transactionCount: number;
  categoryBreakdown: CategoryBreakdown[];
};

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function StatementSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-muted" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="h-3 bg-muted rounded w-20" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-14 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryRow({
  breakdown,
  isExpanded,
  onToggle,
  color,
}: {
  breakdown: CategoryBreakdown;
  isExpanded: boolean;
  onToggle: () => void;
  color: string;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover-elevate active-elevate-2"
        data-testid={`button-category-${breakdown.category.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )}
        <span className="text-sm font-medium flex-1">{breakdown.category}</span>
        <span className="text-xs text-muted-foreground mr-3">
          {breakdown.rewardRate}%
        </span>
        <span className="text-xs text-muted-foreground mr-3">
          {formatCurrency(breakdown.spend)}
        </span>
        <span className="text-xs font-medium" style={{ color }}>
          +{formatCurrency(breakdown.rewards)}
        </span>
      </button>
      {isExpanded && (
        <div className="ml-6 mt-1 mb-2 space-y-0.5">
          {breakdown.transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground"
              data-testid={`text-transaction-${tx.id}`}
            >
              <Receipt className="w-3 h-3 shrink-0" />
              <span className="flex-1 truncate">{tx.merchant}</span>
              <span className="tabular-nums">{formatCurrency(tx.amount)}</span>
              <span className="tabular-nums font-medium text-foreground" style={{ color }}>
                +{formatCurrency(tx.rewardsEarned)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatementCard({
  statement,
  maxSpend,
}: {
  statement: CardStatement;
  maxSpend: number;
}) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const spendBarWidth = maxSpend > 0 ? (statement.totalSpend / maxSpend) * 100 : 0;

  const gradientColors: Record<string, { from: string; to: string; accent: string }> = {
    blue: { from: "from-blue-500", to: "to-blue-600", accent: "#3b82f6" },
    emerald: { from: "from-emerald-500", to: "to-emerald-600", accent: "#10b981" },
    purple: { from: "from-purple-500", to: "to-purple-600", accent: "#8b5cf6" },
    amber: { from: "from-amber-500", to: "to-amber-600", accent: "#f59e0b" },
    rose: { from: "from-rose-500", to: "to-rose-600", accent: "#f43f5e" },
    indigo: { from: "from-indigo-500", to: "to-indigo-600", accent: "#6366f1" },
    cyan: { from: "from-cyan-500", to: "to-cyan-600", accent: "#06b6d4" },
    orange: { from: "from-orange-500", to: "to-orange-600", accent: "#f97316" },
  };

  const cardColor = gradientColors[statement.card.color] || gradientColors.blue;

  return (
    <div
      className="rounded-xl border border-border bg-card overflow-visible"
      data-testid={`card-statement-${statement.card.id}`}
    >
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cardColor.from} ${cardColor.to} flex items-center justify-center shrink-0`}
          >
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold truncate" data-testid={`text-card-name-${statement.card.id}`}>
              {statement.card.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {statement.card.issuer} ···{statement.card.lastFour}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Spend
              </span>
            </div>
            <p className="text-base font-bold tabular-nums" data-testid={`text-spend-${statement.card.id}`}>
              {formatCurrency(statement.totalSpend)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-1 mb-1">
              <CircleDollarSign className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Est. rewards
              </span>
            </div>
            <p className="text-base font-bold tabular-nums" style={{ color: cardColor.accent }} data-testid={`text-earned-${statement.card.id}`}>
              {formatCurrency(statement.rewardsEarned)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-1 mb-1">
              <Percent className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Rate
              </span>
            </div>
            <p className="text-base font-bold tabular-nums" data-testid={`text-rate-${statement.card.id}`}>
              {statement.effectiveCashback.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Relative spend
            </span>
            <span className="text-[10px] text-muted-foreground">
              {statement.transactionCount} txns
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${cardColor.from} ${cardColor.to} transition-all duration-500`}
              style={{ width: `${spendBarWidth}%` }}
              data-testid={`bar-spend-${statement.card.id}`}
            />
          </div>
        </div>

        {statement.categoryBreakdown.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-3 pb-1.5 mb-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex-1">
                Category
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mr-3">
                Rate
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mr-3">
                Spend
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Earned
              </span>
            </div>
            <div className="space-y-0.5">
              {statement.categoryBreakdown.map((cat) => (
                <CategoryRow
                  key={cat.category}
                  breakdown={cat}
                  isExpanded={expandedCategories.has(cat.category)}
                  onToggle={() => toggleCategory(cat.category)}
                  color={cardColor.accent}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Statements() {
  const reduceMotion = useReducedMotion();
  const { data: statements, isLoading } = useQuery<CardStatement[]>({
    queryKey: ["/api/statements"],
  });

  const maxSpend = statements
    ? Math.max(...statements.map((s) => s.totalSpend), 1)
    : 1;

  const totals = statements
    ? {
        spend: statements.reduce((s, st) => s + st.totalSpend, 0),
        earned: statements.reduce((s, st) => s + st.rewardsEarned, 0),
        txns: statements.reduce((s, st) => s + st.transactionCount, 0),
      }
    : null;

  const avgCashback =
    totals && totals.spend > 0 ? (totals.earned / totals.spend) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button size="icon" variant="ghost" data-testid="button-back-dashboard">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight" data-testid="text-app-name">
                  WalletWins
                </span>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <motion.main
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-heading">
              Spending by card
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Spending and estimated rewards by card and category
            </p>
          </div>
        </div>

        {!isLoading && totals && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Total Spend",
                value: formatCurrency(totals.spend),
                icon: DollarSign,
                id: "total-spend",
              },
              {
                label: "Estimated rewards",
                value: formatCurrency(totals.earned),
                icon: CircleDollarSign,
                id: "total-earned",
              },
              {
                label: "Avg. reward rate",
                value: `${avgCashback.toFixed(1)}%`,
                icon: TrendingUp,
                id: "avg-cashback",
              },
              {
                label: "Transactions",
                value: totals.txns.toString(),
                icon: Receipt,
                id: "total-txns",
              },
            ].map((stat) => (
              <div
                key={stat.id}
                className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"
                data-testid={`card-stat-${stat.id}`}
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <stat.icon className="w-4 h-4 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    {stat.label}
                  </p>
                  <p className="text-lg font-bold tabular-nums" data-testid={`text-stat-${stat.id}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoading ? (
          <StatementSkeleton />
        ) : statements && statements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {statements.map((st) => (
              <StatementCard key={st.card.id} statement={st} maxSpend={maxSpend} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No imported statements yet.</p>
            <Link href="/onboard"><Button className="mt-4">Upload a statement</Button></Link>
          </div>
        )}
      </motion.main>

      <footer className="border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                <Wallet className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs text-muted-foreground">WalletWins</span>
            </div>
            <Link href="/onboard" className="text-xs text-muted-foreground hover:text-foreground">Upload a statement</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
