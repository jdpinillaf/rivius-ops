export const dynamic = "force-dynamic";

import Link from "next/link";
import type { MessageChannel } from "@prisma/client";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConversationThread } from "@/components/conversation-thread";
import { ConversationsFilters } from "./filters";
import { formatDateTime, formatNumber } from "@/lib/formatting";
import {
  getConversations,
  getConversationKpis,
  type ConversationFilter,
} from "@/lib/queries/conversations";
import { getAllMerchantsDomains } from "@/lib/queries/merchants";

type Props = {
  searchParams: Promise<{
    merchantId?: string;
    channel?: string;
    filter?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 20;

export default async function ConversationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const [{ rows, total, pageCount }, kpis, merchants] = await Promise.all([
    getConversations({
      merchantId: params.merchantId,
      channel: params.channel as MessageChannel | undefined,
      filter: (params.filter as ConversationFilter) ?? "all",
      page,
      pageSize: PAGE_SIZE,
    }),
    getConversationKpis(),
    getAllMerchantsDomains(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversations"
        description={`${total} thread${total === 1 ? "" : "s"} matching filters`}
      >
        <ConversationsFilters merchants={merchants} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Total threads" value={formatNumber(kpis.total)} />
        <KpiCard
          label="Customer replied"
          value={formatNumber(kpis.withInbound)}
        />
        <KpiCard
          label="Resulted in review"
          value={formatNumber(kpis.withReview)}
        />
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No conversations with stored message bodies match filters.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((c) => {
            const contact = c.customerPhone ?? c.customerEmail;
            const name = c.customerName ?? contact;
            return (
              <Card key={c.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">{name}</CardTitle>
                    <p className="truncate text-xs text-muted-foreground">
                      <Link
                        href={`/merchants/${c.merchantId}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {c.merchant.shopDomain}
                      </Link>
                      {" · "}
                      {contact} · {c.productName ?? "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <StatusBadge status={c.channel} />
                    <StatusBadge status={c.status} />
                    {c.messageStatus && <StatusBadge status={c.messageStatus} />}
                    {c.review && (
                      <StatusBadge
                        status={`${c.review.rating}★ ${c.review.status}`}
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
                    <span>
                      Sent: {c.sentAt ? formatDateTime(c.sentAt) : "—"}
                    </span>
                    <span>
                      Last inbound:{" "}
                      {c.lastInboundAt ? formatDateTime(c.lastInboundAt) : "—"}
                    </span>
                  </div>
                  <ConversationThread conversation={c.conversation} />
                  {c.review?.comment && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs">
                      <span className="font-semibold">Final review: </span>
                      {c.review.comment}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {pageCount > 1 && <Pagination page={page} pageCount={pageCount} total={total} baseParams={params} />}
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  total,
  baseParams,
}: {
  page: number;
  pageCount: number;
  total: number;
  baseParams: Record<string, string | undefined>;
}) {
  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(baseParams)) {
      if (value !== undefined && key !== "page") params.set(key, value);
    }
    params.set("page", String(targetPage));
    return `?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        Page {page} of {pageCount} — {total} threads
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
        {page < pageCount && (
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
