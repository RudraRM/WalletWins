import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, AlertTriangle } from "lucide-react";
import type { Reward, CreditCard } from "@shared/schema";

interface ExpiringRewardsProps {
  rewards: Reward[] | undefined;
  cards: CreditCard[] | undefined;
  isLoading: boolean;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function daysUntil(date: string | Date) {
  const target = new Date(date);
  const now = new Date();
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function ExpiringRewards({ rewards, cards, isLoading }: ExpiringRewardsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <CardTitle className="text-lg">Expiring Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-2 w-full mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const expiringRewards = rewards?.filter((r) => r.isExpiringSoon && r.expiryDate) || [];

  if (expiringRewards.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-lg">Expiring Rewards</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-sm text-muted-foreground">All rewards are safe for now</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...expiringRewards].sort((a, b) => {
    const daysA = daysUntil(a.expiryDate!);
    const daysB = daysUntil(b.expiryDate!);
    return daysA - daysB;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <CardTitle className="text-lg">Expiring Rewards</CardTitle>
        </div>
        <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700">
          {expiringRewards.length} expiring
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sorted.map((reward) => {
            const card = cards?.find((c) => c.id === reward.cardId);
            const days = daysUntil(reward.expiryDate!);
            const urgency = days <= 7 ? "critical" : days <= 14 ? "warning" : "normal";
            const progressVal = Math.max(0, Math.min(100, 100 - (days / 30) * 100));

            return (
              <div key={reward.id} className="space-y-2" data-testid={`card-expiring-${reward.id}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <span className="text-sm font-medium">
                      {formatCurrency(reward.amount)} {reward.type}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {card?.name}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${
                      urgency === "critical"
                        ? "text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700"
                        : urgency === "warning"
                        ? "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700"
                        : ""
                    }`}
                  >
                    {days === 0 ? "Expires today" : `${days} day${days !== 1 ? "s" : ""} left`}
                  </Badge>
                </div>
                <Progress value={progressVal} className="h-1.5" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
