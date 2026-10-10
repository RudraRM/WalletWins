import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowRight, ShoppingCart, Utensils, Fuel, Plane, Wifi, ShoppingBag, Car, Zap, CircleDollarSign, Smartphone, CreditCard as CreditCardIcon } from "lucide-react";
import type { Transaction, CreditCard } from "@shared/schema";

interface TransactionsSectionProps {
  transactions: Transaction[] | undefined;
  cards: CreditCard[] | undefined;
  isLoading: boolean;
  filterCardName?: string | null;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  groceries: ShoppingCart,
  dining: Utensils,
  gas: Fuel,
  travel: Plane,
  streaming: Wifi,
  shopping: ShoppingBag,
  automotive: Car,
  utilities: Zap,
  general: CircleDollarSign,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function TransactionsSection({ transactions, cards, isLoading, filterCardName }: TransactionsSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) return null;

  const getCard = (id: string) => cards?.find((c) => c.id === id);

  const filteredTransactions = filterCardName
    ? transactions.filter((tx) => {
        const card = getCard(tx.cardId);
        return card?.name === filterCardName;
      })
    : transactions;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
          {filterCardName && (
            <Badge variant="outline" className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px] no-default-hover-elevate no-default-active-elevate">
              {filterCardName} only
            </Badge>
          )}
        </div>
        <Badge variant="secondary" className="text-xs">
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {filteredTransactions.map((tx) => {
            const IconComp = categoryIcons[tx.category.toLowerCase()] || CircleDollarSign;
            const usedCard = getCard(tx.cardId);
            const optimalCard = tx.optimalCardId ? getCard(tx.optimalCardId) : null;
            const hasMissedReward = tx.optimalCardId && tx.optimalCardId !== tx.cardId && tx.optimalRewards;
            const missedAmount = hasMissedReward ? (tx.optimalRewards! - tx.rewardsEarned) : 0;

            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover-elevate"
                data-testid={`row-transaction-${tx.id}`}
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-md bg-muted flex items-center justify-center">
                  <IconComp className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{tx.merchant}</span>
                    {hasMissedReward && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                              +{formatCurrency(missedAmount)} missed
                            </Badge>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            Use {optimalCard?.name} instead of {usedCard?.name}
                          </p>
                          <div className="flex items-center gap-1 text-xs mt-1 text-muted-foreground">
                            <span>{formatCurrency(tx.rewardsEarned)}</span>
                            <ArrowRight className="w-3 h-3" />
                            <span className="text-emerald-500">{formatCurrency(tx.optimalRewards!)}</span>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span>{formatDate(tx.date)}</span>
                    <span>via {usedCard?.name || "Unknown"}</span>
                    {tx.paymentMode && (
                      <span className="inline-flex items-center gap-0.5">
                        {tx.paymentMode === "digital" ? (
                          <Smartphone className="w-3 h-3" />
                        ) : (
                          <CreditCardIcon className="w-3 h-3" />
                        )}
                        {tx.paymentMode === "digital" ? "Digital" : "Physical"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium">{formatCurrency(tx.amount)}</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(tx.rewardsEarned)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
