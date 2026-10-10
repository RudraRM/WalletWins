import { db } from "./db";
import { creditCards, rewardCategories, transactions, rewards, insights } from "@shared/schema";
import { log } from "./index";

export async function seedDatabase() {
  const existingCards = await db.select().from(creditCards);
  const expectedNames = ["Card-SaveProMax", "Card-Swipe&Pray", "Card-MidnightSnacks"];
  const hasCorrectCards = existingCards.length === 3 && existingCards.every(c => expectedNames.includes(c.name));

  if (hasCorrectCards) {
    log("Database already seeded, skipping", "seed");
    return;
  }

  if (existingCards.length > 0) {
    log("Clearing stale seed data...", "seed");
    await db.delete(insights);
    await db.delete(rewards);
    await db.delete(transactions);
    await db.delete(rewardCategories);
    await db.delete(creditCards);
  }

  log("Seeding database with sample data...", "seed");

  const [saveProMax, swipeAndPray, midnightSnacks] = await db.insert(creditCards).values([
    {
      name: "Card-SaveProMax",
      issuer: "WalletWins Bank",
      lastFour: "4821",
      cardType: "Visa",
      color: "blue",
      totalRewards: 412.50,
      rewardUnit: "cashback",
      annualFee: 95,
    },
    {
      name: "Card-Swipe&Pray",
      issuer: "YoloPay",
      lastFour: "3047",
      cardType: "Mastercard",
      color: "purple",
      totalRewards: 87.30,
      rewardUnit: "cashback",
      annualFee: 0,
    },
    {
      name: "Card-MidnightSnacks",
      issuer: "NightOwl Finance",
      lastFour: "9284",
      cardType: "Visa",
      color: "amber",
      totalRewards: 156.90,
      rewardUnit: "cashback",
      annualFee: 0,
    },
  ]).returning();

  await db.insert(rewardCategories).values([
    { cardId: saveProMax.id, category: "Groceries", rewardRate: 4, maxMonthlySpend: 2000 },
    { cardId: saveProMax.id, category: "Dining", rewardRate: 3, maxMonthlySpend: null },
    { cardId: saveProMax.id, category: "Gas", rewardRate: 3, maxMonthlySpend: 500 },
    { cardId: saveProMax.id, category: "Travel", rewardRate: 5, maxMonthlySpend: 1500 },
    { cardId: swipeAndPray.id, category: "Dining", rewardRate: 2, maxMonthlySpend: null },
    { cardId: swipeAndPray.id, category: "Groceries", rewardRate: 1, maxMonthlySpend: null },
    { cardId: swipeAndPray.id, category: "Shopping", rewardRate: 1, maxMonthlySpend: null },
    { cardId: midnightSnacks.id, category: "Dining", rewardRate: 4, maxMonthlySpend: null },
    { cardId: midnightSnacks.id, category: "Delivery", rewardRate: 5, maxMonthlySpend: 1000 },
    { cardId: midnightSnacks.id, category: "Groceries", rewardRate: 2, maxMonthlySpend: null },
    { cardId: midnightSnacks.id, category: "Gas", rewardRate: 1, maxMonthlySpend: null },
  ]);

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

  await db.insert(transactions).values([
    {
      cardId: swipeAndPray.id,
      merchant: "Whole Foods Market",
      category: "Groceries",
      amount: 127.43,
      rewardsEarned: 1.27,
      optimalCardId: saveProMax.id,
      optimalRewards: 6.37,
      paymentMode: "physical",
      date: daysAgo(1),
    },
    {
      cardId: swipeAndPray.id,
      merchant: "The Cheesecake Factory",
      category: "Dining",
      amount: 89.50,
      rewardsEarned: 1.79,
      optimalCardId: midnightSnacks.id,
      optimalRewards: 4.48,
      paymentMode: "physical",
      date: daysAgo(2),
    },
    {
      cardId: saveProMax.id,
      merchant: "Trader Joe's",
      category: "Groceries",
      amount: 95.22,
      rewardsEarned: 4.76,
      optimalCardId: null,
      optimalRewards: null,
      paymentMode: "digital",
      date: daysAgo(3),
    },
    {
      cardId: saveProMax.id,
      merchant: "Delta Airlines",
      category: "Travel",
      amount: 342.00,
      rewardsEarned: 20.52,
      optimalCardId: null,
      optimalRewards: null,
      paymentMode: "digital",
      date: daysAgo(4),
    },
    {
      cardId: midnightSnacks.id,
      merchant: "DoorDash",
      category: "Delivery",
      amount: 38.75,
      rewardsEarned: 2.33,
      optimalCardId: null,
      optimalRewards: null,
      paymentMode: "digital",
      date: daysAgo(2),
    },
    {
      cardId: midnightSnacks.id,
      merchant: "Uber Eats",
      category: "Delivery",
      amount: 27.90,
      rewardsEarned: 1.67,
      optimalCardId: null,
      optimalRewards: null,
      paymentMode: "digital",
      date: daysAgo(4),
    },
    {
      cardId: midnightSnacks.id,
      merchant: "Taco Bell",
      category: "Dining",
      amount: 18.45,
      rewardsEarned: 0.92,
      optimalCardId: null,
      optimalRewards: null,
      paymentMode: "digital",
      date: daysAgo(5),
    },
    {
      cardId: midnightSnacks.id,
      merchant: "McDonald's",
      category: "Dining",
      amount: 14.25,
      rewardsEarned: 0.57,
      optimalCardId: null,
      optimalRewards: null,
      paymentMode: "physical",
      date: daysAgo(6),
    },
    {
      cardId: midnightSnacks.id,
      merchant: "GrubHub",
      category: "Delivery",
      amount: 42.30,
      rewardsEarned: 2.54,
      optimalCardId: null,
      optimalRewards: null,
      paymentMode: "digital",
      date: daysAgo(7),
    },
    {
      cardId: midnightSnacks.id,
      merchant: "7-Eleven",
      category: "Groceries",
      amount: 22.10,
      rewardsEarned: 0.44,
      optimalCardId: null,
      optimalRewards: null,
      paymentMode: "physical",
      date: daysAgo(8),
    },
    {
      cardId: midnightSnacks.id,
      merchant: "Wendy's",
      category: "Dining",
      amount: 16.80,
      rewardsEarned: 0.67,
      optimalCardId: null,
      optimalRewards: null,
      paymentMode: "physical",
      date: daysAgo(10),
    },
    {
      cardId: midnightSnacks.id,
      merchant: "Postmates",
      category: "Delivery",
      amount: 35.60,
      rewardsEarned: 2.14,
      optimalCardId: null,
      optimalRewards: null,
      paymentMode: "physical",
      date: daysAgo(12),
    },
    {
      cardId: saveProMax.id,
      merchant: "Sushi Nakazawa",
      category: "Dining",
      amount: 156.00,
      rewardsEarned: 4.68,
      optimalCardId: null,
      optimalRewards: null,
      paymentMode: "physical",
      date: daysAgo(6),
    },
    {
      cardId: saveProMax.id,
      merchant: "Costco",
      category: "Groceries",
      amount: 215.80,
      rewardsEarned: 10.79,
      optimalCardId: null,
      optimalRewards: null,
      paymentMode: "digital",
      date: daysAgo(7),
    },
    {
      cardId: swipeAndPray.id,
      merchant: "Target",
      category: "Shopping",
      amount: 214.87,
      rewardsEarned: 2.15,
      optimalCardId: null,
      optimalRewards: null,
      paymentMode: "physical",
      date: daysAgo(8),
    },
    {
      cardId: swipeAndPray.id,
      merchant: "Uber Eats",
      category: "Dining",
      amount: 34.50,
      rewardsEarned: 0.69,
      optimalCardId: midnightSnacks.id,
      optimalRewards: 2.07,
      paymentMode: "physical",
      date: daysAgo(10),
    },
    {
      cardId: saveProMax.id,
      merchant: "Marriott Hotel",
      category: "Travel",
      amount: 189.00,
      rewardsEarned: 9.45,
      optimalCardId: null,
      optimalRewards: null,
      paymentMode: "physical",
      date: daysAgo(12),
    },
    {
      cardId: saveProMax.id,
      merchant: "Safeway",
      category: "Groceries",
      amount: 68.91,
      rewardsEarned: 3.45,
      optimalCardId: null,
      optimalRewards: null,
      paymentMode: "digital",
      date: daysAgo(14),
    },
    {
      cardId: saveProMax.id,
      merchant: "Amazon Fresh",
      category: "Groceries",
      amount: 143.60,
      rewardsEarned: 7.18,
      optimalCardId: null,
      optimalRewards: null,
      paymentMode: "digital",
      date: daysAgo(15),
    },
    {
      cardId: saveProMax.id,
      merchant: "Olive Garden",
      category: "Dining",
      amount: 67.25,
      rewardsEarned: 2.02,
      optimalCardId: null,
      optimalRewards: null,
      paymentMode: "physical",
      date: daysAgo(16),
    },
    {
      cardId: saveProMax.id,
      merchant: "BP Gas",
      category: "Gas",
      amount: 45.20,
      rewardsEarned: 1.36,
      optimalCardId: null,
      optimalRewards: null,
      paymentMode: "physical",
      date: daysAgo(18),
    },
  ]);

  const futureDate = (d: number) => new Date(now.getTime() + d * 86400000);

  await db.insert(rewards).values([
    {
      cardId: saveProMax.id,
      type: "Travel Credit",
      amount: 50.00,
      expiryDate: futureDate(5),
      isExpiringSoon: true,
    },
    {
      cardId: saveProMax.id,
      type: "Digital Bonus",
      amount: 25.00,
      expiryDate: futureDate(12),
      isExpiringSoon: true,
    },
    {
      cardId: midnightSnacks.id,
      type: "Delivery Bonus",
      amount: 15.00,
      expiryDate: futureDate(8),
      isExpiringSoon: true,
    },
    {
      cardId: saveProMax.id,
      type: "Cashback Balance",
      amount: 337.50,
      expiryDate: null,
      isExpiringSoon: false,
    },
    {
      cardId: swipeAndPray.id,
      type: "Cashback Balance",
      amount: 87.30,
      expiryDate: null,
      isExpiringSoon: false,
    },
    {
      cardId: midnightSnacks.id,
      type: "Cashback Balance",
      amount: 141.90,
      expiryDate: null,
      isExpiringSoon: false,
    },
  ]);

  await db.insert(insights).values([
    {
      type: "leak",
      title: "You could've earned $38 more using Card-SaveProMax for groceries",
      description: "Card-Swipe&Pray only earns 1% on groceries. Card-SaveProMax earns 4% — plus an extra 1% when used with a digital wallet. That's $38.22 left on the table this month.",
      potentialValue: 38.22,
      icon: "alert",
      priority: 10,
    },
    {
      type: "leak",
      title: "$21 missed by using Card-Swipe&Pray for dining",
      description: "Card-Swipe&Pray earns just 2% on dining. Card-MidnightSnacks earns 4% base — and 5% digitally. You missed $21.07 in bonus rewards on restaurant spending.",
      potentialValue: 21.07,
      icon: "alert",
      priority: 9,
    },
    {
      type: "win",
      title: "Card-MidnightSnacks is killing it on delivery",
      description: "Your late-night delivery orders on Card-MidnightSnacks earned 5% base + 1% digital bonus. That's $8.68 in cashback from DoorDash, Uber Eats, and GrubHub alone.",
      potentialValue: 8.68,
      icon: "trending",
      priority: 8,
    },
    {
      type: "tip",
      title: "Switch Card-MidnightSnacks to digital for dining",
      description: "You used your physical Card-MidnightSnacks for $49.50 in dining. Using your digital wallet would've earned an extra $0.50 in cashback.",
      potentialValue: 0.50,
      icon: "opportunity",
      priority: 7,
    },
    {
      type: "win",
      title: "Card-SaveProMax digital spending is paying off",
      description: "Your digital wallet purchases on Card-SaveProMax earned an extra $8.43 in bonus cashback this month. Keep tapping — every digital transaction earns +1% more.",
      potentialValue: 8.43,
      icon: "trending",
      priority: 6,
    },
    {
      type: "tip",
      title: "Mode Leak: $14.68 missed by not going digital",
      description: "Physical card transactions on Card-SaveProMax and Card-MidnightSnacks this month missed the +1% digital bonus. Switch to Apple Pay or Google Pay to automatically earn more.",
      potentialValue: 14.68,
      icon: "lightbulb",
      priority: 5,
    },
  ]);

  log("Database seeded successfully!", "seed");
}
