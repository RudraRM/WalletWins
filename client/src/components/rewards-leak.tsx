import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Smartphone } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import type { CreditCard as CreditCardType } from "@shared/schema";

type CardEfficiency = {
  card: CreditCardType;
  totalSpend: number;
  earned: number;
  potential: number;
  efficiency: number;
};

type CardBreakdown = {
  digitalRewards: number;
  physicalRewards: number;
  digitalSpend: number;
  physicalSpend: number;
};

type RewardsLeakData = {
  totalEarned: number;
  totalPotential: number;
  totalLeaked: number;
  modeLeak: number;
  cardEfficiency: CardEfficiency[];
  saveProMaxBreakdown: CardBreakdown | null;
  midnightSnacksBreakdown: CardBreakdown | null;
};

const cardColors: Record<string, string> = {
  blue: "hsl(210, 85%, 55%)",
  purple: "hsl(270, 65%, 55%)",
  emerald: "hsl(160, 65%, 45%)",
  amber: "hsl(40, 85%, 55%)",
  slate: "hsl(215, 15%, 50%)",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; fill?: string }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-2.5 shadow-lg text-xs">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill || "currentColor" }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function RewardsLeak() {
  const { data, isLoading } = useQuery<RewardsLeakData>({
    queryKey: ["/api/rewards-leak"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <CardTitle className="text-lg">Where Your Rewards Leaked</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const earnedVsPotentialData = [
    { name: "Earned", value: data.totalEarned },
    { name: "Potential", value: data.totalPotential },
  ];

  const efficiencyData = data.cardEfficiency
    .filter((ce) => ce.totalSpend > 0)
    .map((ce) => ({
      name: ce.card.name.replace("Card-", ""),
      earned: ce.earned,
      potential: ce.potential,
      color: cardColors[ce.card.color] || cardColors.blue,
      efficiency: ce.efficiency,
    }));

  const breakdownChartData: Array<{ name: string; digital: number; physical: number }> = [];
  if (data.saveProMaxBreakdown) {
    breakdownChartData.push({ name: "SaveProMax", digital: data.saveProMaxBreakdown.digitalRewards, physical: data.saveProMaxBreakdown.physicalRewards });
  }
  if (data.midnightSnacksBreakdown) {
    breakdownChartData.push({ name: "MidnightSnacks", digital: data.midnightSnacksBreakdown.digitalRewards, physical: data.midnightSnacksBreakdown.physicalRewards });
  }

  return (
    <Card data-testid="card-rewards-leak">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <CardTitle className="text-lg">Where Your Rewards Leaked</CardTitle>
        </div>
        {data.totalLeaked > 0 && (
          <Badge variant="outline" className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-xs no-default-hover-elevate no-default-active-elevate">
            {formatCurrency(data.totalLeaked)} leaked
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3" data-testid="label-earned-vs-potential">
            Earned vs Potential Rewards
          </p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earnedVsPotentialData} layout="vertical" barCategoryGap="30%">
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={65} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Amount">
                  <Cell fill="hsl(160, 65%, 45%)" />
                  <Cell fill="hsl(210, 85%, 55%)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3" data-testid="label-card-efficiency">
            Card-wise Reward Efficiency
          </p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={efficiencyData} barGap={2}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 10 }}
                  iconType="circle"
                  iconSize={6}
                />
                <Bar dataKey="earned" name="Earned" fill="hsl(160, 65%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="potential" name="Potential" fill="hsl(210, 85%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {breakdownChartData.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3" data-testid="label-dvp-breakdown">
              Digital vs Physical Rewards by Card
            </p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownChartData} barGap={4}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 10 }}
                    iconType="circle"
                    iconSize={6}
                  />
                  <Bar dataKey="digital" name="Digital" fill="hsl(210, 85%, 55%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="physical" name="Physical" fill="hsl(215, 15%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {data.modeLeak > 0 && (
          <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3 flex items-start gap-2">
            <Smartphone className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium" data-testid="text-mode-leak">
                Mode Leak: {formatCurrency(data.modeLeak)} missed
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This amount was lost by using physical cards instead of digital wallets, which earn a +1% bonus on every purchase.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
