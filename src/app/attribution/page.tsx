import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/kpi-card";
import { MerchantFilter } from "@/components/merchant-filter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime, formatNumber, formatPercent } from "@/lib/formatting";
import { MousePointer, ShoppingCart, TrendingUp, DollarSign } from "lucide-react";
import {
  getAttributionKpis,
  getSaleAttributions,
  getWidgetClicks,
} from "@/lib/queries/attribution";
import { getAllMerchantsDomains } from "@/lib/queries/merchants";
import { subDays } from "date-fns";

type Props = {
  searchParams: Promise<{ merchantId?: string; days?: string }>;
};

export default async function AttributionPage({ searchParams }: Props) {
  const params = await searchParams;
  const days = params.days ? parseInt(params.days) : 7;

  const [kpis, sales, clicks, merchants] = await Promise.all([
    getAttributionKpis(),
    getSaleAttributions({
      merchantId: params.merchantId,
      from: subDays(new Date(), days),
      to: new Date(),
    }),
    getWidgetClicks({
      merchantId: params.merchantId,
      from: subDays(new Date(), days),
      to: new Date(),
    }),
    getAllMerchantsDomains(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Attribution" description="Click-to-sale tracking">
        <MerchantFilter merchants={merchants} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Clicks"
          value={formatNumber(kpis.totalClicks)}
          icon={<MousePointer className="h-4 w-4" />}
        />
        <KpiCard
          label="Total Sales"
          value={formatNumber(kpis.totalSales)}
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <KpiCard
          label="Conversion Rate"
          value={formatPercent(kpis.conversionRate)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KpiCard
          label="Revenue Attributed"
          value={formatCurrency(kpis.totalRevenue)}
          icon={<DollarSign className="h-4 w-4" />}
        />
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="clicks">Clicks</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Minutes</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.merchant.shopDomain}
                    </TableCell>
                    <TableCell>{s.orderName ?? s.orderId}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm">
                      {s.productName ?? "—"}
                    </TableCell>
                    <TableCell>{s.quantity}</TableCell>
                    <TableCell>
                      {s.totalAmount
                        ? formatCurrency(Number(s.totalAmount), s.currency ?? "USD")
                        : "—"}
                    </TableCell>
                    <TableCell>{s.minutesBetween ?? "—"}</TableCell>
                    <TableCell>{formatDateTime(s.attributedAt)}</TableCell>
                  </TableRow>
                ))}
                {sales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No attributed sales
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="clicks">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Session ID</TableHead>
                  <TableHead>Customer Email</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clicks.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.merchant.shopDomain}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.productId}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {c.sessionId.slice(0, 12)}...
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.customerEmail ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {c.ipAddress ?? "—"}
                    </TableCell>
                    <TableCell>{formatDateTime(c.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {clicks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No clicks
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
