import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CreditCard as CreditCardType, RewardCategory } from "@shared/schema";

interface CreditCardsSectionProps {
  cards: CreditCardType[] | undefined;
  categories: RewardCategory[] | undefined;
  isLoading: boolean;
}

const cardGradients: Record<string, string> = {
  blue: "from-blue-600 to-blue-800",
  green: "from-emerald-600 to-teal-800",
  emerald: "from-emerald-600 to-teal-800",
  purple: "from-purple-600 to-indigo-800",
  gold: "from-amber-500 to-orange-700",
  amber: "from-amber-500 to-orange-700",
  slate: "from-slate-600 to-slate-800",
  rose: "from-rose-500 to-pink-800",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function CreditCardVisual({ card, cardCategories }: { card: CreditCardType; cardCategories: RewardCategory[] }) {
  const gradient = cardGradients[card.color] || cardGradients.blue;

  return (
    <div className="group" data-testid={`card-credit-${card.id}`}>
      <div className={`relative bg-gradient-to-br ${gradient} rounded-xl p-5 text-white aspect-[1.6/1] flex flex-col justify-between overflow-visible transition-transform duration-200`}>
        <div className="absolute inset-0 rounded-xl bg-white/5" />
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-medium uppercase tracking-wider opacity-80">
              {card.issuer}
            </span>
            <span className="text-xs font-mono opacity-70">{card.cardType}</span>
          </div>
          <div className="text-sm font-semibold mt-1">{card.name}</div>
        </div>
        <div className="relative z-10">
          <div className="font-mono text-sm tracking-widest opacity-90 mb-2">
            **** **** **** {card.lastFour}
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-lg font-bold">
              {formatCurrency(card.totalRewards)}
            </span>
            <span className="text-xs opacity-70">rewards earned</span>
          </div>
        </div>
      </div>
      {cardCategories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {cardCategories.map((cat) => (
            <Badge key={cat.id} variant="outline" className="text-[10px]">
              {cat.category} {cat.rewardRate}%
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function CreditCardsSection({ cards, categories, isLoading }: CreditCardsSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <CardTitle className="text-lg">Your Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="aspect-[1.6/1] rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!cards || cards.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <CardTitle className="text-lg">Your Cards</CardTitle>
        <Badge variant="secondary" className="text-xs">
          {cards.length} card{cards.length !== 1 ? "s" : ""}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((card) => (
            <CreditCardVisual
              key={card.id}
              card={card}
              cardCategories={categories?.filter((c) => c.cardId === card.id) || []}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
