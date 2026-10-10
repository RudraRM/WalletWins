import {
  type CreditCard, type InsertCreditCard,
  type RewardCategory, type InsertRewardCategory,
  type Transaction, type InsertTransaction,
  type Reward, type InsertReward,
  type Insight, type InsertInsight,
  type DashboardSummary,
  creditCards, rewardCategories, transactions, rewards, insights,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getCards(): Promise<CreditCard[]>;
  getCard(id: string): Promise<CreditCard | undefined>;
  insertCard(card: InsertCreditCard): Promise<CreditCard>;

  getCategories(): Promise<RewardCategory[]>;
  getCategoriesByCard(cardId: string): Promise<RewardCategory[]>;
  insertCategory(category: InsertRewardCategory): Promise<RewardCategory>;

  getTransactions(): Promise<Transaction[]>;
  insertTransaction(tx: InsertTransaction): Promise<Transaction>;

  getRewards(): Promise<Reward[]>;
  getExpiringRewards(): Promise<Reward[]>;
  insertReward(reward: InsertReward): Promise<Reward>;

  getInsights(): Promise<Insight[]>;
  insertInsight(insight: InsertInsight): Promise<Insight>;

  updateCardRewards(cardId: string, totalRewards: number): Promise<CreditCard | undefined>;
  getDashboardSummary(): Promise<DashboardSummary>;
}

export class DatabaseStorage implements IStorage {
  async getCards(): Promise<CreditCard[]> {
    return db.select().from(creditCards);
  }

  async getCard(id: string): Promise<CreditCard | undefined> {
    const [card] = await db.select().from(creditCards).where(eq(creditCards.id, id));
    return card;
  }

  async insertCard(card: InsertCreditCard): Promise<CreditCard> {
    const [result] = await db.insert(creditCards).values(card).returning();
    return result;
  }

  async getCategories(): Promise<RewardCategory[]> {
    return db.select().from(rewardCategories);
  }

  async getCategoriesByCard(cardId: string): Promise<RewardCategory[]> {
    return db.select().from(rewardCategories).where(eq(rewardCategories.cardId, cardId));
  }

  async insertCategory(category: InsertRewardCategory): Promise<RewardCategory> {
    const [result] = await db.insert(rewardCategories).values(category).returning();
    return result;
  }

  async getTransactions(): Promise<Transaction[]> {
    return db.select().from(transactions);
  }

  async insertTransaction(tx: InsertTransaction): Promise<Transaction> {
    const [result] = await db.insert(transactions).values(tx).returning();
    return result;
  }

  async getRewards(): Promise<Reward[]> {
    return db.select().from(rewards);
  }

  async getExpiringRewards(): Promise<Reward[]> {
    return db.select().from(rewards).where(eq(rewards.isExpiringSoon, true));
  }

  async insertReward(reward: InsertReward): Promise<Reward> {
    const [result] = await db.insert(rewards).values(reward).returning();
    return result;
  }

  async getInsights(): Promise<Insight[]> {
    return db.select().from(insights);
  }

  async insertInsight(insight: InsertInsight): Promise<Insight> {
    const [result] = await db.insert(insights).values(insight).returning();
    return result;
  }

  async updateCardRewards(cardId: string, totalRewards: number): Promise<CreditCard | undefined> {
    const [updated] = await db.update(creditCards).set({ totalRewards }).where(eq(creditCards.id, cardId)).returning();
    return updated;
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const allCards = await this.getCards();
    const allTransactions = await this.getTransactions();
    const allRewards = await this.getRewards();

    const totalRewardsEarned = allCards.reduce((sum, c) => sum + c.totalRewards, 0);
    const monthlySpend = allTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalRewardsFromTx = allTransactions.reduce((sum, t) => sum + t.rewardsEarned, 0);
    const rewardRate = monthlySpend > 0 ? (totalRewardsFromTx / monthlySpend) * 100 : 0;

    const missedRewards = allTransactions.reduce((sum, tx) => {
      if (tx.optimalCardId && tx.optimalCardId !== tx.cardId && tx.optimalRewards) {
        return sum + (tx.optimalRewards - tx.rewardsEarned);
      }
      return sum;
    }, 0);

    const expiringRewards = allRewards.filter((r) => r.isExpiringSoon);
    const expiringRewardsValue = expiringRewards.reduce((sum, r) => sum + r.amount, 0);

    return {
      totalRewardsEarned,
      missedRewards,
      expiringRewardsCount: expiringRewards.length,
      expiringRewardsValue,
      totalCards: allCards.length,
      monthlySpend,
      rewardRate,
    };
  }
}

export const storage = new DatabaseStorage();
