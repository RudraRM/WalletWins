import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Smartphone, CreditCard, Wallet, AlertTriangle, Receipt, Filter } from "lucide-react";
import type { CreditCard as CreditCardType, Transaction } from "@shared/schema";

type ModeData = {
  spend: number;
  rewards: number;
  cashback: number;
  transactionCount: number;
  transactions: Transaction[];
};

type DigitalVsPhysicalData = {
  card: CreditCardType;
  digital_spend: number;
  physical_spend: number;
  digital_rewards: number;
  physical_rewards: number;
  total_rewards: number;
  missed_rewards_due_to_mode: number;
  digital: ModeData;
  physical: ModeData;
  modeLeak: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function ModePanel({
  mode,
  data,
  icon: Icon,
  accent,
}: {
  mode: string;
  data: ModeData;
  icon: typeof Smartphone;
  accent: string;
}) {
  return (
    <div className="flex-1 rounded-lg border border-border p-4" data-testid={`panel-${mode.toLowerCase()}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-md ${accent} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold">{mode}</p>
          <p className="text-[10px] text-muted-foreground">{data.transactionCount} transactions</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Spend</span>
          <span className="text-sm font-semibold tabular-nums" data-testid={`text-${mode.toLowerCase()}-spend`}>
            {formatCurrency(data.spend)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Rewards</span>
          <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400" data-testid={`text-${mode.toLowerCase()}-rewards`}>
            {formatCurrency(data.rewards)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Cashback %</span>
          <span className="text-sm font-bold tabular-nums" data-testid={`text-${mode.toLowerCase()}-rate`}>
            {data.cashback.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border space-y-1">
        {data.transactions.slice(0, 3).map((tx) => (
          <div key={tx.id} className="flex items-center gap-2 text-xs text-muted-foreground">
            <Receipt className="w-3 h-3 shrink-0" />
            <span className="flex-1 truncate">{tx.merchant}</span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 no-default-hover-elevate no-default-active-elevate">
              {mode === "Digital Wallet" ? (
                <Smartphone className="w-2.5 h-2.5 mr-0.5" />
              ) : (
                <CreditCard className="w-2.5 h-2.5 mr-0.5" />
              )}
              {mode === "Digital Wallet" ? "Digital" : "Physical"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

interface DigitalVsPhysicalProps {
  cardName: string;
  accentColor?: string;
  filterActive?: boolean;
  onFilterToggle?: (active: boolean) => void;
}

export function DigitalVsPhysical({ cardName, accentColor = "blue", filterActive = false, onFilterToggle }: DigitalVsPhysicalProps) {
  const { data, isLoading } = useQuery<DigitalVsPhysicalData>({
    queryKey: ["/api/digital-vs-physical", cardName],
    queryFn: async () => {
      const res = await fetch(`/api/digital-vs-physical?card=${encodeURIComponent(cardName)}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const iconColor = accentColor === "amber" ? "text-amber-500" : "text-blue-500";
  const digitalGradient = accentColor === "amber"
    ? "bg-gradient-to-br from-amber-500 to-amber-600"
    : "bg-gradient-to-br from-blue-500 to-blue-600";
  const infoBg = accentColor === "amber" ? "bg-amber-500/5 border-amber-500/10" : "bg-blue-500/5 border-blue-500/10";

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <CardTitle className="text-lg">{cardName}: Digital vs Physical</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Skeleton className="flex-1 h-48" />
            <Skeleton className="flex-1 h-48" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card data-testid={`card-dvp-${cardName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Wallet className={`w-4 h-4 ${iconColor}`} />
          <CardTitle className="text-lg">{cardName}: Digital vs Physical</CardTitle>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {data.modeLeak > 0 && (
            <Badge variant="outline" className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] no-default-hover-elevate no-default-active-elevate">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Mode Leak: {formatCurrency(data.modeLeak)}
            </Badge>
          )}
          {onFilterToggle && (
            <div className="flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground hidden sm:inline">Filter</span>
              <Switch
                checked={filterActive}
                onCheckedChange={onFilterToggle}
                data-testid={`switch-filter-${cardName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <ModePanel
            mode="Digital Wallet"
            data={data.digital}
            icon={Smartphone}
            accent={digitalGradient}
          />
          <ModePanel
            mode="Physical Card"
            data={data.physical}
            icon={CreditCard}
            accent="bg-gradient-to-br from-slate-500 to-slate-600"
          />
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Total Rewards</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(data.total_rewards)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Digital Rewards</p>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {formatCurrency(data.digital_rewards)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center col-span-2 sm:col-span-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Missed (Mode)</p>
            <p className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              {formatCurrency(data.missed_rewards_due_to_mode)}
            </p>
          </div>
        </div>
        <div className={`mt-3 rounded-lg ${infoBg} border p-3`}>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">+1% digital bonus:</span>{" "}
            {cardName} earns an extra 1% on all categories when used via digital wallet (Apple Pay, Google Pay). Physical card earns base rate only.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
