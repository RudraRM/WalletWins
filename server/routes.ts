import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";

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

  app.post("/api/statements/import", async (req, res) => {
    try {
      const { card, transactions: importedRows, categoryRates } = req.body ?? {};
      if (
        typeof card?.name !== "string" ||
        !card.name.trim() ||
        card.name.length > 100 ||
        !Array.isArray(importedRows) ||
        importedRows.length === 0 ||
        importedRows.length > 5000 ||
        !categoryRates ||
        typeof categoryRates !== "object"
      ) {
        res.status(400).json({ message: "A card name, category rates, and 1-5,000 statement purchases are required." });
        return;
      }

      const categories = Array.from(new Set(importedRows.map((row: any) => String(row?.category ?? "").trim())));
      if (
        categories.some((category) => !category || category.length > 50) ||
        categories.some((category) => {
          const rate = Number(categoryRates[category]);
          return !Number.isFinite(rate) || rate < 0 || rate > 100;
        })
      ) {
        res.status(400).json({ message: "Every transaction needs a category with a reward rate between 0 and 100%." });
        return;
      }

      const normalizedRows = importedRows.map((row: any) => {
        const amount = Number(row?.amount);
        const date = new Date(row?.date);
        if (
          typeof row?.merchant !== "string" ||
          !row.merchant.trim() ||
          row.merchant.length > 200 ||
          !Number.isFinite(amount) ||
          amount <= 0 ||
          amount > 1000000 ||
          Number.isNaN(date.getTime())
        ) {
          throw new Error("One or more imported transactions are invalid.");
        }
        return {
          merchant: row.merchant.trim(),
          category: String(row.category).trim(),
          amount: Math.round(amount * 100) / 100,
          date,
        };
      });

      const issuer = typeof card.issuer === "string" && card.issuer.trim()
        ? card.issuer.trim().slice(0, 100)
        : "Unknown issuer";
      const lastFour = typeof card.lastFour === "string" && /^\d{4}$/.test(card.lastFour)
        ? card.lastFour
        : "----";
      const cardsBeforeImport = await storage.getCards();
      let targetCard = cardsBeforeImport.find(
        (existing) =>
          existing.name.toLowerCase() === card.name.trim().toLowerCase() &&
          existing.issuer.toLowerCase() === issuer.toLowerCase() &&
          existing.lastFour === lastFour,
      );
      const isNewCard = !targetCard;

      if (!targetCard) {
        targetCard = await storage.insertCard({
          name: card.name.trim(),
          issuer,
          lastFour,
          cardType: "Credit Card",
          color: "blue",
          totalRewards: 0,
          rewardUnit: "cashback",
          annualFee: 0,
        });
      }

      const targetCardId = targetCard.id;
      const currentCategories = await storage.getCategories();
      const cardCategories = currentCategories.filter((category) => category.cardId === targetCardId);
      for (const category of categories) {
        const configured = cardCategories.find((entry) => entry.category === category);
        const rewardRate = Number(categoryRates[category]);
        if (configured) {
          await storage.updateCategoryRate(configured.id, rewardRate);
        } else {
          await storage.insertCategory({
            cardId: targetCardId,
            category,
            rewardRate,
            maxMonthlySpend: null,
          });
        }
      }

      const existingTransactions = await storage.getTransactions();
      const existingKeys = new Set(
        existingTransactions
          .filter((transaction) => transaction.cardId === targetCardId)
          .map((transaction) => [
            transaction.date.toISOString().slice(0, 10),
            transaction.merchant.toLowerCase(),
            transaction.amount.toFixed(2),
          ].join("|")),
      );
      const insertedTransactions = [];

      for (const transaction of normalizedRows) {
        const duplicateKey = [
          transaction.date.toISOString().slice(0, 10),
          transaction.merchant.toLowerCase(),
          transaction.amount.toFixed(2),
        ].join("|");
        if (existingKeys.has(duplicateKey)) continue;
        existingKeys.add(duplicateKey);

        const rewardRate = Number(categoryRates[transaction.category]);
        const rewardsEarned = Math.round(transaction.amount * rewardRate) / 100;

        insertedTransactions.push(await storage.insertTransaction({
          cardId: targetCardId,
          merchant: transaction.merchant,
          category: transaction.category,
          amount: transaction.amount,
          rewardsEarned,
          optimalCardId: null,
          optimalRewards: null,
          paymentMode: "physical",
          date: transaction.date,
        }));
      }

      const finalCards = await storage.getCards();
      const finalCategories = await storage.getCategories();
      const finalTransactions = await storage.getTransactions();
      const rewardsByCard: Record<string, number> = {};

      for (const transaction of finalTransactions) {
        const ownRate = finalCategories.find(
          (category) => category.cardId === transaction.cardId && category.category === transaction.category,
        )?.rewardRate ?? 0;
        const rewardsEarned = Math.round(transaction.amount * ownRate) / 100;
        let bestRate = ownRate;
        let optimalCardId: string | null = null;
        let optimalRewards: number | null = null;

        for (const otherCard of finalCards) {
          if (otherCard.id === transaction.cardId) continue;
          const otherRate = finalCategories.find(
            (category) => category.cardId === otherCard.id && category.category === transaction.category,
          )?.rewardRate;
          if (otherRate !== undefined && otherRate > bestRate) {
            bestRate = otherRate;
            optimalCardId = otherCard.id;
            optimalRewards = Math.round(transaction.amount * otherRate) / 100;
          }
        }

        rewardsByCard[transaction.cardId] = (rewardsByCard[transaction.cardId] ?? 0) + rewardsEarned;
        await storage.updateTransactionAnalysis(transaction.id, rewardsEarned, optimalCardId, optimalRewards);
      }

      let updatedCard = targetCard;
      for (const currentCard of finalCards) {
        const updated = await storage.updateCardRewards(currentCard.id, rewardsByCard[currentCard.id] ?? 0);
        if (currentCard.id === targetCardId) updatedCard = updated ?? targetCard;
      }

      res.status(201).json({
        card: updatedCard ?? targetCard,
        importedCount: insertedTransactions.length,
        duplicateCount: normalizedRows.length - insertedTransactions.length,
        transactions: insertedTransactions,
        isNewCard,
      });
    } catch (error) {
      console.error("Statement import error:", error);
      const databaseError = error as {
        message?: unknown;
        detail?: unknown;
        code?: unknown;
        constraint?: unknown;
      };
      const rawMessage = typeof databaseError.message === "string" ? databaseError.message.trim() : "";
      const detail = typeof databaseError.detail === "string" ? databaseError.detail.trim() : "";
      const code = typeof databaseError.code === "string" ? databaseError.code : "";
      if (code === "ECONNREFUSED" || rawMessage.includes("ECONNREFUSED")) {
        res.status(503).json({
          message: "Database unavailable. Provision PostgreSQL and set DATABASE_URL before importing statements.",
        });
        return;
      }
      const message = rawMessage || detail || (code ? `Database request failed (${code}).` : "Statement import failed before the records could be saved.");
      const status = /invalid|required|couldn't find|no purchases/i.test(message) ? 400 : 500;
      res.status(status).json({ message });
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
