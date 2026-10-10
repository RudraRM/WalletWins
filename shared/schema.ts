import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const creditCards = pgTable("credit_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  issuer: text("issuer").notNull(),
  lastFour: text("last_four").notNull(),
  cardType: text("card_type").notNull(),
  color: text("color").notNull(),
  totalRewards: real("total_rewards").notNull().default(0),
  rewardUnit: text("reward_unit").notNull().default("cashback"),
  annualFee: real("annual_fee").notNull().default(0),
});

export const rewardCategories = pgTable("reward_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cardId: varchar("card_id").notNull().references(() => creditCards.id),
  category: text("category").notNull(),
  rewardRate: real("reward_rate").notNull(),
  maxMonthlySpend: real("max_monthly_spend"),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cardId: varchar("card_id").notNull().references(() => creditCards.id),
  merchant: text("merchant").notNull(),
  category: text("category").notNull(),
  amount: real("amount").notNull(),
  rewardsEarned: real("rewards_earned").notNull(),
  optimalCardId: varchar("optimal_card_id").references(() => creditCards.id),
  optimalRewards: real("optimal_rewards"),
  paymentMode: text("payment_mode").notNull().default("physical"),
  date: timestamp("date").notNull().defaultNow(),
});

export const rewards = pgTable("rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cardId: varchar("card_id").notNull().references(() => creditCards.id),
  type: text("type").notNull(),
  amount: real("amount").notNull(),
  expiryDate: timestamp("expiry_date"),
  isExpiringSoon: boolean("is_expiring_soon").notNull().default(false),
});

export const insights = pgTable("insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  potentialValue: real("potential_value"),
  icon: text("icon").notNull().default("lightbulb"),
  priority: integer("priority").notNull().default(0),
});

export const insertCreditCardSchema = createInsertSchema(creditCards).omit({ id: true });
export const insertRewardCategorySchema = createInsertSchema(rewardCategories).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true });
export const insertRewardSchema = createInsertSchema(rewards).omit({ id: true });
export const insertInsightSchema = createInsertSchema(insights).omit({ id: true });

export type CreditCard = typeof creditCards.$inferSelect;
export type InsertCreditCard = z.infer<typeof insertCreditCardSchema>;
export type RewardCategory = typeof rewardCategories.$inferSelect;
export type InsertRewardCategory = z.infer<typeof insertRewardCategorySchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Insight = typeof insights.$inferSelect;
export type InsertInsight = z.infer<typeof insertInsightSchema>;

export type DashboardSummary = {
  totalRewardsEarned: number;
  missedRewards: number;
  expiringRewardsCount: number;
  expiringRewardsValue: number;
  totalCards: number;
  monthlySpend: number;
  rewardRate: number;
};
