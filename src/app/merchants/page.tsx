export const dynamic = "force-dynamic";

import Link from "next/link";
import type { SubscriptionTier } from "@prisma/client";
import { PageHeader } from "@/components/layout/page-header";
import { MerchantsTable } from "./merchants-table";
import { getMerchantsList } from "@/lib/queries/merchants";

type Props = {
  searchParams: Promise<{ plan?: string; search?: string; beta?: string }>;
};

export default async function MerchantsPage({ searchParams }: Props) {
  const params = await searchParams;
  const betaOnly = params.beta === "1";
  const merchants = await getMerchantsList({
    plan: params.plan as SubscriptionTier | undefined,
    search: params.search,
    betaOnly,
  });

  const baseQuery = new URLSearchParams();
  if (params.plan) baseQuery.set("plan", params.plan);
  if (params.search) baseQuery.set("search", params.search);

  const allQuery = new URLSearchParams(baseQuery);
  allQuery.delete("beta");
  const betaQuery = new URLSearchParams(baseQuery);
  betaQuery.set("beta", "1");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Merchants"
        description={`${merchants.length} merchants${betaOnly ? " with discount" : ""}`}
      />
      <div className="flex items-center gap-2">
        <Link
          href={`/merchants?${allQuery.toString()}`}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            betaOnly
              ? "bg-muted text-muted-foreground hover:bg-muted/80"
              : "bg-primary text-primary-foreground"
          }`}
        >
          All
        </Link>
        <Link
          href={`/merchants?${betaQuery.toString()}`}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            betaOnly
              ? "bg-emerald-600 text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          With discount
        </Link>
      </div>
      <MerchantsTable data={merchants} />
    </div>
  );
}
