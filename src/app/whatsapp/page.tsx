import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import { MerchantFilter } from "@/components/merchant-filter";
import { WhatsAppCostChart } from "@/components/charts/whatsapp-cost";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/formatting";
import { MessageCircle, DollarSign, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import {
  getWhatsAppKpis,
  getWhatsAppCostByCountry,
  getWhatsAppMessages,
  getWhatsAppDailyRuns,
  getWhatsAppFailed,
} from "@/lib/queries/whatsapp";
import { getAllMerchantsDomains } from "@/lib/queries/merchants";

type Props = {
  searchParams: Promise<{
    merchantId?: string;
    country?: string;
    billed?: string;
  }>;
};

export default async function WhatsAppPage({ searchParams }: Props) {
  const params = await searchParams;

  const [kpis, costByCountry, messages, dailyRuns, failed, merchants] =
    await Promise.all([
      getWhatsAppKpis(),
      getWhatsAppCostByCountry(),
      getWhatsAppMessages({
        merchantId: params.merchantId,
        country: params.country,
        billed: params.billed === "true" ? true : params.billed === "false" ? false : undefined,
      }),
      getWhatsAppDailyRuns(),
      getWhatsAppFailed(),
      getAllMerchantsDomains(),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader title="WhatsApp" description="Message delivery and billing">
        <MerchantFilter merchants={merchants} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
        <KpiCard
          label="Failed"
          value={formatNumber(kpis.failedCount)}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

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
          <TabsTrigger value="failed">Failed</TabsTrigger>
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

        <TabsContent value="failed">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failed.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.merchant.shopDomain}</TableCell>
                    <TableCell>{f.customerEmail}</TableCell>
                    <TableCell>{f.customerPhone ?? "—"}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-xs text-red-600">
                      {f.error ?? "—"}
                    </TableCell>
                    <TableCell>{f.sentAt ? formatDateTime(f.sentAt) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
