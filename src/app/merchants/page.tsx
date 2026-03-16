export const dynamic = "force-dynamic";

import Link from "next/link";
import type { SubscriptionTier } from "@prisma/client";
import { PageHeader } from "@/components/layout/page-header";
import { MerchantsTable } from "./merchants-table";
import { getMerchantsList } from "@/lib/queries/merchants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  searchParams: Promise<{ plan?: string; search?: string }>;
};

export default async function MerchantsPage({ searchParams }: Props) {
  const params = await searchParams;
  const merchants = await getMerchantsList({
    plan: params.plan as SubscriptionTier | undefined,
    search: params.search,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Merchants"
        description={`${merchants.length} merchants total`}
      />
      <MerchantsTable data={merchants} />
    </div>
  );
}
