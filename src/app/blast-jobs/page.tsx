export const dynamic = "force-dynamic";

import type { BlastJobStatus } from "@prisma/client";
import { Activity, AlertOctagon, CheckCircle2, Loader2, Users, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MerchantFilter } from "@/components/merchant-filter";
import { KpiCard } from "@/components/kpi-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlastJobsTable } from "./blast-jobs-table";
import { DuplicatesTable } from "./duplicates-table";
import {
  getBlastJobs,
  getBlastJobKpis,
  getSuspiciousDuplicateSends,
  getDuplicateSendKpis,
} from "@/lib/queries/blast-jobs";
import { getAllMerchantsDomains } from "@/lib/queries/merchants";
import { subDays } from "date-fns";

type Props = {
  searchParams: Promise<{
    merchantId?: string;
    status?: string;
    days?: string;
    tab?: string;
  }>;
};

export default async function BlastJobsPage({ searchParams }: Props) {
  const params = await searchParams;
  const days = params.days ? parseInt(params.days) : 30;
  const from = subDays(new Date(), days);
  const to = new Date();

  const [jobs, kpis, duplicates, dupeKpis, merchants] = await Promise.all([
    getBlastJobs({
      merchantId: params.merchantId,
      status: params.status as BlastJobStatus | undefined,
      from,
      to,
    }),
    getBlastJobKpis({ from, to }),
    getSuspiciousDuplicateSends({
      merchantId: params.merchantId,
      from,
      to,
      thresholdSeconds: 30,
    }),
    getDuplicateSendKpis({ from, to }),
    getAllMerchantsDomains(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blast Jobs"
        description={`${jobs.length} jobs in last ${days} days`}
      >
        <MerchantFilter merchants={merchants} />
      </PageHeader>

      <Tabs defaultValue={params.tab === "duplicates" ? "duplicates" : "jobs"}>
        <TabsList>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="duplicates">
            Duplicates
            {dupeKpis.totalDuplicates > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                {dupeKpis.totalDuplicates}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard
              label="Running"
              value={kpis.running}
              description="Currently processing"
              icon={<Loader2 className="h-4 w-4" />}
            />
            <KpiCard
              label="Total Jobs"
              value={kpis.totalJobs}
              description={`Last ${days} days`}
              icon={<Activity className="h-4 w-4" />}
            />
            <KpiCard
              label="Success Rate"
              value={kpis.successRate === null ? "—" : `${kpis.successRate}%`}
              description={`${kpis.done} done / ${kpis.failed} failed`}
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
            <KpiCard
              label="Messages Sent"
              value={kpis.totalSent.toLocaleString()}
              description={`${kpis.totalFailed} failed sends`}
              icon={<XCircle className="h-4 w-4" />}
            />
          </div>

          <BlastJobsTable data={jobs} />
        </TabsContent>

        <TabsContent value="duplicates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              label="Suspicious sends"
              value={dupeKpis.totalDuplicates.toLocaleString()}
              description={`Gap > 30s between usage record and SENT`}
              icon={<AlertOctagon className="h-4 w-4" />}
            />
            <KpiCard
              label="Affected merchants"
              value={dupeKpis.affectedMerchants}
              description={`Last ${days} days`}
              icon={<Users className="h-4 w-4" />}
            />
            <KpiCard
              label="Affected phones"
              value={dupeKpis.affectedPhones.toLocaleString()}
              description="Unique customer phones"
              icon={<XCircle className="h-4 w-4" />}
            />
          </div>

          {duplicates.length > 0 ? (
            <DuplicatesTable data={duplicates} />
          ) : (
            <div className="rounded-md border border-dashed p-12 text-center text-sm text-muted-foreground">
              No suspicious duplicate sends detected for the selected filters.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
