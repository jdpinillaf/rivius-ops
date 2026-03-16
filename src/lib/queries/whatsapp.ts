import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function getWhatsAppKpis() {
  const [totals, billedCount, unbilledCount, failedCount] = await Promise.all([
    prisma.whatsAppUsageRecord.aggregate({
      _sum: { costPerMessage: true },
      _count: true,
    }),
    prisma.whatsAppUsageRecord.count({ where: { billed: true } }),
    prisma.whatsAppUsageRecord.count({ where: { billed: false } }),
    prisma.reviewRequest.count({
      where: { channel: "WHATSAPP", status: "FAILED" },
    }),
  ]);

  return {
    totalMessages: totals._count,
    totalCost: Number(totals._sum.costPerMessage ?? 0),
    billedCount,
    unbilledCount,
    failedCount,
  };
}

export async function getWhatsAppCostByCountry() {
  const records = await prisma.whatsAppUsageRecord.groupBy({
    by: ["countryCode"],
    _sum: { costPerMessage: true },
    _count: true,
    orderBy: { _sum: { costPerMessage: "desc" } },
  });

  return records.map((r) => ({
    countryCode: r.countryCode ?? "Unknown",
    totalCost: Number(r._sum.costPerMessage ?? 0),
    count: r._count,
  }));
}

export async function getWhatsAppMessages(filters?: {
  merchantId?: string;
  country?: string;
  billed?: boolean;
  from?: Date;
  to?: Date;
}) {
  const where: Prisma.WhatsAppUsageRecordWhereInput = {
    ...(filters?.merchantId && { merchantId: filters.merchantId }),
    ...(filters?.country && { countryCode: filters.country }),
    ...(filters?.billed !== undefined && { billed: filters.billed }),
    ...((filters?.from || filters?.to) && {
      createdAt: {
        ...(filters?.from && { gte: filters.from }),
        ...(filters?.to && { lte: filters.to }),
      },
    }),
  };

  const rows = await prisma.whatsAppUsageRecord.findMany({
    where,
    include: { merchant: { select: { shopDomain: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return rows.map((r) => ({
    ...r,
    costPerMessage: Number(r.costPerMessage),
  }));
}

export async function getWhatsAppDailyRuns() {
  const runs = await prisma.whatsAppDailyBillingRun.findMany({
    orderBy: { ranAt: "desc" },
    take: 50,
  });

  return runs.map((r) => ({
    ...r,
    totalAmountUsd: Number(r.totalAmountUsd),
  }));
}

export async function getWhatsAppFailed() {
  return prisma.reviewRequest.findMany({
    where: { channel: "WHATSAPP", status: "FAILED" },
    include: { merchant: { select: { shopDomain: true } } },
    orderBy: { sentAt: "desc" },
    take: 100,
  });
}
