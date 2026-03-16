import { prisma } from "@/lib/prisma";
import { PLAN_PRICES } from "@/lib/constants";
import { startOfMonth } from "date-fns";
import type { SubscriptionTier } from "@prisma/client";

export async function getPaymentsKpis() {
  const monthStart = startOfMonth(new Date());

  const [activeSubs, whatsappRevenue, pendingBilling, commissions] =
    await Promise.all([
      prisma.merchantSubscription.findMany({
        where: { active: true },
        include: { merchant: { select: { shopDomain: true } } },
      }),
      prisma.whatsAppUsageRecord.aggregate({
        where: { billed: true, billedAt: { gte: monthStart } },
        _sum: { costPerMessage: true },
      }),
      prisma.whatsAppUsageRecord.count({ where: { billed: false } }),
      prisma.referralCommission.findMany({
        include: {
          referral: {
            include: {
              referrerMerchant: { select: { shopDomain: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const mrr = activeSubs.reduce(
    (sum, s) => sum + (PLAN_PRICES[s.tier as SubscriptionTier] ?? 0),
    0
  );

  return {
    mrr,
    activeSubs,
    whatsappRevenueMonth: Number(whatsappRevenue._sum.costPerMessage ?? 0),
    pendingBilling,
    commissions,
  };
}

export async function getActiveSubscriptions() {
  return prisma.merchantSubscription.findMany({
    where: { active: true },
    include: { merchant: { select: { shopDomain: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBillingRuns() {
  const runs = await prisma.whatsAppDailyBillingRun.findMany({
    orderBy: { ranAt: "desc" },
    take: 50,
  });

  return runs.map((r) => ({
    ...r,
    totalAmountUsd: Number(r.totalAmountUsd),
  }));
}

export async function getPendingBillingRecords() {
  const rows = await prisma.whatsAppUsageRecord.findMany({
    where: {
      OR: [{ billed: false }, { billingError: { not: null } }],
    },
    include: { merchant: { select: { shopDomain: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return rows.map((r) => ({
    ...r,
    costPerMessage: Number(r.costPerMessage),
  }));
}
