import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, TrendingUp, AlertCircle, CircleDollarSign, Target } from "lucide-react";
import type { Transaction, CreditCard } from "@shared/schema";

interface MissedOpportunitiesProps {
  transactions: Transaction[] | undefined;
  cards: CreditCard[] | undefined;
  isLoading: boolean;
}

const cardColorMap: Record<string, string> = {
  blue: "from-blue-500 to-blue-600",
  purple: "from-purple-500 to-purple-600",
  emerald: "from-emerald-500 to-emerald-600",
  amber: "from-amber-500 to-amber-600",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function MissedOpportunities({ transactions, cards, isLoading }: MissedOpportunitiesProps) {
  if (isLoading) {
    return (
      <div data-testid="section-missed-opportunities">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold tracking-tight">Rewards You Missed</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-24 mb-3" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const missed = transactions?.filter(
    (tx) => tx.optimalCardId && tx.optimalCardId !== tx.cardId && tx.optimalRewards
  ) || [];

  if (missed.length === 0) {
    return (
      <div data-testid="section-missed-opportunities">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">Perfect Card Picks</p>
                <p className="text-xs text-muted-foreground">You used the optimal card for every transaction</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalMissed = missed.reduce((sum, tx) => sum + (tx.optimalRewards! - tx.rewardsEarned), 0);
  const totalEarned = missed.reduce((sum, tx) => sum + tx.rewardsEarned, 0);
  const totalOptimal = missed.reduce((sum, tx) => sum + tx.optimalRewards!, 0);
  const getCard = (id: string) => cards?.find((c) => c.id === id);

  const topMissed = [...missed]
    .sort((a, b) => (b.optimalRewards! - b.rewardsEarned) - (a.optimalRewards! - a.rewardsEarned))
    .slice(0, 5);

  return (
    <div data-testid="section-missed-opportunities">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold tracking-tight">Rewards You Missed</h2>
        </div>
        <Badge variant="outline" className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs no-default-hover-elevate no-default-active-elevate" data-testid="badge-total-missed">
          {formatCurrency(totalMissed)} recoverable
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <Card className="border-rose-500/15 bg-rose-500/5" data-testid="widget-total-missed">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-md bg-rose-500/15 flex items-center justify-center">
                <CircleDollarSign className="w-4 h-4 text-rose-500" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Missed</span>
            </div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums" data-testid="text-total-missed-value">
              {formatCurrency(totalMissed)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              across {missed.length} transaction{missed.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/15 bg-blue-500/5" data-testid="widget-actual-earned">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-md bg-blue-500/15 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">You Earned</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums" data-testid="text-actual-earned-value">
              {formatCurrency(totalEarned)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              on these transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/15 bg-emerald-500/5" data-testid="widget-could-have-earned">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-md bg-emerald-500/15 flex items-center justify-center">
                <Target className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Could Have Earned</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums" data-testid="text-could-earned-value">
              {formatCurrency(totalOptimal)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              with the right card
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {topMissed.map((tx) => {
          const usedCard = getCard(tx.cardId);
          const optimalCard = tx.optimalCardId ? getCard(tx.optimalCardId) : null;
          const diff = tx.optimalRewards! - tx.rewardsEarned;
          const optGradient = optimalCard ? cardColorMap[optimalCard.color] || "from-gray-500 to-gray-600" : "from-gray-500 to-gray-600";

          return (
            <Card
              key={tx.id}
              className="hover-elevate"
              data-testid={`widget-missed-${tx.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-1 mb-3 flex-wrap">
                  <span className="text-sm font-semibold truncate">{tx.merchant}</span>
                  <Badge variant="secondary" className="text-[10px] shrink-0 no-default-hover-elevate">
                    {tx.category}
                  </Badge>
                </div>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums mb-3" data-testid={`text-missed-amount-${tx.id}`}>
                  +{formatCurrency(diff)}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                    <span className="text-muted-foreground truncate">{usedCard?.name?.replace("Card-", "") || "?"}</span>
                    <span className="text-muted-foreground/60 tabular-nums ml-auto shrink-0">{formatCurrency(tx.rewardsEarned)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowRight className="w-3 h-3 shrink-0" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${optGradient} shrink-0`} />
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium truncate">
                      {optimalCard?.name?.replace("Card-", "") || "?"}
                    </span>
                    <span className="text-emerald-600/70 dark:text-emerald-400/70 tabular-nums ml-auto shrink-0">
                      {formatCurrency(tx.optimalRewards!)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
