import { prisma } from "@/lib/prisma";
import type { Prisma, BlastJobStatus } from "@prisma/client";
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
