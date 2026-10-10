import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Wallet,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  CreditCard,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight" data-testid="text-landing-logo">
                WalletWins
              </span>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  AI
                </span>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                Turn spending habits into rewards
              </span>
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-tight"
              data-testid="text-hero-heading"
            >
              See where rewards were{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-500">
                earned
              </span>{" "}
              — and where they were{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-rose-500">
                missed
              </span>
            </h1>

            <p
              className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              data-testid="text-hero-subtitle"
            >
              WalletWins AI reads your credit card statements and shows where
              rewards were earned — and where they were missed.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => navigate("/onboard")}
                data-testid="button-analyze-cards"
              >
                Add My Card
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/dashboard")}
                data-testid="button-sample-data"
              >
                Use Sample Data
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Sparkles,
                  iconBg: "bg-emerald-500/10",
                  iconColor: "text-emerald-500",
                  title: "Rewards Earned",
                  desc: "Track cashback, points, and miles across all your cards in one place.",
                },
                {
                  icon: AlertTriangle,
                  iconBg: "bg-amber-500/10",
                  iconColor: "text-amber-500",
                  title: "Missed Opportunities",
                  desc: "See which card would have earned more for each purchase you made.",
                },
                {
                  icon: Zap,
                  iconBg: "bg-blue-500/10",
                  iconColor: "text-blue-500",
                  title: "Smart Insights",
                  desc: "AI-powered tips to maximize every dollar spent before rewards expire.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border bg-card p-6 text-center"
                  data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div
                    className={`w-11 h-11 rounded-lg ${feature.iconBg} flex items-center justify-center mx-auto mb-4`}
                  >
                    <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-base font-semibold mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 border-t">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3" data-testid="text-how-heading">
              How it works
            </h2>
            <p className="text-sm text-muted-foreground mb-10 max-w-lg mx-auto">
              Three steps to stop leaving money on the table.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
              {[
                {
                  step: "1",
                  icon: CreditCard,
                  title: "Connect your cards",
                  desc: "Add your credit cards to see reward rates for every spending category.",
                },
                {
                  step: "2",
                  icon: TrendingUp,
                  title: "Review transactions",
                  desc: "We analyze each purchase and flag where a better card existed.",
                },
                {
                  step: "3",
                  icon: Shield,
                  title: "Act on insights",
                  desc: "Follow personalized tips to earn more and redeem before expiry.",
                },
              ].map((item, i) => (
                <div key={item.step} className="flex flex-col items-center" data-testid={`card-step-${item.step}`}>
                  <div className="relative mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 border-t">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-md mx-auto rounded-xl border border-border bg-card p-8">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2">Ready to find your hidden rewards?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                No signup required. Explore with sample data instantly.
              </p>
              <Button
                size="lg"
                className="w-full"
                onClick={() => navigate("/dashboard")}
                data-testid="button-cta-bottom"
              >
                Launch Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                <Wallet className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs text-muted-foreground">WalletWins AI</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Hackathon demo — sample data only
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
