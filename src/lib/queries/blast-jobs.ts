import { prisma } from "@/lib/prisma";
import { Prisma, type BlastJobStatus } from "@prisma/client";
import { subDays } from "date-fns";

export async function getBlastJobs(filters?: {
  merchantId?: string;
  status?: BlastJobStatus;
  from?: Date;
  to?: Date;
}) {
  const from = filters?.from ?? subDays(new Date(), 30);
  const to = filters?.to ?? new Date();

  const where: Prisma.BlastJobWhereInput = {
    createdAt: { gte: from, lte: to },
    ...(filters?.merchantId && { merchantId: filters.merchantId }),
    ...(filters?.status && { status: filters.status }),
  };

  return prisma.blastJob.findMany({
    where,
    select: {
      id: true,
      status: true,
      channel: true,
      sent: true,
      failed: true,
      total: true,
      limit: true,
      error: true,
      createdAt: true,
      startedAt: true,
      completedAt: true,
      merchant: { select: { shopDomain: true, plan: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

/**
 * Suspicious duplicate sends: ReviewRequests where the WhatsAppUsageRecord
 * was created significantly before the final sentAt update — strong signal
 * that the request was processed twice (Vercel killed mid-flight, retry hit
 * the recovery guard, but the customer received the message twice).
 *
 * Pre-recovery-guard data: Twilio was called twice, first usageRecord was
 * created on attempt 1, second attempt's usageRecord upsert is a no-op,
 * sentAt got updated by attempt 2.
 */
export async function getSuspiciousDuplicateSends(filters?: {
  merchantId?: string;
  thresholdSeconds?: number;
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  const threshold = filters?.thresholdSeconds ?? 30;
  const from = filters?.from ?? subDays(new Date(), 7);
  const to = filters?.to ?? new Date();
  const limit = filters?.limit ?? 200;

  const merchantFilter = filters?.merchantId
    ? Prisma.sql`AND rr."merchantId" = ${filters.merchantId}`
    : Prisma.empty;

  type Row = {
    requestId: string;
    merchantId: string;
    shopDomain: string;
    customerPhone: string | null;
    customerEmail: string | null;
    productName: string | null;
    sentAt: Date;
    usageCreatedAt: Date;
    secondsBetween: number;
  };

  return prisma.$queryRaw<Row[]>`
    SELECT
      rr.id AS "requestId",
      rr."merchantId",
      m."shopDomain",
      rr."customerPhone",
      rr."customerEmail",
      rr."productName",
      rr."sentAt",
      wur."createdAt" AS "usageCreatedAt",
      EXTRACT(EPOCH FROM (rr."sentAt" - wur."createdAt"))::int AS "secondsBetween"
    FROM "ReviewRequest" rr
    JOIN "WhatsAppUsageRecord" wur ON wur."reviewRequestId" = rr.id
    JOIN "Merchant" m ON m.id = rr."merchantId"
    WHERE rr."sentAt" > wur."createdAt" + (${threshold} || ' seconds')::interval
      AND rr."sentAt" >= ${from}
      AND rr."sentAt" <= ${to}
      ${merchantFilter}
    ORDER BY EXTRACT(EPOCH FROM (rr."sentAt" - wur."createdAt")) DESC
    LIMIT ${limit}
  `;
}

export async function getDuplicateSendKpis(filters?: { from?: Date; to?: Date }) {
  const threshold = 30;
  const from = filters?.from ?? subDays(new Date(), 7);
  const to = filters?.to ?? new Date();

  type Row = {
    totalDuplicates: bigint;
    affectedMerchants: bigint;
    affectedPhones: bigint;
  };

  const [row] = await prisma.$queryRaw<Row[]>`
    SELECT
      COUNT(*)::bigint AS "totalDuplicates",
      COUNT(DISTINCT rr."merchantId")::bigint AS "affectedMerchants",
      COUNT(DISTINCT rr."customerPhone")::bigint AS "affectedPhones"
    FROM "ReviewRequest" rr
    JOIN "WhatsAppUsageRecord" wur ON wur."reviewRequestId" = rr.id
    WHERE rr."sentAt" > wur."createdAt" + (${threshold} || ' seconds')::interval
      AND rr."sentAt" >= ${from}
      AND rr."sentAt" <= ${to}
  `;

  return {
    totalDuplicates: Number(row?.totalDuplicates ?? 0),
    affectedMerchants: Number(row?.affectedMerchants ?? 0),
    affectedPhones: Number(row?.affectedPhones ?? 0),
  };
}

export async function getBlastJobKpis(filters?: { from?: Date; to?: Date }) {
  const from = filters?.from ?? subDays(new Date(), 30);
  const to = filters?.to ?? new Date();
  const where: Prisma.BlastJobWhereInput = { createdAt: { gte: from, lte: to } };

  const [running, totals] = await Promise.all([
    prisma.blastJob.count({ where: { status: "RUNNING" } }),
    prisma.blastJob.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
      _sum: { sent: true, failed: true, total: true },
    }),
  ]);

  const byStatus = Object.fromEntries(
    totals.map((t) => [
      t.status,
      { count: t._count._all, sent: t._sum.sent ?? 0, failed: t._sum.failed ?? 0, total: t._sum.total ?? 0 },
    ])
  );

  const totalJobs = totals.reduce((sum, t) => sum + t._count._all, 0);
  const totalSent = totals.reduce((sum, t) => sum + (t._sum.sent ?? 0), 0);
  const totalFailed = totals.reduce((sum, t) => sum + (t._sum.failed ?? 0), 0);
  const doneCount = byStatus.DONE?.count ?? 0;
  const failedCount = byStatus.FAILED?.count ?? 0;
  const successRate = doneCount + failedCount > 0
    ? Math.round((doneCount / (doneCount + failedCount)) * 100)
    : null;

  return {
    totalJobs,
    running,
    pending: byStatus.PENDING?.count ?? 0,
    done: doneCount,
    failed: failedCount,
    totalSent,
    totalFailed,
    successRate,
  };
}
