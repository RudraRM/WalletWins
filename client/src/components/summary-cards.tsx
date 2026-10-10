import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, CreditCard } from "lucide-react";
import type { DashboardSummary } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

interface SummaryCardsProps {
  summary: DashboardSummary | undefined;
  isLoading: boolean;
}

export function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const cards = [
    {
      label: "Estimated rewards",
      value: formatCurrency(summary.totalRewardsEarned),
      subtitle: `${summary.rewardRate.toFixed(1)}% estimated reward rate`,
      icon: TrendingUp,
      iconColor: "text-emerald-500 dark:text-emerald-400",
      bgAccent: "bg-emerald-500/10",
    },
    {
      label: "Potential improvement",
      value: formatCurrency(summary.missedRewards),
      subtitle: "Using the rates you entered",
      icon: TrendingDown,
      iconColor: "text-amber-500 dark:text-amber-400",
      bgAccent: "bg-amber-500/10",
      badge: summary.missedRewards > 0 ? "Action needed" : undefined,
    },
    {
      label: "Imported spend",
      value: formatCurrency(summary.monthlySpend),
      subtitle: `Across ${summary.totalCards} card${summary.totalCards !== 1 ? "s" : ""}`,
      icon: CreditCard,
      iconColor: "text-blue-500 dark:text-blue-400",
      bgAccent: "bg-blue-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="hover-elevate transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <span className="text-sm text-muted-foreground font-medium" data-testid={`text-label-${card.label.toLowerCase().replace(/\s+/g, '-')}`}>
                {card.label}
              </span>
              <div className={`rounded-md p-1.5 ${card.bgAccent}`}>
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight" data-testid={`text-value-${card.label.toLowerCase().replace(/\s+/g, '-')}`}>
              {card.value}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground">{card.subtitle}</span>
              {card.badge && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {card.badge}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
