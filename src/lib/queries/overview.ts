import { prisma } from "@/lib/prisma";
import { PLAN_PRICES } from "@/lib/constants";
import { startOfMonth, startOfDay, subDays } from "date-fns";
import type { SubscriptionTier } from "@prisma/client";

export async function getOverviewKpis() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const dayStart = startOfDay(now);

  const [
    totalMerchants,
    planDistribution,
    activeSubscriptions,
    reviewsThisMonth,
    requestsThisMonth,
    whatsappToday,
    activeTrials,
    failedRequestsToday,
  ] = await Promise.all([
    prisma.merchant.count(),
    prisma.merchant.groupBy({ by: ["plan"], _count: { _all: true } }),
    prisma.merchantSubscription.findMany({ where: { active: true } }),
    prisma.review.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.reviewRequest.count({
      where: { status: "SENT", sentAt: { gte: monthStart } },
    }),
    prisma.whatsAppUsageRecord.aggregate({
      where: { createdAt: { gte: dayStart } },
      _sum: { costPerMessage: true },
      _count: true,
    }),
    prisma.merchant.count({ where: { trialEndsAt: { gt: now } } }).catch(() => 0),
    prisma.reviewRequest.count({
      where: { status: "FAILED", sentAt: { gte: dayStart } },
    }),
  ]);

  const mrr = activeSubscriptions.reduce((sum, sub) => {
    return sum + (PLAN_PRICES[sub.tier as SubscriptionTier] ?? 0);
  }, 0);

  return {
    totalMerchants,
    mrr,
    reviewsThisMonth,
    requestsThisMonth,
    whatsappMessagesToday: whatsappToday._count,
    whatsappCostToday: Number(whatsappToday._sum.costPerMessage ?? 0),
    activeTrials,
    failedRequestsToday,
    planDistribution,
  };
}

export async function getReviewsTrend() {
  const thirtyDaysAgo = subDays(new Date(), 30);
  const reviews = await prisma.review.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const dailyCounts: Record<string, number> = {};
  for (const r of reviews) {
    const day = r.createdAt.toISOString().slice(0, 10);
    dailyCounts[day] = (dailyCounts[day] ?? 0) + 1;
  }

  // Fill in missing days with 0
  const result: { date: string; count: number }[] = [];
  for (let i = 30; i >= 0; i--) {
    const d = subDays(new Date(), i).toISOString().slice(0, 10);
    result.push({ date: d, count: dailyCounts[d] ?? 0 });
  }
  return result;
}

export async function getRecentActivity() {
  const [recentMerchants, recentReviews, recentSubs] = await Promise.all([
    prisma.merchant.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, shopDomain: true, createdAt: true },
    }),
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        customerName: true,
        rating: true,
        createdAt: true,
        merchant: { select: { shopDomain: true } },
      },
    }),
    prisma.merchantSubscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        tier: true,
        active: true,
        createdAt: true,
        merchant: { select: { shopDomain: true } },
      },
    }),
  ]);

  type ActivityItem = { id: string; type: string; description: string; createdAt: Date };

  const events: ActivityItem[] = [
    ...recentMerchants.map((m) => ({
      id: m.id,
      type: "merchant" as const,
      description: `New merchant: ${m.shopDomain}`,
      createdAt: m.createdAt,
    })),
    ...recentReviews.map((r) => ({
      id: r.id,
      type: "review" as const,
      description: `${r.customerName ?? "Anonymous"} left a ${r.rating}-star review on ${r.merchant.shopDomain}`,
      createdAt: r.createdAt,
    })),
    ...recentSubs.map((s) => ({
      id: s.id,
      type: "subscription" as const,
      description: `${s.merchant.shopDomain} ${s.active ? "subscribed to" : "cancelled"} ${s.tier}`,
      createdAt: s.createdAt,
    })),
  ];

  return events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 20);
}
