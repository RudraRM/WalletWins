import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import type { CreditCard } from "@shared/schema";

interface RewardChartProps {
  cards: CreditCard[] | undefined;
  isLoading: boolean;
}

const chartColors = [
  "hsl(210, 85%, 55%)",
  "hsl(170, 65%, 45%)",
  "hsl(195, 75%, 50%)",
  "hsl(150, 55%, 45%)",
  "hsl(225, 70%, 55%)",
  "hsl(280, 60%, 55%)",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
}

function CustomTooltipContent({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-popover border border-popover-border rounded-md px-3 py-2 shadow-md">
      <p className="text-sm font-medium">{data.name}</p>
      <p className="text-xs text-emerald-600 dark:text-emerald-400">
        {formatCurrency(data.rewards)} estimated
      </p>
    </div>
  );
}

export function RewardChart({ cards, isLoading }: RewardChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Estimated rewards by card</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (!cards || cards.length === 0) return null;

  const data = cards.map((card) => ({
    name: card.name.length > 15 ? card.name.slice(0, 15) + "..." : card.name,
    rewards: card.totalRewards,
    fullName: card.name,
  }));

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Estimated rewards by card</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48" data-testid="chart-rewards-by-card">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(210, 6%, 55%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(210, 6%, 55%)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
                width={45}
              />
              <RechartsTooltip content={<CustomTooltipContent />} cursor={false} />
              <Bar dataKey="rewards" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {data.map((_, index) => (
                  <Cell key={index} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
