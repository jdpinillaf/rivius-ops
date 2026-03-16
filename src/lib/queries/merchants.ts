import { prisma } from "@/lib/prisma";
import type { Prisma, SubscriptionTier } from "@prisma/client";

export async function getMerchantsList(filters?: {
  plan?: SubscriptionTier;
  search?: string;
}) {
  const where: Prisma.MerchantWhereInput = {
    ...(filters?.plan && { plan: filters.plan }),
    ...(filters?.search && {
      shopDomain: { contains: filters.search, mode: "insensitive" as const },
    }),
  };

  return prisma.merchant.findMany({
    where,
    include: {
      _count: { select: { reviews: true, reviewRequests: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllMerchantsDomains() {
  return prisma.merchant.findMany({
    select: { id: true, shopDomain: true },
    orderBy: { shopDomain: "asc" },
  });
}

export async function getMerchantDetail(id: string) {
  return prisma.merchant.findUnique({
    where: { id },
    include: {
      settings: true,
      onboarding: true,
      subscriptions: { orderBy: { createdAt: "desc" } },
      _count: {
        select: {
          reviews: true,
          reviewRequests: true,
          widgetClicks: true,
          saleAttributions: true,
          whatsAppUsage: true,
        },
      },
    },
  });
}

export async function getMerchantReviewStats(merchantId: string) {
  const [byStatus, avgRating] = await Promise.all([
    prisma.review.groupBy({
      by: ["status"],
      where: { merchantId },
      _count: { _all: true },
    }),
    prisma.review.aggregate({
      where: { merchantId },
      _avg: { rating: true },
    }),
  ]);
  return { byStatus, avgRating: avgRating._avg.rating ?? 0 };
}

export async function getMerchantReviews(merchantId: string) {
  return prisma.review.findMany({
    where: { merchantId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { media: true },
  });
}

export async function getMerchantRequestStats(merchantId: string) {
  const [byStatus, byChannel] = await Promise.all([
    prisma.reviewRequest.groupBy({
      by: ["status"],
      where: { merchantId },
      _count: { _all: true },
    }),
    prisma.reviewRequest.groupBy({
      by: ["channel"],
      where: { merchantId },
      _count: { _all: true },
    }),
  ]);
  return { byStatus, byChannel };
}

export async function getMerchantRequests(merchantId: string) {
  return prisma.reviewRequest.findMany({
    where: { merchantId },
    orderBy: { sentAt: "desc" },
    take: 20,
  });
}

export async function getMerchantWhatsApp(merchantId: string) {
  const [records, totals] = await Promise.all([
    prisma.whatsAppUsageRecord.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.whatsAppUsageRecord.aggregate({
      where: { merchantId },
      _sum: { costPerMessage: true },
      _count: true,
    }),
  ]);

  const unbilledCount = await prisma.whatsAppUsageRecord.count({
    where: { merchantId, billed: false },
  });

  return {
    records: records.map((r) => ({
      ...r,
      costPerMessage: Number(r.costPerMessage),
    })),
    totalMessages: totals._count,
    totalCost: Number(totals._sum.costPerMessage ?? 0),
    unbilledCount,
  };
}

export async function getMerchantAttribution(merchantId: string) {
  const [clicks, sales, totalRevenue] = await Promise.all([
    prisma.reviewWidgetClick.count({ where: { merchantId } }),
    prisma.saleAttribution.findMany({
      where: { merchantId },
      orderBy: { attributedAt: "desc" },
      take: 20,
    }),
    prisma.saleAttribution.aggregate({
      where: { merchantId },
      _sum: { totalAmount: true },
      _count: true,
    }),
  ]);

  return {
    clicksCount: clicks,
    salesCount: totalRevenue._count,
    totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
    conversionRate: clicks > 0 ? totalRevenue._count / clicks : 0,
    recentSales: sales.map((s) => ({
      ...s,
      totalAmount: s.totalAmount ? Number(s.totalAmount) : null,
    })),
  };
}

export async function getMerchantAffiliate(merchantId: string) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      referralCode: true,
      referralsMade: {
        include: { commission: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return merchant;
}
