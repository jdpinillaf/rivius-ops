export const dynamic = "force-dynamic";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import { MerchantFilter } from "@/components/merchant-filter";
import { WhatsAppCostChart } from "@/components/charts/whatsapp-cost";
import { WhatsAppFailedFilters } from "./failed-filters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/formatting";
import {
  MessageCircle,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";
import {
  getWhatsAppKpis,
  getWhatsAppCostByCountry,
  getWhatsAppMessages,
  getWhatsAppDailyRuns,
  getWhatsAppFailed,
  getWhatsAppFailureCodes,
} from "@/lib/queries/whatsapp";
import { getAllMerchantsDomains } from "@/lib/queries/merchants";

type Props = {
  searchParams: Promise<{
    merchantId?: string;
    country?: string;
    billed?: string;
    // Failed tab filters
    failedMerchantId?: string;
    errorCode?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
};

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function WhatsAppPage({ searchParams }: Props) {
  const params = await searchParams;

  const failedFilters = {
    merchantId: params.failedMerchantId,
    errorCode: params.errorCode,
    from: parseDate(params.from),
    to: parseDate(params.to),
    page: params.page ? parseInt(params.page, 10) || 1 : 1,
    pageSize: 25,
  };

  const [
    kpis,
    costByCountry,
    messages,
    dailyRuns,
    failed,
    failureCodes,
    merchants,
  ] = await Promise.all([
    getWhatsAppKpis(),
    getWhatsAppCostByCountry(),
    getWhatsAppMessages({
      merchantId: params.merchantId,
      country: params.country,
      billed: params.billed === "true" ? true : params.billed === "false" ? false : undefined,
    }),
    getWhatsAppDailyRuns(),
    getWhatsAppFailed(failedFilters),
    getWhatsAppFailureCodes(24),
    getAllMerchantsDomains(),
  ]);

  const hasCriticalSpike = failureCodes.some((c) => c.critical && c.count > 0);

  return (
    <div className="space-y-6">
      <PageHeader title="WhatsApp" description="Message delivery and billing">
        <MerchantFilter merchants={merchants} />
      </PageHeader>

      {hasCriticalSpike && (
        <div className="flex items-start gap-3 rounded-md border border-red-300 bg-red-50 p-4">
          <AlertOctagon className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-900">
              Critical WhatsApp errors detected in the last 24h
            </p>
            <p className="mt-0.5 text-xs text-red-700">
              Check the &quot;Failed&quot; tab — one or more error codes indicate a
              platform-wide issue (sender disabled, template paused, or content rejected).
            </p>
          </div>
        </div>
      )}

      {/* A) KPIs with time windows */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Messages"
          value={formatNumber(kpis.totalMessages)}
          icon={<MessageCircle className="h-4 w-4" />}
        />
        <KpiCard
          label="Total Cost"
          value={formatCurrency(kpis.totalCost)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KpiCard
          label="Billed"
          value={formatNumber(kpis.billedCount)}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <KpiCard
          label="Unbilled"
          value={formatNumber(kpis.unbilledCount)}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Failed (24h)"
          value={formatNumber(kpis.failed24h)}
          description="Last 24 hours"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <KpiCard
          label="Failed (7d)"
          value={formatNumber(kpis.failed7d)}
          description="Last 7 days"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <KpiCard
          label="Failed (total)"
          value={formatNumber(kpis.failedTotal)}
          description="All time"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      {/* B) Top error codes (24h) */}
      {failureCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Error Codes (last 24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {failureCodes.slice(0, 8).map((c) => (
                <div
                  key={c.code}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{c.code}</span>
                    <span className="text-sm text-muted-foreground">— {c.label}</span>
                    {c.critical && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                        critical
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold">{c.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cost by Country</CardTitle>
        </CardHeader>
        <CardContent>
          <WhatsAppCostChart data={costByCountry} />
        </CardContent>
      </Card>

      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="daily-runs">Daily Runs</TabsTrigger>
          <TabsTrigger value="failed">
            Failed
            {failed.total > 0 && (
              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                {failed.total}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Message SID</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Billed</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.merchant.shopDomain}</TableCell>
                    <TableCell className="font-mono text-xs">{m.messageSid ?? "—"}</TableCell>
                    <TableCell>{m.countryCode ?? "—"}</TableCell>
                    <TableCell>{formatCurrency(Number(m.costPerMessage))}</TableCell>
                    <TableCell>
                      <StatusBadge status={m.billed ? "Billed" : "Pending"} />
                    </TableCell>
                    <TableCell>{formatDateTime(m.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {messages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No messages found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="daily-runs">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ran At</TableHead>
                  <TableHead>Merchants Billed</TableHead>
                  <TableHead>Records Billed</TableHead>
                  <TableHead>Total USD</TableHead>
                  <TableHead>Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>{formatDateTime(run.ranAt)}</TableCell>
                    <TableCell>{run.merchantsBilled}</TableCell>
                    <TableCell>{run.recordsBilled}</TableCell>
                    <TableCell>{formatCurrency(Number(run.totalAmountUsd))}</TableCell>
                    <TableCell>
                      {run.errors > 0 ? (
                        <span className="text-red-600">{run.errors}</span>
                      ) : (
                        "0"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          {/* D) Filters */}
          <WhatsAppFailedFilters
            merchants={merchants}
            selectedMerchantId={params.failedMerchantId}
            selectedErrorCode={params.errorCode}
            from={params.from}
            to={params.to}
            availableCodes={failureCodes.map((c) => ({
              code: c.code,
              label: c.label,
            }))}
          />

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Message SID</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failed.rows.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/merchants/${f.merchantId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {f.merchantShopDomain}
                      </Link>
                    </TableCell>
                    <TableCell>{f.customerEmail}</TableCell>
                    <TableCell>{f.customerPhone ?? "—"}</TableCell>
                    <TableCell>
                      {f.errorCode ? (
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-mono ${
                            ["63003", "63005", "63018"].includes(f.errorCode)
                              ? "bg-red-100 text-red-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                          title={f.errorLabel}
                        >
                          {f.errorCode}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-xs text-red-600">
                      {f.error ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground">
                      {f.messageSid ?? "—"}
                    </TableCell>
                    <TableCell>
                      {f.messageStatusUpdatedAt
                        ? formatDateTime(f.messageStatusUpdatedAt)
                        : f.sentAt
                          ? formatDateTime(f.sentAt)
                          : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {failed.rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No failed messages match the filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {failed.totalPages > 1 && (
            <FailedPagination
              page={failed.page}
              totalPages={failed.totalPages}
              total={failed.total}
              baseParams={params}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FailedPagination({
  page,
  totalPages,
  total,
  baseParams,
}: {
  page: number;
  totalPages: number;
  total: number;
  baseParams: Record<string, string | undefined>;
}) {
  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(baseParams)) {
      if (value !== undefined) params.set(key, value);
    }
    params.set("page", String(targetPage));
    return `?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        Page {page} of {totalPages} — {total} failed messages
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={buildHref(page - 1)}
            className="rounded-md border px-3 py-1.5 hover:bg-muted"
          >
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={buildHref(page + 1)}
            className="rounded-md border px-3 py-1.5 hover:bg-muted"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
