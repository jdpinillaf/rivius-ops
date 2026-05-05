export const dynamic = "force-dynamic";

import type { BlastJobStatus } from "@prisma/client";
import { Activity, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MerchantFilter } from "@/components/merchant-filter";
import { KpiCard } from "@/components/kpi-card";
import { BlastJobsTable } from "./blast-jobs-table";
import { getBlastJobs, getBlastJobKpis } from "@/lib/queries/blast-jobs";
import { getAllMerchantsDomains } from "@/lib/queries/merchants";
import { subDays } from "date-fns";

type Props = {
  searchParams: Promise<{
    merchantId?: string;
    status?: string;
    days?: string;
  }>;
};

export default async function BlastJobsPage({ searchParams }: Props) {
  const params = await searchParams;
  const days = params.days ? parseInt(params.days) : 30;
  const from = subDays(new Date(), days);
  const to = new Date();

  const [jobs, kpis, merchants] = await Promise.all([
    getBlastJobs({
      merchantId: params.merchantId,
      status: params.status as BlastJobStatus | undefined,
      from,
      to,
    }),
    getBlastJobKpis({ from, to }),
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
    </div>
  );
}
