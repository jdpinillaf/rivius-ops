import Link from "next/link";
import type { ErrorGroupStatus } from "@prisma/client";
import { PageHeader } from "@/components/layout/page-header";
import { MerchantFilter } from "@/components/merchant-filter";
import { KpiCard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatRelative, formatNumber } from "@/lib/formatting";
import { AlertTriangle, CheckCircle, AlertCircle, Store } from "lucide-react";
import { getSupportKpis, getErrorGroups } from "@/lib/queries/support";
import { getAllMerchantsDomains } from "@/lib/queries/merchants";
import { StatusFilter } from "./status-filter";

type Props = {
  searchParams: Promise<{
    status?: string;
    search?: string;
    merchantId?: string;
  }>;
};

export default async function SupportPage({ searchParams }: Props) {
  const params = await searchParams;

  const [kpis, errorGroups, merchants] = await Promise.all([
    getSupportKpis(),
    getErrorGroups({
      status: params.status as ErrorGroupStatus | undefined,
      search: params.search,
      merchantId: params.merchantId,
    }),
    getAllMerchantsDomains(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Tickets"
        description={`${errorGroups.length} error groups`}
      >
        <StatusFilter />
        <MerchantFilter merchants={merchants} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Open Errors"
          value={formatNumber(kpis.openErrors)}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <KpiCard
          label="Resolved Today"
          value={formatNumber(kpis.resolvedToday)}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <KpiCard
          label="Errors Today"
          value={formatNumber(kpis.errorsToday)}
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <KpiCard
          label="Most Affected Merchant"
          value={kpis.mostAffectedDomain ?? "—"}
          icon={<Store className="h-4 w-4" />}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>First Seen</TableHead>
              <TableHead>Last Seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {errorGroups.map((group) => (
              <TableRow key={group.id}>
                <TableCell>
                  <Link
                    href={`/support/${group.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {group.source}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[300px] truncate text-sm">
                  {group.message}
                </TableCell>
                <TableCell className="font-bold">{group.count}</TableCell>
                <TableCell>
                  <StatusBadge status={group.status} />
                </TableCell>
                <TableCell>{formatDate(group.firstSeenAt)}</TableCell>
                <TableCell>{formatRelative(group.lastSeenAt)}</TableCell>
              </TableRow>
            ))}
            {errorGroups.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No error groups found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
