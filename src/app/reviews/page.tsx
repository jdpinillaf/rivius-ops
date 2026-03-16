import type { ReviewStatus } from "@prisma/client";
import { PageHeader } from "@/components/layout/page-header";
import { MerchantFilter } from "@/components/merchant-filter";
import { ReviewsTable } from "./reviews-table";
import { getReviews } from "@/lib/queries/reviews";
import { getAllMerchantsDomains } from "@/lib/queries/merchants";
import { subDays } from "date-fns";

type Props = {
  searchParams: Promise<{
    merchantId?: string;
    status?: string;
    rating?: string;
    days?: string;
  }>;
};

export default async function ReviewsPage({ searchParams }: Props) {
  const params = await searchParams;
  const days = params.days ? parseInt(params.days) : 7;

  const [reviews, merchants] = await Promise.all([
    getReviews({
      merchantId: params.merchantId,
      status: params.status as ReviewStatus | undefined,
      rating: params.rating ? parseInt(params.rating) : undefined,
      from: subDays(new Date(), days),
      to: new Date(),
    }),
    getAllMerchantsDomains(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description={`${reviews.length} reviews in last ${days} days`}
      >
        <MerchantFilter merchants={merchants} />
      </PageHeader>
      <ReviewsTable data={reviews} />
    </div>
  );
}
