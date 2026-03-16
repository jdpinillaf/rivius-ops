import { prisma } from "@/lib/prisma";
import type { Prisma, ErrorGroupStatus } from "@prisma/client";
import { startOfDay } from "date-fns";

export async function getSupportKpis() {
  const today = startOfDay(new Date());

  const [openErrors, resolvedToday, errorsToday, mostAffected] =
    await Promise.all([
      prisma.errorGroup.count({ where: { status: "OPEN" } }),
      prisma.errorGroup.count({
        where: { resolvedAt: { gte: today } },
      }),
      prisma.errorGroup.count({
        where: { lastSeenAt: { gte: today } },
      }),
      prisma.errorOccurrence.groupBy({
        by: ["merchantId"],
        where: { merchantId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { merchantId: "desc" } },
        take: 1,
      }),
    ]);

  let mostAffectedDomain: string | null = null;
  if (mostAffected.length > 0 && mostAffected[0].merchantId) {
    const merchant = await prisma.merchant.findUnique({
      where: { id: mostAffected[0].merchantId },
      select: { shopDomain: true },
    });
    mostAffectedDomain = merchant?.shopDomain ?? null;
  }

  return { openErrors, resolvedToday, errorsToday, mostAffectedDomain };
}

export async function getErrorGroups(filters?: {
  status?: ErrorGroupStatus;
  search?: string;
  merchantId?: string;
}) {
  const where: Prisma.ErrorGroupWhereInput = {
    ...(filters?.status && { status: filters.status }),
    ...(filters?.search && {
      source: { contains: filters.search, mode: "insensitive" as const },
    }),
    ...(filters?.merchantId && {
      occurrences: { some: { merchantId: filters.merchantId } },
    }),
  };

  return prisma.errorGroup.findMany({
    where,
    include: {
      _count: { select: { occurrences: true } },
    },
    orderBy: { lastSeenAt: "desc" },
    take: 500,
  });
}

export async function getErrorGroupDetail(id: string) {
  return prisma.errorGroup.findUnique({
    where: { id },
    include: {
      occurrences: {
        include: {
          merchant: { select: { shopDomain: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
}
