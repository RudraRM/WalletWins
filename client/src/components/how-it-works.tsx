import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Layers, Target, Calculator } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "Imports purchases",
    desc: "Read a CSV or OFX export from your card issuer.",
    color: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    icon: Layers,
    title: "Identifies categories",
    desc: "Use statement categories where available and review each purchase.",
    color: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  {
    icon: Target,
    title: "Matches reward strengths",
    desc: "Compare the category rates you entered across your cards.",
    color: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  {
    icon: Calculator,
    title: "Calculates missed rewards",
    desc: "Estimate the difference between your card and a higher-earning option.",
    color: "bg-rose-500/10",
    iconColor: "text-rose-500",
  },
];

export function HowItWorks() {
  return (
    <Card data-testid="card-how-it-works">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">How WalletWins works</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <div key={step.title} className="flex items-start gap-3" data-testid={`card-how-step-${i + 1}`}>
              <div className={`w-9 h-9 rounded-lg ${step.color} flex items-center justify-center shrink-0`}>
                <step.icon className={`w-4 h-4 ${step.iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-0.5">{step.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
