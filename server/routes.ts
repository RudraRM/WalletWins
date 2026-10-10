import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCreditCardSchema, insertTransactionSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/dashboard/summary", async (_req, res) => {
    try {
      const summary = await storage.getDashboardSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard summary" });
    }
  });

  app.get("/api/cards", async (_req, res) => {
    try {
      const cards = await storage.getCards();
      res.json(cards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  app.get("/api/categories", async (_req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/transactions", async (_req, res) => {
    try {
      const txns = await storage.getTransactions();
      res.json(txns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get("/api/rewards", async (_req, res) => {
    try {
      const rws = await storage.getRewards();
      res.json(rws);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  app.get("/api/insights", async (_req, res) => {
    try {
      const ins = await storage.getInsights();
      res.json(ins);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch insights" });
    }
  });

  app.get("/api/digital-vs-physical", async (req, res) => {
    try {
      const cardName = (req.query.card as string) || "Card-SaveProMax";
      const allCards = await storage.getCards();
      const targetCard = allCards.find((c) => c.name === cardName);
      if (!targetCard) {
        res.json(null);
        return;
      }

      const allCategories = await storage.getCategories();
      const cardCategories = allCategories.filter((c) => c.cardId === targetCard.id);
      const allTransactions = await storage.getTransactions();
      const cardTxns = allTransactions.filter((t) => t.cardId === targetCard.id);

      const digitalTxns = cardTxns.filter((t) => t.paymentMode === "digital");
      const physicalTxns = cardTxns.filter((t) => t.paymentMode === "physical");

      const getBaseRate = (category: string): number => {
        const cat = cardCategories.find(
          (c) => c.category.toLowerCase() === category.toLowerCase()
        );
        return cat ? cat.rewardRate : 1;
      };

      const computeRewards = (txns: typeof cardTxns, isDigital: boolean) => {
        let spend = 0;
        let rewards = 0;
        for (const tx of txns) {
          spend += tx.amount;
          const baseRate = getBaseRate(tx.category);
          const effectiveRate = isDigital ? baseRate + 1 : baseRate;
          rewards += tx.amount * (effectiveRate / 100);
        }
        return { spend, rewards };
      };

      const digital = computeRewards(digitalTxns, true);
      const physical = computeRewards(physicalTxns, false);

      const digitalCashback = digital.spend > 0 ? (digital.rewards / digital.spend) * 100 : 0;
      const physicalCashback = physical.spend > 0 ? (physical.rewards / physical.spend) * 100 : 0;

      const missedRewardsDueToMode = physicalTxns.reduce((s, t) => s + t.amount * 0.01, 0);

      const totalRewards = digital.rewards + physical.rewards;

      res.json({
        card: targetCard,
        digital_spend: digital.spend,
        physical_spend: physical.spend,
        digital_rewards: digital.rewards,
        physical_rewards: physical.rewards,
        total_rewards: totalRewards,
        missed_rewards_due_to_mode: missedRewardsDueToMode,
        digital: {
          spend: digital.spend,
          rewards: digital.rewards,
          cashback: digitalCashback,
          transactionCount: digitalTxns.length,
          transactions: digitalTxns,
        },
        physical: {
          spend: physical.spend,
          rewards: physical.rewards,
          cashback: physicalCashback,
          transactionCount: physicalTxns.length,
          transactions: physicalTxns,
        },
        modeLeak: missedRewardsDueToMode,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch digital vs physical data" });
    }
  });

  app.get("/api/rewards-leak", async (_req, res) => {
    try {
      const allCards = await storage.getCards();
      const allTransactions = await storage.getTransactions();

      const cardEfficiency = allCards.map((card) => {
        const cardTxns = allTransactions.filter((t) => t.cardId === card.id);
        const totalSpend = cardTxns.reduce((s, t) => s + t.amount, 0);
        const earned = cardTxns.reduce((s, t) => s + t.rewardsEarned, 0);
        const potential = cardTxns.reduce((s, t) => {
          if (t.optimalRewards && t.optimalCardId !== t.cardId) return s + t.optimalRewards;
          return s + t.rewardsEarned;
        }, 0);
        return {
          card,
          totalSpend,
          earned,
          potential,
          efficiency: potential > 0 ? (earned / potential) * 100 : 100,
        };
      });

      const totalEarned = allTransactions.reduce((s, t) => s + t.rewardsEarned, 0);
      const totalPotential = allTransactions.reduce((s, t) => {
        if (t.optimalRewards && t.optimalCardId !== t.cardId) return s + t.optimalRewards;
        return s + t.rewardsEarned;
      }, 0);

      const allCategories = await storage.getCategories();
      const digitalBonusCards = ["Card-SaveProMax", "Card-MidnightSnacks"];
      let totalModeLeak = 0;
      const cardBreakdowns: Record<string, { digitalRewards: number; physicalRewards: number; digitalSpend: number; physicalSpend: number }> = {};

      for (const cardName of digitalBonusCards) {
        const card = allCards.find((c) => c.name === cardName);
        if (!card) continue;

        const cardCats = allCategories.filter((c) => c.cardId === card.id);
        const rateMap: Record<string, number> = {};
        cardCats.forEach((c) => { rateMap[c.category] = c.rewardRate; });

        const cardTxns = allTransactions.filter((t) => t.cardId === card.id);
        const dTxns = cardTxns.filter((t) => t.paymentMode === "digital");
        const pTxns = cardTxns.filter((t) => t.paymentMode === "physical");

        const compute = (txns: typeof cardTxns, isDigital: boolean) =>
          txns.reduce((sum, t) => {
            const base = rateMap[t.category] || 1;
            return sum + (t.amount * (isDigital ? base + 1 : base)) / 100;
          }, 0);

        const dRewards = compute(dTxns, true);
        const pRewards = compute(pTxns, false);
        const cardModeLeak = pTxns.reduce((s, t) => s + t.amount * 0.01, 0);
        totalModeLeak += cardModeLeak;

        cardBreakdowns[cardName] = {
          digitalRewards: Math.round(dRewards * 100) / 100,
          physicalRewards: Math.round(pRewards * 100) / 100,
          digitalSpend: dTxns.reduce((s, t) => s + t.amount, 0),
          physicalSpend: pTxns.reduce((s, t) => s + t.amount, 0),
        };
      }

      res.json({
        totalEarned,
        totalPotential,
        totalLeaked: totalPotential - totalEarned,
        modeLeak: Math.round(totalModeLeak * 100) / 100,
        cardEfficiency,
        saveProMaxBreakdown: cardBreakdowns["Card-SaveProMax"] || null,
        midnightSnacksBreakdown: cardBreakdowns["Card-MidnightSnacks"] || null,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rewards leak data" });
    }
  });

  app.post("/api/generate-transactions", async (_req, res) => {
    try {
      const { cardName, cardType, issuer } = _req.body;

      const merchantProfiles: Record<string, Array<{ merchant: string; category: string; amountRange: [number, number]; digitalChance: number }>> = {
        travel: [
          { merchant: "Delta Airlines", category: "Travel", amountRange: [120, 650], digitalChance: 0.9 },
          { merchant: "Marriott Hotels", category: "Travel", amountRange: [180, 420], digitalChance: 0.8 },
          { merchant: "Uber Rides", category: "Travel", amountRange: [8, 45], digitalChance: 0.95 },
          { merchant: "Shell Gas Station", category: "Gas", amountRange: [30, 75], digitalChance: 0.3 },
          { merchant: "BP Fuel Stop", category: "Gas", amountRange: [25, 60], digitalChance: 0.25 },
        ],
        dining: [
          { merchant: "Chipotle", category: "Dining", amountRange: [12, 28], digitalChance: 0.7 },
          { merchant: "Olive Garden", category: "Dining", amountRange: [25, 65], digitalChance: 0.4 },
          { merchant: "Starbucks", category: "Dining", amountRange: [4, 12], digitalChance: 0.85 },
          { merchant: "McDonald's", category: "Dining", amountRange: [6, 18], digitalChance: 0.6 },
          { merchant: "Pizza Hut", category: "Dining", amountRange: [15, 40], digitalChance: 0.5 },
        ],
        groceries: [
          { merchant: "Whole Foods", category: "Groceries", amountRange: [35, 180], digitalChance: 0.6 },
          { merchant: "Trader Joe's", category: "Groceries", amountRange: [25, 120], digitalChance: 0.4 },
          { merchant: "Costco", category: "Groceries", amountRange: [80, 300], digitalChance: 0.3 },
          { merchant: "Walmart Grocery", category: "Groceries", amountRange: [40, 150], digitalChance: 0.5 },
        ],
        delivery: [
          { merchant: "DoorDash", category: "Delivery", amountRange: [15, 55], digitalChance: 0.95 },
          { merchant: "Uber Eats", category: "Delivery", amountRange: [12, 45], digitalChance: 0.95 },
          { merchant: "Instacart", category: "Delivery", amountRange: [30, 120], digitalChance: 0.9 },
          { merchant: "Grubhub", category: "Delivery", amountRange: [14, 40], digitalChance: 0.9 },
        ],
        streaming: [
          { merchant: "Netflix", category: "Streaming", amountRange: [15, 23], digitalChance: 1.0 },
          { merchant: "Spotify Premium", category: "Streaming", amountRange: [10, 16], digitalChance: 1.0 },
          { merchant: "YouTube Premium", category: "Streaming", amountRange: [12, 14], digitalChance: 1.0 },
        ],
        shopping: [
          { merchant: "Amazon.com", category: "Shopping", amountRange: [15, 200], digitalChance: 0.95 },
          { merchant: "Target", category: "Shopping", amountRange: [20, 120], digitalChance: 0.5 },
          { merchant: "Best Buy", category: "Shopping", amountRange: [30, 500], digitalChance: 0.6 },
          { merchant: "Nike.com", category: "Shopping", amountRange: [50, 180], digitalChance: 0.9 },
        ],
        entertainment: [
          { merchant: "AMC Theatres", category: "Entertainment", amountRange: [12, 35], digitalChance: 0.7 },
          { merchant: "Spotify Premium", category: "Entertainment", amountRange: [10, 16], digitalChance: 1.0 },
          { merchant: "Steam Games", category: "Entertainment", amountRange: [10, 60], digitalChance: 1.0 },
        ],
        general: [
          { merchant: "CVS Pharmacy", category: "General", amountRange: [8, 45], digitalChance: 0.4 },
          { merchant: "Home Depot", category: "General", amountRange: [20, 200], digitalChance: 0.3 },
          { merchant: "USPS Shipping", category: "General", amountRange: [5, 25], digitalChance: 0.5 },
        ],
      };

      const nameLower = (cardName || "").toLowerCase();
      const issuerLower = (issuer || "").toLowerCase();
      const combined = `${nameLower} ${issuerLower}`;

      let selectedPools: string[] = [];
      if (combined.includes("travel") || combined.includes("airline") || combined.includes("miles")) {
        selectedPools = ["travel", "dining", "gas", "general"];
      } else if (combined.includes("dining") || combined.includes("food") || combined.includes("snack") || combined.includes("eat")) {
        selectedPools = ["dining", "delivery", "groceries", "streaming"];
      } else if (combined.includes("grocer") || combined.includes("everyday") || combined.includes("daily")) {
        selectedPools = ["groceries", "dining", "gas", "shopping"];
      } else if (combined.includes("shopping") || combined.includes("shop") || combined.includes("cash")) {
        selectedPools = ["shopping", "dining", "streaming", "general"];
      } else {
        selectedPools = ["dining", "shopping", "groceries", "entertainment", "general", "delivery"];
      }

      const pool = selectedPools.flatMap((p) => merchantProfiles[p] || []);

      const txnCount = 8 + Math.floor(Math.random() * 8);
      const now = new Date();
      const generated = [];

      for (let i = 0; i < txnCount; i++) {
        const entry = pool[Math.floor(Math.random() * pool.length)];
        const amount = Math.round(
          (entry.amountRange[0] + Math.random() * (entry.amountRange[1] - entry.amountRange[0])) * 100
        ) / 100;
        const isDigital = Math.random() < entry.digitalChance;
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date(now.getTime() - daysAgo * 86400000);

        generated.push({
          merchant: entry.merchant,
          category: entry.category,
          amount,
          paymentMode: isDigital ? "digital" : "physical",
          date: date.toISOString().split("T")[0],
        });
      }

      generated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      res.json({ transactions: generated });
    } catch (error) {
      console.error("Generate transactions error:", error);
      res.status(500).json({ message: "Failed to generate transactions" });
    }
  });

  app.post("/api/onboard", async (req, res) => {
    try {
      const { card, transactions: txns } = req.body;

      if (!card || !card.name || !card.lastFour || !card.cardType) {
        res.status(400).json({ message: "Card name, last 4 digits, and card type are required" });
        return;
      }
      if (!txns || !Array.isArray(txns) || txns.length === 0) {
        res.status(400).json({ message: "At least one transaction is required" });
        return;
      }

      const categoryRates: Record<string, number> = {
        Travel: 3, Dining: 4, Groceries: 3, Gas: 2, Delivery: 5,
        Streaming: 3, Shopping: 2, Entertainment: 2, General: 1,
      };

      const colors = ["blue", "purple", "amber", "emerald", "rose", "slate"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const newCard = await storage.insertCard({
        name: card.name,
        issuer: card.issuer || "My Bank",
        lastFour: card.lastFour,
        cardType: card.cardType,
        color: card.color || randomColor,
        totalRewards: 0,
        rewardUnit: "cashback",
        annualFee: card.annualFee || 0,
      });

      const seenCategories = new Set<string>();
      let totalRewards = 0;

      const allCards = await storage.getCards();
      const allCategories = await storage.getCategories();

      const insertedTxns = [];
      for (const tx of txns) {
        if (!tx.merchant || !tx.amount || !tx.category) continue;

        const rate = categoryRates[tx.category] || 1;
        const isDigital = tx.paymentMode === "digital";
        const effectiveRate = isDigital ? rate + 1 : rate;
        const earned = tx.amount * (effectiveRate / 100);
        totalRewards += earned;

        let bestCardId = newCard.id;
        let bestRewards = earned;
        for (const otherCard of allCards) {
          if (otherCard.id === newCard.id) continue;
          const otherCats = allCategories.filter((c) => c.cardId === otherCard.id);
          const otherCat = otherCats.find((c) => c.category === tx.category);
          const otherRate = otherCat ? otherCat.rewardRate : 1;
          const otherEarned = tx.amount * (otherRate / 100);
          if (otherEarned > bestRewards) {
            bestRewards = otherEarned;
            bestCardId = otherCard.id;
          }
        }

        const inserted = await storage.insertTransaction({
          cardId: newCard.id,
          merchant: tx.merchant,
          category: tx.category,
          amount: tx.amount,
          rewardsEarned: earned,
          optimalCardId: bestCardId !== newCard.id ? bestCardId : null,
          optimalRewards: bestCardId !== newCard.id ? bestRewards : null,
          paymentMode: tx.paymentMode || "physical",
          date: tx.date ? new Date(tx.date) : new Date(),
        });
        insertedTxns.push(inserted);

        seenCategories.add(tx.category);
      }

      for (const cat of Array.from(seenCategories)) {
        const rate = categoryRates[cat] || 1;
        await storage.insertCategory({
          cardId: newCard.id,
          category: cat,
          rewardRate: rate,
          maxMonthlySpend: null,
        });
      }

      const updatedCard = await storage.updateCardRewards(newCard.id, totalRewards);

      res.json({
        card: updatedCard || newCard,
        transactions: insertedTxns,
        totalRewards,
        message: "Card and transactions added successfully!",
      });
    } catch (error) {
      console.error("Onboard error:", error);
      res.status(500).json({ message: "Failed to add card and transactions" });
    }
  });

  app.get("/api/redemption-suggestions", async (_req, res) => {
    try {
      const summary = await storage.getDashboardSummary();
      const totalPoints = Math.round(summary.totalRewardsEarned * 100);
      const pointValue = summary.totalRewardsEarned;

      const suggestions = [
        {
          id: "airline-upgrade",
          icon: "Plane",
          category: "Travel",
          title: "Airline seat class upgrade",
          merchant: "Separated Airlines",
          pointsCost: 500,
          dollarValue: 20.00,
          description: "Upgrade from cramped to slightly-less-cramped seating",
          tag: "Best Value",
        },
        {
          id: "tax-filing",
          icon: "Receipt",
          category: "Finance",
          title: "Tax filing assistance",
          merchant: "Ouch That Hurts Tax Co.",
          pointsCost: 400,
          dollarValue: 16.00,
          description: "Let someone else do the math you've been avoiding",
          tag: "Smart Move",
        },
        {
          id: "dining",
          icon: "UtensilsCrossed",
          category: "Dining",
          title: "Lunch or dinner",
          merchant: "Pretty Flower Cafe",
          pointsCost: 300,
          dollarValue: 12.00,
          description: "Treat yourself to a meal that's actually free",
          tag: "Popular",
        },
        {
          id: "movie",
          icon: "Clapperboard",
          category: "Entertainment",
          title: "Movie ticket",
          merchant: "Cinema Dekho",
          pointsCost: 250,
          dollarValue: 10.00,
          description: "Two hours of not checking your reward balance",
          tag: "Fun Pick",
        },
        {
          id: "rent-payment",
          icon: "Home",
          category: "Housing",
          title: "50% rent payment",
          merchant: "Sleep-On-A-Bench Apartments",
          pointsCost: 1250,
          dollarValue: 50.00,
          description: "Half your rent, paid by past-you's smart spending",
          tag: "Big Saver",
        },
      ];

      const affordable = suggestions.filter((s) => s.pointsCost <= totalPoints);
      const aspirational = suggestions.filter((s) => s.pointsCost > totalPoints);

      res.json({
        availablePoints: totalPoints,
        pointValue,
        suggestions: affordable,
        aspirational,
        allSuggestions: suggestions,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch redemption suggestions" });
    }
  });

  app.get("/api/statements", async (_req, res) => {
    try {
      const allCards = await storage.getCards();
      const allCategories = await storage.getCategories();
      const allTransactions = await storage.getTransactions();

      const statements = allCards.map((card) => {
        const cardTxns = allTransactions.filter((t) => t.cardId === card.id);
        const totalSpend = cardTxns.reduce((s, t) => s + t.amount, 0);
        const rewardsEarned = cardTxns.reduce((s, t) => s + t.rewardsEarned, 0);
        const effectiveCashback = totalSpend > 0 ? (rewardsEarned / totalSpend) * 100 : 0;
        const cardCategories = allCategories.filter((c) => c.cardId === card.id);

        const categoryBreakdown = cardCategories.map((cat) => {
          const catTxns = cardTxns.filter((t) => t.category === cat.category);
          const catSpend = catTxns.reduce((s, t) => s + t.amount, 0);
          const catRewards = catTxns.reduce((s, t) => s + t.rewardsEarned, 0);
          return {
            category: cat.category,
            rewardRate: cat.rewardRate,
            spend: catSpend,
            rewards: catRewards,
            transactions: catTxns,
          };
        });

        const uncategorizedTxns = cardTxns.filter(
          (t) => !cardCategories.some((c) => c.category === t.category)
        );
        if (uncategorizedTxns.length > 0) {
          const uncatSpend = uncategorizedTxns.reduce((s, t) => s + t.amount, 0);
          const uncatRewards = uncategorizedTxns.reduce((s, t) => s + t.rewardsEarned, 0);
          categoryBreakdown.push({
            category: "Other",
            rewardRate: 1,
            spend: uncatSpend,
            rewards: uncatRewards,
            transactions: uncategorizedTxns,
          });
        }

        return {
          card,
          totalSpend,
          rewardsEarned,
          effectiveCashback,
          transactionCount: cardTxns.length,
          categoryBreakdown: categoryBreakdown.filter((c) => c.transactions.length > 0),
        };
      });

      res.json(statements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statements" });
    }
  });

  return httpServer;
}
