import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, TrendingUp, AlertTriangle, ArrowUpRight, Target, Sparkles } from "lucide-react";
import type { Insight } from "@shared/schema";

interface InsightsSectionProps {
  insights: Insight[] | undefined;
  isLoading: boolean;
}

const insightIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  lightbulb: Lightbulb,
  trending: TrendingUp,
  alert: AlertTriangle,
  opportunity: ArrowUpRight,
  target: Target,
  ai: Sparkles,
};

const typeStyles: Record<string, { bg: string; text: string; badge: string; badgeBg: string }> = {
  win: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    badge: "Win",
    badgeBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  tip: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    badge: "Tip",
    badgeBg: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  leak: {
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    badge: "Leak",
    badgeBg: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
  },
  opportunity: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    badge: "Opportunity",
    badgeBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  warning: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    badge: "Warning",
    badgeBg: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  action: {
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    badge: "Action",
    badgeBg: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
  },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function InsightsSection({ insights, isLoading }: InsightsSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <CardTitle className="text-lg">AI Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Skeleton className="h-9 w-9 rounded-md flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.length === 0) return null;

  const sorted = [...insights].sort((a, b) => b.priority - a.priority);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <CardTitle className="text-lg">AI Insights</CardTitle>
        </div>
        <Badge variant="secondary" className="text-xs">
          {insights.length} insight{insights.length !== 1 ? "s" : ""}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sorted.map((insight) => {
            const IconComp = insightIcons[insight.icon] || Lightbulb;
            const style = typeStyles[insight.type] || typeStyles.tip;

            return (
              <div
                key={insight.id}
                className="flex items-start gap-3 p-3 rounded-lg hover-elevate"
                data-testid={`card-insight-${insight.id}`}
              >
                <div className={`flex-shrink-0 w-9 h-9 rounded-md ${style.bg} flex items-center justify-center`}>
                  <IconComp className={`w-4 h-4 ${style.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-medium">{insight.title}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 no-default-hover-elevate no-default-active-elevate ${style.badgeBg}`}>
                      {style.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>
                  {insight.potentialValue && insight.potentialValue > 0 && (
                    <div className="mt-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Potential value: {formatCurrency(insight.potentialValue)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
