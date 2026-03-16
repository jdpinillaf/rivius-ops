import type { ReviewRequestStatus, MessageChannel } from "@prisma/client";
import { PageHeader } from "@/components/layout/page-header";
import { MerchantFilter } from "@/components/merchant-filter";
import { RequestsTable } from "./requests-table";
import { getRequests } from "@/lib/queries/requests";
import { getAllMerchantsDomains } from "@/lib/queries/merchants";
import { subDays } from "date-fns";

type Props = {
  searchParams: Promise<{
    merchantId?: string;
    status?: string;
    channel?: string;
    days?: string;
  }>;
};

export default async function RequestsPage({ searchParams }: Props) {
  const params = await searchParams;
  const days = params.days ? parseInt(params.days) : 7;

  const [requests, merchants] = await Promise.all([
    getRequests({
      merchantId: params.merchantId,
      status: params.status as ReviewRequestStatus | undefined,
      channel: params.channel as MessageChannel | undefined,
      from: subDays(new Date(), days),
      to: new Date(),
    }),
    getAllMerchantsDomains(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Requests"
        description={`${requests.length} requests in last ${days} days`}
      >
        <MerchantFilter merchants={merchants} />
      </PageHeader>
      <RequestsTable data={requests} />
    </div>
  );
}
