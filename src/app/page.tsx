import {
  Users,
  DollarSign,
  Star,
  Send,
  MessageCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/kpi-card";
import { MrrChart } from "@/components/charts/mrr-chart";
import { ReviewsTrendChart } from "@/components/charts/reviews-trend";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatNumber, formatRelative } from "@/lib/formatting";
import {
  getOverviewKpis,
  getReviewsTrend,
  getRecentActivity,
} from "@/lib/queries/overview";

export default async function OverviewPage() {
  const [kpis, trend, activity] = await Promise.all([
    getOverviewKpis(),
    getReviewsTrend(),
    getRecentActivity(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="System-wide operational metrics" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Merchants"
          value={formatNumber(kpis.totalMerchants)}
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          label="MRR"
          value={formatCurrency(kpis.mrr)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KpiCard
          label="Reviews This Month"
          value={formatNumber(kpis.reviewsThisMonth)}
          icon={<Star className="h-4 w-4" />}
        />
        <KpiCard
          label="Requests Sent This Month"
          value={formatNumber(kpis.requestsThisMonth)}
          icon={<Send className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="WhatsApp Messages Today"
          value={formatNumber(kpis.whatsappMessagesToday)}
          icon={<MessageCircle className="h-4 w-4" />}
        />
        <KpiCard
          label="WhatsApp Cost Today"
          value={formatCurrency(kpis.whatsappCostToday)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KpiCard
          label="Active Trials"
          value={formatNumber(kpis.activeTrials)}
          icon={<Clock className="h-4 w-4" />}
        />
        <KpiCard
          label="Failed Requests Today"
          value={formatNumber(kpis.failedRequestsToday)}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Merchants by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <MrrChart data={kpis.planDistribution} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reviews Trend (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewsTrendChart data={trend} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activity.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={event.type} />
                  <span className="text-sm">{event.description}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatRelative(event.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
