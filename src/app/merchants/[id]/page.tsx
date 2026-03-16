export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { PlanBadge } from "@/components/plan-badge";
import { StatusBadge } from "@/components/status-badge";
import { KpiCard } from "@/components/kpi-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
} from "@/lib/formatting";
import { PLAN_NAMES } from "@/lib/constants";
import {
  getMerchantDetail,
  getMerchantReviewStats,
  getMerchantReviews,
  getMerchantRequestStats,
  getMerchantRequests,
  getMerchantWhatsApp,
  getMerchantAttribution,
  getMerchantAffiliate,
} from "@/lib/queries/merchants";

type Props = { params: Promise<{ id: string }> };

export default async function MerchantDetailPage({ params }: Props) {
  const { id } = await params;
  const merchant = await getMerchantDetail(id);
  if (!merchant) notFound();

  const [reviewStats, reviews, requestStats, requests, whatsapp, attribution, affiliate] =
    await Promise.all([
      getMerchantReviewStats(id),
      getMerchantReviews(id),
      getMerchantRequestStats(id),
      getMerchantRequests(id),
      getMerchantWhatsApp(id),
      getMerchantAttribution(id),
      getMerchantAffiliate(id),
    ]);

  const trialActive = merchant.trialEndsAt && merchant.trialEndsAt > new Date();

  return (
    <div className="space-y-6">
      <PageHeader title={merchant.shopDomain} />

      {/* Info Card */}
      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Plan</p>
            <PlanBadge tier={merchant.plan} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{merchant.contactEmail ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Trial</p>
            <p className="text-sm font-medium">
              {trialActive
                ? `Ends ${formatDate(merchant.trialEndsAt!)}`
                : "No active trial"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="text-sm font-medium">{formatDate(merchant.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="subscriptions">
        <TabsList>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
          <TabsTrigger value="affiliate">Affiliate</TabsTrigger>
        </TabsList>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Shopify Sub ID</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {merchant.subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <PlanBadge tier={sub.tier} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={sub.active ? "Active" : "Inactive"} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {sub.shopifySubscriptionId ?? "—"}
                    </TableCell>
                    <TableCell>{formatDate(sub.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {merchant.subscriptions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No subscriptions
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {reviewStats.byStatus.map((s) => (
              <KpiCard
                key={s.status}
                label={s.status}
                value={formatNumber(s._count._all)}
              />
            ))}
            <KpiCard
              label="Avg Rating"
              value={reviewStats.avgRating.toFixed(1)}
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{r.customerName ?? r.customerEmail}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {r.productName}
                    </TableCell>
                    <TableCell>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-sm">
                      {r.media.length > 0 ? `${r.media.length} files` : "—"}
                    </TableCell>
                    <TableCell>{formatDate(r.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {requestStats.byStatus.map((s) => (
              <KpiCard key={s.status} label={s.status} value={formatNumber(s._count._all)} />
            ))}
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{r.customerEmail}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {r.productName ?? "—"}
                    </TableCell>
                    <TableCell><StatusBadge status={r.channel} /></TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell>{r.sentAt ? formatDateTime(r.sentAt) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard label="Total Messages" value={formatNumber(whatsapp.totalMessages)} />
            <KpiCard label="Total Cost" value={formatCurrency(whatsapp.totalCost)} />
            <KpiCard label="Unbilled" value={formatNumber(whatsapp.unbilledCount)} />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Message SID</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Billed</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {whatsapp.records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">
                      {r.messageSid ?? "—"}
                    </TableCell>
                    <TableCell>{r.countryCode ?? "—"}</TableCell>
                    <TableCell>{formatCurrency(Number(r.costPerMessage))}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.billed ? "Billed" : "Pending"} />
                    </TableCell>
                    <TableCell>{formatDateTime(r.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Attribution Tab */}
        <TabsContent value="attribution" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Clicks" value={formatNumber(attribution.clicksCount)} />
            <KpiCard label="Sales" value={formatNumber(attribution.salesCount)} />
            <KpiCard label="Conversion" value={formatPercent(attribution.conversionRate)} />
            <KpiCard label="Revenue" value={formatCurrency(attribution.totalRevenue)} />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Minutes</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attribution.recentSales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.orderName ?? s.orderId}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
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
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Affiliate Tab */}
        <TabsContent value="affiliate" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Referral Code</p>
              <p className="font-mono text-lg font-medium">
                {affiliate?.referralCode ?? "No referral code"}
              </p>
            </CardContent>
          </Card>
          {affiliate?.referralsMade && affiliate.referralsMade.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referee</TableHead>
                    <TableHead>Converted</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliate.referralsMade.map((ref) => (
                    <TableRow key={ref.id}>
                      <TableCell>{ref.refereeShopDomain ?? "—"}</TableCell>
                      <TableCell>
                        {ref.convertedAt ? formatDate(ref.convertedAt) : "Pending"}
                      </TableCell>
                      <TableCell>
                        {ref.commission
                          ? formatCurrency(ref.commission.amountCents / 100)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {ref.commission ? (
                          <StatusBadge status={ref.commission.status} />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
