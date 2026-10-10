import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plane, Receipt, UtensilsCrossed, Clapperboard, Home, Sparkles, Lock } from "lucide-react";

interface Suggestion {
  id: string;
  icon: string;
  category: string;
  title: string;
  merchant: string;
  pointsCost: number;
  dollarValue: number;
  description: string;
  tag: string;
}

interface RedemptionData {
  availablePoints: number;
  pointValue: number;
  suggestions: Suggestion[];
  aspirational: Suggestion[];
  allSuggestions: Suggestion[];
}

const iconMap: Record<string, typeof Plane> = {
  Plane,
  Receipt,
  UtensilsCrossed,
  Clapperboard,
  Home,
};

const tagColors: Record<string, string> = {
  "Best Value": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  "Smart Move": "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  "Popular": "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
  "Fun Pick": "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  "Big Saver": "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
};

const categoryColors: Record<string, string> = {
  Travel: "from-blue-500 to-sky-600",
  Finance: "from-emerald-500 to-teal-600",
  Dining: "from-purple-500 to-violet-600",
  Entertainment: "from-amber-500 to-orange-600",
  Housing: "from-rose-500 to-pink-600",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function SuggestionCard({ suggestion, available, canAfford }: { suggestion: Suggestion; available: number; canAfford: boolean }) {
  const IconComponent = iconMap[suggestion.icon] || Sparkles;
  const gradient = categoryColors[suggestion.category] || "from-gray-500 to-gray-600";
  const tagColor = tagColors[suggestion.tag] || "bg-muted text-muted-foreground";
  const progress = Math.min((available / suggestion.pointsCost) * 100, 100);

  return (
    <Card
      className={`transition-all duration-200 ${canAfford ? "hover-elevate" : "opacity-70"}`}
      data-testid={`card-suggestion-${suggestion.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3 flex-wrap">
          <div className={`w-10 h-10 rounded-md bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
            <IconComponent className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold" data-testid={`text-suggestion-title-${suggestion.id}`}>
                {suggestion.title}
              </span>
              <Badge variant="outline" className={`text-[10px] no-default-hover-elevate no-default-active-elevate ${tagColor}`} data-testid={`badge-suggestion-tag-${suggestion.id}`}>
                {suggestion.tag}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5" data-testid={`text-suggestion-merchant-${suggestion.id}`}>
              {suggestion.merchant}
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-1 italic" data-testid={`text-suggestion-desc-${suggestion.id}`}>
              {suggestion.description}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-bold" data-testid={`text-suggestion-value-${suggestion.id}`}>
              {formatCurrency(suggestion.dollarValue)}
            </div>
            <div className="text-[10px] text-muted-foreground" data-testid={`text-suggestion-points-${suggestion.id}`}>
              {suggestion.pointsCost.toLocaleString()} pts
            </div>
          </div>
        </div>

        {!canAfford && (
          <div className="mt-3">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
              <div className="flex items-center gap-1 flex-wrap">
                <Lock className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground" data-testid={`text-suggestion-remaining-${suggestion.id}`}>
                  {(suggestion.pointsCost - available).toLocaleString()} pts to go
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground" data-testid={`text-suggestion-progress-${suggestion.id}`}>
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RedemptionSuggestions() {
  const { data, isLoading } = useQuery<RedemptionData>({
    queryKey: ["/api/redemption-suggestions"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <CardTitle className="text-lg">Maximum Benefit Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card data-testid="section-redemption-suggestions">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2 flex-wrap" data-testid="text-redemption-heading">
            Maximum Benefit Categories
            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] no-default-hover-elevate no-default-active-elevate" data-testid="badge-ai-recommended">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Recommended
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1" data-testid="text-redemption-subtitle">
            Smart ways to redeem your {data.availablePoints.toLocaleString()} reward points ({formatCurrency(data.pointValue)})
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.suggestions.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider" data-testid="text-ready-to-redeem">
                Ready to Redeem
              </p>
              {data.suggestions.map((s) => (
                <SuggestionCard key={s.id} suggestion={s} available={data.availablePoints} canAfford={true} />
              ))}
            </div>
          )}
          {data.aspirational.length > 0 && (
            <div className="space-y-3 mt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" data-testid="text-keep-earning">
                Keep Earning For
              </p>
              {data.aspirational.map((s) => (
                <SuggestionCard key={s.id} suggestion={s} available={data.availablePoints} canAfford={false} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
