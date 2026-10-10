import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { parseStatement, type ImportedTransaction } from "@/lib/statement-import";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  Trash2,
  UploadCloud,
  Wallet,
} from "lucide-react";

const CATEGORIES = ["Travel", "Dining", "Groceries", "Gas", "Delivery", "Streaming", "Shopping", "Entertainment", "General", "Other"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function fileLabel(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "My credit card";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function Onboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "review" | "done">("upload");
  const [fileName, setFileName] = useState("");
  const [cardName, setCardName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [transactions, setTransactions] = useState<ImportedTransaction[]>([]);
  const [categoryRates, setCategoryRates] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState(false);
  const [importResult, setImportResult] = useState<{ importedCount: number; duplicateCount: number }>();

  const readFile = async (file?: File) => {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["csv", "ofx", "qfx"].includes(extension)) {
      toast({ title: "Choose a CSV or OFX statement", description: "Supported formats are .csv, .ofx, and .qfx.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "Statement is too large", description: "Choose a statement under 10 MB.", variant: "destructive" });
      return;
    }

    try {
      const parsed = parseStatement(await file.text(), file.name);
      const categories = Array.from(new Set(parsed.map((transaction) => transaction.category)));
      setFileName(file.name);
      setCardName(fileLabel(file.name));
      setTransactions(parsed);
      setCategoryRates(Object.fromEntries(categories.map((category) => [category, "1"] as const)));
      setStep("review");
    } catch (error) {
      toast({
        title: "Couldn't read this statement",
        description: error instanceof Error ? error.message : "Check the file and try again.",
        variant: "destructive",
      });
    }
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      const rates = Object.fromEntries(Object.entries(categoryRates).map(([category, value]) => [category, Number(value)]));
      const response = await apiRequest("POST", "/api/statements/import", {
        card: { name: cardName.trim(), issuer: issuer.trim(), lastFour: lastFour.trim() },
        transactions: transactions.map(({ date, merchant, category, amount }) => ({ date, merchant, category, amount })),
        categoryRates: rates,
      });
      return response.json() as Promise<{ importedCount: number; duplicateCount: number }>;
    },
    onSuccess: (result) => {
      setImportResult(result);
      setStep("done");
      [
        "/api/cards",
        "/api/transactions",
        "/api/categories",
        "/api/dashboard/summary",
        "/api/statements",
      ].forEach((queryKey) => queryClient.invalidateQueries({ queryKey: [queryKey] }));
    },
    onError: (error: Error) => {
      toast({ title: "Statement import failed", description: error.message, variant: "destructive" });
    },
  });

  const updateTransaction = (id: string, field: "category", value: string) => {
    setTransactions((current) => current.map((transaction) =>
      transaction.id === id ? { ...transaction, [field]: value } : transaction,
    ));
    if (!categoryRates[value]) setCategoryRates((current) => ({ ...current, [value]: "1" }));
  };

  const removeTransaction = (id: string) => {
    setTransactions((current) => current.filter((transaction) => transaction.id !== id));
  };

  const usedCategories = Array.from(new Set(transactions.map((transaction) => transaction.category)));
  const rateValuesValid = usedCategories.every((category) => {
    const value = categoryRates[category] ?? "";
    const rate = Number(value);
    return value.trim() !== "" && Number.isFinite(rate) && rate >= 0 && rate <= 100;
  });
  const canImport = cardName.trim().length > 0 && transactions.length > 0 && rateValuesValid;
  const totalSpend = transactions.reduce((total, transaction) => total + transaction.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <button className="flex items-center gap-2" onClick={() => navigate("/")} aria-label="WalletWins home">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-emerald-500">
              <Wallet className="h-4 w-4 text-white" />
            </span>
            <span className="text-lg font-bold tracking-tight">WalletWins</span>
          </button>
          <ThemeToggle />
        </div>
      </header>

      <motion.main
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12"
      >
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">Real transactions. Clearer rewards.</p>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-onboard-heading">
            {step === "upload" ? "Upload a bank statement" : step === "review" ? "Review before importing" : "Statement imported"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {step === "upload"
              ? "Choose a CSV or OFX export from your card issuer. Your original file is read in this browser."
              : step === "review"
                ? "Check the parsed purchases and set the earn rate for each category before saving."
                : "Your imported purchases are now available in the dashboard."}
          </p>
        </div>

        <div className="mb-7 flex items-center gap-2" aria-label="Import progress">
          {["Upload", "Review", "Complete"].map((label, index) => {
            const current = step === "upload" ? 0 : step === "review" ? 1 : 2;
            const complete = index < current;
            return (
              <div className="flex flex-1 items-center gap-2" key={label}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index <= current ? "bg-gradient-to-br from-blue-500 to-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  {complete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </div>
                <span className={`hidden text-xs font-medium sm:inline ${index === current ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                {index < 2 && <div className={`h-0.5 flex-1 rounded-full ${complete ? "bg-emerald-500" : "bg-muted"}`} />}
              </div>
            );
          })}
        </div>

        {step === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><UploadCloud className="h-5 w-5 text-blue-500" /> Choose a statement file</CardTitle>
            </CardHeader>
            <CardContent>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => { event.preventDefault(); setDragging(false); void readFile(event.dataTransfer.files[0]); }}
                className={`flex min-h-56 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${dragging ? "border-blue-500 bg-blue-500/5" : "border-border hover:border-blue-500/50 hover:bg-muted/30"}`}
                data-testid="dropzone-statement"
              >
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FileText className="h-7 w-7" />
                </span>
                <span className="font-semibold">Drop your statement here</span>
                <span className="mt-1 text-sm text-muted-foreground">or browse files · CSV, OFX, QFX · up to 10 MB</span>
                <span className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Choose file</span>
              </button>
              <input
                ref={fileInput}
                type="file"
                accept=".csv,.ofx,.qfx,text/csv,application/x-ofx,application/vnd.intu.qfx"
                className="sr-only"
                onChange={(event) => { void readFile(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }}
                data-testid="input-statement-file"
              />
              <div className="mt-5 flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  The original file is parsed in your browser; only the transaction rows you approve are sent to this app. This app has no sign-in yet, so use statement data only on a deployment you control.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "review" && (
          <div className="space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5 text-blue-500" /> Statement details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cardName">Card name</Label>
                  <Input id="cardName" value={cardName} onChange={(event) => setCardName(event.target.value)} maxLength={100} placeholder="e.g. Sapphire Preferred" data-testid="input-card-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issuer">Bank / issuer (optional)</Label>
                  <Input id="issuer" value={issuer} onChange={(event) => setIssuer(event.target.value)} maxLength={100} placeholder="e.g. Chase" data-testid="input-card-issuer" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastFour">Last 4 digits (optional)</Label>
                  <Input id="lastFour" inputMode="numeric" maxLength={4} value={lastFour} onChange={(event) => setLastFour(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="1234" data-testid="input-last-four" />
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground sm:col-span-2">
                  {fileName} · {transactions.length} purchases · {formatCurrency(totalSpend)} total spend
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Reward rates by category</CardTitle>
                <p className="text-xs leading-relaxed text-muted-foreground">Rates start at 1%. Set your card's actual earn rate for each category; transaction files generally do not include rewards data.</p>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {Object.entries(categoryRates).map(([category, rate]) => (
                  <div className="flex items-center justify-between gap-3 rounded-lg border p-3" key={category}>
                    <Label htmlFor={`rate-${category}`} className="truncate">{category}</Label>
                    <div className="relative w-28 shrink-0">
                      <Input
                        id={`rate-${category}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={rate}
                        onChange={(event) => setCategoryRates((current) => ({ ...current, [category]: event.target.value }))}
                        className="pr-7 text-right"
                        aria-label={`${category} earn rate percent`}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-lg">Review purchases</CardTitle>
                  <span className="text-xs text-muted-foreground">{transactions.length} rows</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                  {transactions.map((transaction, index) => (
                    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border p-3" key={transaction.id}>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{transaction.merchant}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{new Date(`${transaction.date}T12:00:00`).toLocaleDateString()}</p>
                      </div>
                      <Select value={transaction.category} onValueChange={(value) => updateTransaction(transaction.id, "category", value)}>
                        <SelectTrigger className="w-32" aria-label={`Category for ${transaction.merchant}`}><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
                      </Select>
                      <div className="flex items-center gap-1">
                        <span className="min-w-16 text-right text-sm font-semibold tabular-nums">{formatCurrency(transaction.amount)}</span>
                        <Button size="icon" variant="ghost" onClick={() => removeTransaction(transaction.id)} aria-label={`Remove ${transaction.merchant}`} data-testid={`button-remove-transaction-${index}`}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("upload")}><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button className="flex-1" disabled={!canImport || importMutation.isPending} onClick={() => importMutation.mutate()} data-testid="button-submit-import">
                {importMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing statement...</> : <>Import {transactions.length} purchases <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </div>
          </div>
        )}

        {step === "done" && importResult && (
          <Card>
            <CardContent className="p-8 text-center sm:p-12">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold">Your statement is in</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Imported {importResult.importedCount} purchases for <span className="font-semibold text-foreground">{cardName}</span>{importResult.duplicateCount > 0 ? `; skipped ${importResult.duplicateCount} duplicate rows.` : "."}
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Button onClick={() => navigate("/dashboard")} data-testid="button-go-dashboard">View dashboard <ArrowRight className="h-4 w-4" /></Button>
                <Button variant="outline" onClick={() => { setStep("upload"); setTransactions([]); setCategoryRates({}); setFileName(""); setImportResult(undefined); }}>Import another statement</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.main>
    </div>
  );
}
