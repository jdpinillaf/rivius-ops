import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Error codes that indicate platform-wide or account-level issues.
// See ShopifyApp/src/lib/whatsapp-alerts.ts for the full reference.
export const CRITICAL_ERROR_CODES = new Set(["63003", "63005", "63018"]);

const ERROR_CODE_LABELS: Record<string, string> = {
  "63003": "Sender disabled",
  "63005": "Content not approved",
  "63016": "Outside 24h window",
  "63018": "Template paused by Meta",
  "63024": "Blocked as spam",
  "21211": "Not on WhatsApp",
  "21614": "Invalid number",
};

export function extractErrorCode(error: string | null): string | null {
  if (!error) return null;
  return error.match(/code (\d+)/)?.[1] ?? null;
}

export function getErrorCodeLabel(code: string | null): string {
  if (!code) return "Unknown";
  return ERROR_CODE_LABELS[code] ?? code;
}

export async function getWhatsAppKpis() {
  const now = Date.now();
  const since24h = new Date(now - 24 * 60 * 60 * 1000);
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [
    totals,
    billedCount,
    unbilledCount,
    failedTotal,
    failed24h,
    failed7d,
  ] = await Promise.all([
    prisma.whatsAppUsageRecord.aggregate({
      _sum: { costPerMessage: true },
      _count: true,
    }),
    prisma.whatsAppUsageRecord.count({ where: { billed: true } }),
    prisma.whatsAppUsageRecord.count({ where: { billed: false } }),
    prisma.reviewRequest.count({
      where: { channel: "WHATSAPP", status: "FAILED" },
    }),
    prisma.reviewRequest.count({
      where: {
        channel: "WHATSAPP",
        status: "FAILED",
        messageStatusUpdatedAt: { gte: since24h },
      },
    }),
    prisma.reviewRequest.count({
      where: {
        channel: "WHATSAPP",
        status: "FAILED",
        messageStatusUpdatedAt: { gte: since7d },
      },
    }),
  ]);

  return {
    totalMessages: totals._count,
    totalCost: Number(totals._sum.costPerMessage ?? 0),
    billedCount,
    unbilledCount,
    failedTotal,
    failed24h,
    failed7d,
  };
}

export async function getWhatsAppFailureCodes(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const rows = await prisma.reviewRequest.findMany({
    where: {
      channel: "WHATSAPP",
      status: "FAILED",
      messageStatusUpdatedAt: { gte: since },
    },
    select: { error: true },
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    const code = extractErrorCode(row.error) ?? "unknown";
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([code, count]) => ({
      code,
      count,
      label: getErrorCodeLabel(code),
      critical: CRITICAL_ERROR_CODES.has(code),
    }))
    .sort((a, b) => b.count - a.count);
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

export type FailedWhatsAppFilters = {
  merchantId?: string;
  errorCode?: string;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
};

export async function getWhatsAppFailed(filters: FailedWhatsAppFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, filters.pageSize ?? 25));

  const where: Prisma.ReviewRequestWhereInput = {
    channel: "WHATSAPP",
    status: "FAILED",
    ...(filters.merchantId && { merchantId: filters.merchantId }),
    ...(filters.errorCode && { error: { contains: `code ${filters.errorCode}` } }),
    ...((filters.from || filters.to) && {
      messageStatusUpdatedAt: {
        ...(filters.from && { gte: filters.from }),
        ...(filters.to && { lte: filters.to }),
      },
    }),
  };

  const [rows, total] = await Promise.all([
    prisma.reviewRequest.findMany({
      where,
      include: { merchant: { select: { id: true, shopDomain: true } } },
      orderBy: { messageStatusUpdatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.reviewRequest.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      merchantId: r.merchant.id,
      merchantShopDomain: r.merchant.shopDomain,
      customerEmail: r.customerEmail,
      customerPhone: r.customerPhone,
      messageSid: r.messageSid,
      error: r.error,
      errorCode: extractErrorCode(r.error),
      errorLabel: getErrorCodeLabel(extractErrorCode(r.error)),
      sentAt: r.sentAt,
      messageStatusUpdatedAt: r.messageStatusUpdatedAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
