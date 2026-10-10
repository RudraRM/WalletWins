import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Wallet,
  Sparkles,
  CreditCard,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Globe,
  Shield,
  Search,
  Loader2,
} from "lucide-react";

interface TransactionEntry {
  id: string;
  merchant: string;
  category: string;
  amount: string;
  paymentMode: string;
  date?: string;
}

const CATEGORIES = ["Travel", "Dining", "Groceries", "Gas", "Delivery", "Streaming", "Shopping", "Entertainment", "General"];

const CARD_TYPES = ["Visa", "Mastercard", "Amex", "Discover", "RuPay"];

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

const FETCH_STEPS = [
  { label: "Analyzing card type...", icon: Search },
  { label: "Building spending profile...", icon: Shield },
  { label: "Generating sample transactions...", icon: Globe },
  { label: "Preparing your demo...", icon: Sparkles },
];

export default function Onboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const [cardName, setCardName] = useState("");
  const [cardIssuer, setCardIssuer] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [cardType, setCardType] = useState("");

  const [fetchStepIndex, setFetchStepIndex] = useState(0);
  const [fetchComplete, setFetchComplete] = useState(false);

  const [txns, setTxns] = useState<TransactionEntry[]>([
    { id: generateId(), merchant: "", category: "", amount: "", paymentMode: "physical" },
  ]);

  const addTransaction = () => {
    setTxns([...txns, { id: generateId(), merchant: "", category: "", amount: "", paymentMode: "physical" }]);
  };

  const removeTransaction = (id: string) => {
    if (txns.length <= 1) return;
    setTxns(txns.filter((t) => t.id !== id));
  };

  const updateTransaction = (id: string, field: keyof TransactionEntry, value: string) => {
    setTxns(txns.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const isStep1Valid = cardName.trim() && lastFour.trim().length === 4 && cardType;
  const isStep3Valid = txns.some((t) => t.merchant.trim() && t.category && parseFloat(t.amount) > 0);

  const generateTxnsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/generate-transactions", {
        cardName: cardName.trim(),
        cardType,
        issuer: cardIssuer.trim(),
      });
      return res.json();
    },
    onSuccess: (data: { transactions: Array<{ merchant: string; category: string; amount: number; paymentMode: string; date?: string }> }) => {
      const mapped: TransactionEntry[] = data.transactions.map((t) => ({
        id: generateId(),
        merchant: t.merchant,
        category: t.category,
        amount: String(t.amount),
        paymentMode: t.paymentMode,
        date: t.date,
      }));
      setTxns(mapped);
      setFetchComplete(true);
    },
    onError: (err: Error) => {
      toast({
        title: "Couldn't fetch transactions",
        description: err.message,
        variant: "destructive",
      });
      setTxns([{ id: generateId(), merchant: "", category: "", amount: "", paymentMode: "physical" }]);
      setFetchComplete(true);
    },
  });

  useEffect(() => {
    if (step !== 2) return;

    setFetchStepIndex(0);
    setFetchComplete(false);

    generateTxnsMutation.mutate();

    const intervals: NodeJS.Timeout[] = [];
    FETCH_STEPS.forEach((_, i) => {
      if (i === 0) return;
      const timer = setTimeout(() => {
        setFetchStepIndex(i);
      }, i * 1200);
      intervals.push(timer);
    });

    const completeTimer = setTimeout(() => {
      setFetchStepIndex(FETCH_STEPS.length);
    }, FETCH_STEPS.length * 1200);
    intervals.push(completeTimer);

    return () => intervals.forEach(clearTimeout);
  }, [step]);

  const showFetchingUI = step === 2 && (!fetchComplete || fetchStepIndex < FETCH_STEPS.length);

  const onboardMutation = useMutation({
    mutationFn: async () => {
      const validTxns = txns
        .filter((t) => t.merchant.trim() && t.category && parseFloat(t.amount) > 0)
        .map((t) => ({
          merchant: t.merchant.trim(),
          category: t.category,
          amount: parseFloat(t.amount),
          paymentMode: t.paymentMode,
          date: t.date,
        }));

      const res = await apiRequest("POST", "/api/onboard", {
        card: {
          name: cardName.trim(),
          issuer: cardIssuer.trim() || "My Bank",
          lastFour: lastFour.trim(),
          cardType,
        },
        transactions: validTxns,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards-leak"] });
      queryClient.invalidateQueries({ queryKey: ["/api/redemption-suggestions"] });
      setStep(3);
    },
    onError: (err: Error) => {
      toast({
        title: "Something went wrong",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight" data-testid="text-onboard-logo">
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-onboard-heading">
            Add Your Card
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your card details and we'll generate sample transactions to demo the analysis.
          </p>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  step >= s
                    ? "bg-gradient-to-br from-blue-500 to-emerald-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
                data-testid={`step-indicator-${s}`}
              >
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < totalSteps && (
                <div className={`flex-1 h-0.5 rounded-full ${step > s ? "bg-emerald-500" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card data-testid="section-step-1">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                <CreditCard className="w-5 h-5 text-blue-500" />
                Card Details
              </CardTitle>
              <Badge variant="outline" className="text-[10px] no-default-hover-elevate no-default-active-elevate">
                Step 1
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardName">Card Name</Label>
                <Input
                  id="cardName"
                  placeholder="e.g. My Travel Card, Daily Spender"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  data-testid="input-card-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardIssuer">Bank / Issuer (optional)</Label>
                <Input
                  id="cardIssuer"
                  placeholder="e.g. Chase, HDFC, SBI"
                  value={cardIssuer}
                  onChange={(e) => setCardIssuer(e.target.value)}
                  data-testid="input-card-issuer"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastFour">Last 4 Digits</Label>
                  <Input
                    id="lastFour"
                    placeholder="1234"
                    maxLength={4}
                    value={lastFour}
                    onChange={(e) => setLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    data-testid="input-last-four"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Card Network</Label>
                  <Select value={cardType} onValueChange={setCardType}>
                    <SelectTrigger data-testid="select-card-type">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {CARD_TYPES.map((ct) => (
                        <SelectItem key={ct} value={ct} data-testid={`option-card-type-${ct.toLowerCase()}`}>
                          {ct}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  className="w-full"
                  disabled={!isStep1Valid}
                  onClick={() => setStep(2)}
                  data-testid="button-next-step"
                >
                  Next: Generate Sample Transactions
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && showFetchingUI && (
          <Card data-testid="section-step-2-fetching">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold mb-1" data-testid="text-fetching-heading">
                  Generating sample data...
                </h2>
                <p className="text-sm text-muted-foreground">
                  Creating realistic demo transactions for {cardName} (**** {lastFour})
                </p>
              </div>

              <div className="space-y-3 max-w-sm mx-auto">
                {FETCH_STEPS.map((fs, i) => {
                  const StepIcon = fs.icon;
                  const isActive = fetchStepIndex === i;
                  const isDone = fetchStepIndex > i;

                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-md transition-all duration-500 ${
                        isDone
                          ? "bg-emerald-500/10"
                          : isActive
                          ? "bg-blue-500/10"
                          : "opacity-40"
                      }`}
                      data-testid={`fetch-step-${i}`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isDone
                          ? "bg-emerald-500/20"
                          : isActive
                          ? "bg-blue-500/20"
                          : "bg-muted"
                      }`}>
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : isActive ? (
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                        ) : (
                          <StepIcon className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${
                        isDone
                          ? "text-emerald-600 dark:text-emerald-400"
                          : isActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-muted-foreground"
                      }`}>
                        {fs.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-center">
                <div className="w-48 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, (fetchStepIndex / FETCH_STEPS.length) * 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && !showFetchingUI && (
          <Card data-testid="section-step-2">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                Review Transactions
              </CardTitle>
              <Badge variant="outline" className="text-[10px] no-default-hover-elevate no-default-active-elevate">
                Step 2
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {txns.length} sample transactions
                  </span>
                </div>
                <p className="text-xs text-muted-foreground" data-testid="text-pair-subtitle">
                  for <span className="font-semibold text-foreground">{cardName}</span> (**** {lastFour})
                </p>
              </div>

              <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 mb-4">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  These are <span className="font-semibold">demo transactions</span> to show how the analysis works. Replace them with your real purchases for accurate results, or use them as-is to explore the app.
                </p>
              </div>

              <div className="space-y-3">
                {txns.map((tx, index) => (
                  <Card key={tx.id} data-testid={`card-transaction-entry-${index}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground">
                          Transaction {index + 1}
                          {tx.date && (
                            <span className="ml-2 text-muted-foreground/70">{tx.date}</span>
                          )}
                        </span>
                        {txns.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeTransaction(tx.id)}
                            data-testid={`button-remove-tx-${index}`}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Merchant</Label>
                          <Input
                            placeholder="e.g. Starbucks"
                            value={tx.merchant}
                            onChange={(e) => updateTransaction(tx.id, "merchant", e.target.value)}
                            data-testid={`input-merchant-${index}`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Amount ($)</Label>
                          <Input
                            type="number"
                            placeholder="25.00"
                            value={tx.amount}
                            onChange={(e) => updateTransaction(tx.id, "amount", e.target.value)}
                            data-testid={`input-amount-${index}`}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Category</Label>
                          <Select
                            value={tx.category}
                            onValueChange={(v) => updateTransaction(tx.id, "category", v)}
                          >
                            <SelectTrigger data-testid={`select-category-${index}`}>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat} data-testid={`option-category-${cat.toLowerCase()}-${index}`}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Payment Mode</Label>
                          <Select
                            value={tx.paymentMode}
                            onValueChange={(v) => updateTransaction(tx.id, "paymentMode", v)}
                          >
                            <SelectTrigger data-testid={`select-payment-mode-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="digital" data-testid={`option-digital-${index}`}>Digital Wallet</SelectItem>
                              <SelectItem value="physical" data-testid={`option-physical-${index}`}>Physical Card</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={addTransaction}
                data-testid="button-add-transaction"
              >
                <Plus className="w-4 h-4" />
                Add Another Transaction
              </Button>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setFetchComplete(false);
                    setFetchStepIndex(0);
                  }}
                  data-testid="button-back-step"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!isStep3Valid || onboardMutation.isPending}
                  onClick={() => onboardMutation.mutate()}
                  data-testid="button-submit-onboard"
                >
                  {onboardMutation.isPending ? "Analyzing..." : "Analyze My Card"}
                  {!onboardMutation.isPending && <Sparkles className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card data-testid="section-step-3">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2" data-testid="text-success-heading">
                Card Added Successfully!
              </h2>
              <p className="text-sm text-muted-foreground mb-2" data-testid="text-success-subtitle">
                <span className="font-semibold text-foreground">{cardName}</span> (**** {lastFour}) has been added with {txns.filter((t) => t.merchant.trim() && t.category && parseFloat(t.amount) > 0).length} transactions.
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                Your dashboard now includes rewards analysis and insights for this card.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => navigate("/dashboard")}
                  data-testid="button-go-dashboard"
                >
                  View Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setCardName("");
                    setCardIssuer("");
                    setLastFour("");
                    setCardType("");
                    setFetchComplete(false);
                    setFetchStepIndex(0);
                    setTxns([{ id: generateId(), merchant: "", category: "", amount: "", paymentMode: "physical" }]);
                  }}
                  data-testid="button-add-another"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Card
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
