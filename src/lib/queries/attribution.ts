import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { subDays } from "date-fns";

export async function getAttributionKpis() {
  const [totalClicks, totalSales, revenueAgg] = await Promise.all([
    prisma.reviewWidgetClick.count(),
    prisma.saleAttribution.count(),
    prisma.saleAttribution.aggregate({
      _sum: { totalAmount: true },
    }),
  ]);

  return {
    totalClicks,
    totalSales,
    conversionRate: totalClicks > 0 ? totalSales / totalClicks : 0,
    totalRevenue: Number(revenueAgg._sum.totalAmount ?? 0),
  };
}

export async function getSaleAttributions(filters?: {
  merchantId?: string;
  from?: Date;
  to?: Date;
}) {
  const from = filters?.from ?? subDays(new Date(), 7);
  const to = filters?.to ?? new Date();

  const where: Prisma.SaleAttributionWhereInput = {
    attributedAt: { gte: from, lte: to },
    ...(filters?.merchantId && { merchantId: filters.merchantId }),
  };

  const rows = await prisma.saleAttribution.findMany({
    where,
    include: { merchant: { select: { shopDomain: true } } },
    orderBy: { attributedAt: "desc" },
    take: 500,
  });

  return rows.map((r) => ({
    ...r,
    totalAmount: r.totalAmount ? Number(r.totalAmount) : null,
  }));
}

export async function getWidgetClicks(filters?: {
  merchantId?: string;
  from?: Date;
  to?: Date;
}) {
  const from = filters?.from ?? subDays(new Date(), 7);
  const to = filters?.to ?? new Date();

  const where: Prisma.ReviewWidgetClickWhereInput = {
    createdAt: { gte: from, lte: to },
    ...(filters?.merchantId && { merchantId: filters.merchantId }),
  };

  return prisma.reviewWidgetClick.findMany({
    where,
    include: { merchant: { select: { shopDomain: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}
