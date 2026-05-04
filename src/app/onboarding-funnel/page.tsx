export const dynamic = "force-dynamic";

import { Activity, AlertTriangle, CheckCircle2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/kpi-card";
import { formatNumber } from "@/lib/formatting";
import {
  getFunnelCounts,
  getTopAutoInstallFailures,
  getStuckSessions,
  getCheckWidgetDistribution,
  type FunnelPeriod,
} from "@/lib/queries/onboarding-funnel";

const STEP_LABELS = ["Intent", "Widget", "First reviews"] as const;

type SearchParams = { period?: string };

function parsePeriod(value: string | undefined): FunnelPeriod {
  if (value === "7" || value === "30" || value === "90") return Number(value) as FunnelPeriod;
  return 30;
}

function PeriodSelector({ active }: { active: FunnelPeriod }) {
  const opts: FunnelPeriod[] = [7, 30, 90];
  return (
    <div className="inline-flex rounded-full border border-black/10 bg-white p-0.5 text-xs font-medium">
      {opts.map((p) => (
        <a
          key={p}
          href={`?period=${p}`}
          className={`px-3 py-1 rounded-full transition-colors ${
            p === active ? "bg-black text-white" : "text-black/60 hover:text-black/80"
          }`}
        >
          {p}d
        </a>
      ))}
    </div>
  );
}

function FunnelBars({
  steps,
}: {
  steps: { label: string; started: number; completed: number }[];
}) {
  const max = Math.max(1, ...steps.map((s) => s.started));
  return (
    <div className="space-y-4">
      {steps.map((s) => {
        const startedPct = (s.started / max) * 100;
        const completedPct = (s.completed / max) * 100;
        const dropoffPct = s.started > 0 ? ((s.started - s.completed) / s.started) * 100 : 0;
        return (
          <div key={s.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{s.label}</span>
              <span>
                {formatNumber(s.completed)} / {formatNumber(s.started)} · {dropoffPct.toFixed(0)}% drop-off
              </span>
            </div>
            <div className="relative h-7 rounded-md bg-muted overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-emerald-500/30"
                style={{ width: `${startedPct}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-emerald-500"
                style={{ width: `${completedPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function OnboardingFunnelPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { period } = await searchParams;
  const activePeriod = parsePeriod(period);

  const [counts, topFailures, stuck, checkSnap] = await Promise.all([
    getFunnelCounts(activePeriod),
    getTopAutoInstallFailures(activePeriod, 10),
    getStuckSessions(24, 50),
    getCheckWidgetDistribution(activePeriod),
  ]);

  const steps = [
    { label: STEP_LABELS[0], started: counts.step0Started, completed: counts.step0Completed },
    { label: STEP_LABELS[1], started: counts.step1Started, completed: counts.step1Completed },
    { label: STEP_LABELS[2], started: counts.step2Started, completed: counts.step2Completed },
  ];

  const completionRate =
    counts.step0Started > 0 ? (counts.finalCompleted / counts.step0Started) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Onboarding funnel" description={`Drop-off across the 3-step onboarding (last ${activePeriod} days)`}>
        <PeriodSelector active={activePeriod} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Started"
          value={formatNumber(counts.step0Started)}
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          label="Completed"
          value={formatNumber(counts.finalCompleted)}
          description={`${completionRate.toFixed(1)}% completion`}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <KpiCard
          label="Stuck >24h"
          value={formatNumber(stuck.length)}
          description="Last event was step view, no completion"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <KpiCard
          label="Vintage themes"
          value={formatNumber(checkSnap.vintage)}
          description={`out of ${formatNumber(checkSnap.total)} checks`}
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step-by-step drop-off</CardTitle>
        </CardHeader>
        <CardContent>
          <FunnelBars steps={steps} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top auto-install failures</CardTitle>
          </CardHeader>
          <CardContent>
            {topFailures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No failures recorded in this period.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2">Reason</th>
                    <th className="py-2 text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {topFailures.map((f) => (
                    <tr key={f.reason} className="border-b last:border-0">
                      <td className="py-2 font-medium">{f.reason}</td>
                      <td className="py-2 text-right tabular-nums">{formatNumber(f.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Widget check distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Embed enabled</span>
                <span className="tabular-nums font-medium">
                  {formatNumber(checkSnap.embedEnabled)} / {formatNumber(checkSnap.total)}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Section block installed</span>
                <span className="tabular-nums font-medium">
                  {formatNumber(checkSnap.sectionInstalled)} / {formatNumber(checkSnap.total)}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Both ready (fully installed)</span>
                <span className="tabular-nums font-medium">
                  {formatNumber(checkSnap.bothInstalled)} / {formatNumber(checkSnap.total)}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Vintage themes detected</span>
                <span className="tabular-nums font-medium">{formatNumber(checkSnap.vintage)}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stuck sessions ({stuck.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {stuck.length === 0 ? (
            <p className="text-sm text-muted-foreground">No merchants stuck in onboarding.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Shop</th>
                  <th className="py-2">Last step</th>
                  <th className="py-2">Last event</th>
                  <th className="py-2 text-right">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {stuck.map((s) => (
                  <tr key={s.merchantId} className="border-b last:border-0">
                    <td className="py-2 font-medium">{s.shopDomain}</td>
                    <td className="py-2 text-muted-foreground">{s.lastStepName ?? "—"}</td>
                    <td className="py-2 text-muted-foreground">{s.lastEvent}</td>
                    <td className="py-2 text-right text-muted-foreground tabular-nums">
                      {s.lastSeen.toISOString().slice(0, 16).replace("T", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
