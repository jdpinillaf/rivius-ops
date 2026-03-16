import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/kpi-card";
import { PlanBadge } from "@/components/plan-badge";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/formatting";
import { DollarSign, CreditCard, MessageCircle, AlertTriangle } from "lucide-react";
import {
  getPaymentsKpis,
  getActiveSubscriptions,
  getBillingRuns,
  getPendingBillingRecords,
} from "@/lib/queries/payments";

export default async function PaymentsPage() {
  const [kpis, subscriptions, billingRuns, pendingRecords] = await Promise.all([
    getPaymentsKpis(),
    getActiveSubscriptions(),
    getBillingRuns(),
    getPendingBillingRecords(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Subscriptions, billing, and commissions" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="MRR"
          value={formatCurrency(kpis.mrr)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KpiCard
          label="Active Subscriptions"
          value={formatNumber(kpis.activeSubs.length)}
          icon={<CreditCard className="h-4 w-4" />}
        />
        <KpiCard
          label="WhatsApp Revenue (Month)"
          value={formatCurrency(kpis.whatsappRevenueMonth)}
          icon={<MessageCircle className="h-4 w-4" />}
        />
        <KpiCard
          label="Pending Billing Records"
          value={formatNumber(kpis.pendingBilling)}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <Tabs defaultValue="subscriptions">
        <TabsList>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="billing-runs">Billing Runs</TabsTrigger>
          <TabsTrigger value="pending">Pending / Failed</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.merchant.shopDomain}</TableCell>
                    <TableCell><PlanBadge tier={sub.tier} /></TableCell>
                    <TableCell><StatusBadge status={sub.active ? "Active" : "Inactive"} /></TableCell>
                    <TableCell>{formatDate(sub.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="billing-runs">
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
                {billingRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>{formatDateTime(run.ranAt)}</TableCell>
                    <TableCell>{run.merchantsBilled}</TableCell>
                    <TableCell>{run.recordsBilled}</TableCell>
                    <TableCell>{formatCurrency(Number(run.totalAmountUsd))}</TableCell>
                    <TableCell>
                      {run.errors > 0 ? (
                        <StatusBadge status="FAILED" />
                      ) : (
                        <span className="text-sm text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Message SID</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRecords.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="font-medium">{rec.merchant.shopDomain}</TableCell>
                    <TableCell className="font-mono text-xs">{rec.messageSid ?? "—"}</TableCell>
                    <TableCell>{rec.countryCode ?? "—"}</TableCell>
                    <TableCell>{formatCurrency(Number(rec.costPerMessage))}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-red-600">
                      {rec.billingError ?? "—"}
                    </TableCell>
                    <TableCell>{formatDateTime(rec.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="commissions">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpis.commissions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.referral.referrerMerchant.shopDomain}
                    </TableCell>
                    <TableCell><PlanBadge tier={c.tier} /></TableCell>
                    <TableCell>{formatCurrency(c.amountCents / 100)}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell>{formatDate(c.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {kpis.commissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No commissions
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
