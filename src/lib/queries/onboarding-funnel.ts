import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

export type FunnelPeriod = 7 | 30 | 90;

const STEP_NAMES = ["intent", "widget", "first_reviews"] as const;

export type FunnelCounts = {
  step0Started: number;
  step0Completed: number;
  step1Started: number;
  step1Completed: number;
  step2Started: number;
  step2Completed: number;
  finalCompleted: number;
};

function periodStart(periodDays: FunnelPeriod): Date {
  return subDays(new Date(), periodDays);
}

// Counts unique merchants who entered/completed each onboarding step within
// the period. Uses STEP_VIEWED for "started" and STEP_COMPLETED for completion.
export async function getFunnelCounts(periodDays: FunnelPeriod): Promise<FunnelCounts> {
  const since = periodStart(periodDays);

  const [stepViews, stepCompletes, finals] = await Promise.all([
    prisma.onboardingEvent.findMany({
      where: { eventName: "onboarding_step_viewed", createdAt: { gte: since } },
      select: { merchantId: true, stepIndex: true, stepName: true },
    }),
    prisma.onboardingEvent.findMany({
      where: { eventName: "onboarding_step_completed", createdAt: { gte: since } },
      select: { merchantId: true, stepIndex: true, stepName: true },
    }),
    prisma.onboardingEvent.findMany({
      where: { eventName: "onboarding_completed", createdAt: { gte: since } },
      select: { merchantId: true },
    }),
  ]);

  const dedup = (rows: { merchantId: string; stepIndex?: number | null; stepName?: string | null }[], idx: number) => {
    const set = new Set<string>();
    for (const r of rows) {
      const matches =
        (typeof r.stepIndex === "number" && r.stepIndex === idx) ||
        (typeof r.stepName === "string" && r.stepName === STEP_NAMES[idx]);
      if (matches) set.add(r.merchantId);
    }
    return set.size;
  };

  return {
    step0Started: dedup(stepViews, 0),
    step0Completed: dedup(stepCompletes, 0),
    step1Started: dedup(stepViews, 1),
    step1Completed: dedup(stepCompletes, 1),
    step2Started: dedup(stepViews, 2),
    step2Completed: dedup(stepCompletes, 2),
    finalCompleted: new Set(finals.map((f) => f.merchantId)).size,
  };
}

export type FailureReasonRow = { reason: string; count: number };

export async function getTopAutoInstallFailures(
  periodDays: FunnelPeriod,
  limit = 10
): Promise<FailureReasonRow[]> {
  const since = periodStart(periodDays);
  const grouped = await prisma.onboardingEvent.groupBy({
    by: ["reason"],
    where: { eventName: "onboarding_auto_install_failed", createdAt: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { reason: "desc" } },
    take: limit,
  });
  return grouped
    .filter((g) => !!g.reason)
    .map((g) => ({ reason: g.reason ?? "unknown", count: g._count._all }));
}

export type StuckSession = {
  merchantId: string;
  shopDomain: string;
  lastEvent: string;
  lastStepName: string | null;
  lastSeen: Date;
};

// Sessions where the merchant last produced a STEP_VIEWED event but no
// STEP_COMPLETED in the configured stuck window. Cheap approximation: take
// the latest event per merchant and filter where eventName is the view.
export async function getStuckSessions(hoursStuck = 24, limit = 50): Promise<StuckSession[]> {
  const cutoff = new Date(Date.now() - hoursStuck * 60 * 60 * 1000);
  const recent = await prisma.onboardingEvent.findMany({
    where: { createdAt: { lt: cutoff } },
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: { merchantId: true, shopDomain: true, eventName: true, stepName: true, createdAt: true },
  });

  // Per-merchant latest event from the candidate window
  const latest = new Map<string, StuckSession>();
  for (const row of recent) {
    if (latest.has(row.merchantId)) continue;
    latest.set(row.merchantId, {
      merchantId: row.merchantId,
      shopDomain: row.shopDomain,
      lastEvent: row.eventName,
      lastStepName: row.stepName,
      lastSeen: row.createdAt,
    });
  }

  // Exclude merchants who completed onboarding at any point
  const completedSet = new Set(
    (
      await prisma.onboardingEvent.findMany({
        where: { eventName: "onboarding_completed", merchantId: { in: Array.from(latest.keys()) } },
        select: { merchantId: true },
      })
    ).map((e) => e.merchantId)
  );

  const stuck: StuckSession[] = [];
  for (const [merchantId, row] of latest.entries()) {
    if (completedSet.has(merchantId)) continue;
    if (row.lastEvent === "onboarding_step_viewed") stuck.push(row);
    if (stuck.length >= limit) break;
  }
  return stuck;
}

export type CheckWidgetSnapshot = {
  total: number;
  embedEnabled: number;
  sectionInstalled: number;
  bothInstalled: number;
  vintage: number;
};

// Distribution of the latest CHECK_WIDGET_RESULT per merchant in the period.
export async function getCheckWidgetDistribution(periodDays: FunnelPeriod): Promise<CheckWidgetSnapshot> {
  const since = periodStart(periodDays);
  const rows = await prisma.onboardingEvent.findMany({
    where: { eventName: "onboarding_check_widget_result", createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    select: { merchantId: true, metadata: true },
  });

  const seen = new Set<string>();
  const snap: CheckWidgetSnapshot = {
    total: 0,
    embedEnabled: 0,
    sectionInstalled: 0,
    bothInstalled: 0,
    vintage: 0,
  };

  for (const row of rows) {
    if (seen.has(row.merchantId)) continue;
    seen.add(row.merchantId);
    snap.total += 1;
    const md = (row.metadata ?? {}) as Record<string, unknown>;
    const embedEnabled = md.embedEnabled === true;
    const sectionInstalled = md.sectionInstalled === true;
    const themeKind = md.themeKind;
    if (embedEnabled) snap.embedEnabled += 1;
    if (sectionInstalled) snap.sectionInstalled += 1;
    if (embedEnabled && sectionInstalled) snap.bothInstalled += 1;
    if (themeKind === "vintage") snap.vintage += 1;
  }
  return snap;
}
