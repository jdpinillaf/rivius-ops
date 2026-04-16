import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { MessageChannel } from "@prisma/client";

export type ConversationFilter = "all" | "with_inbound" | "with_review" | "no_review";

type Params = {
  merchantId?: string;
  channel?: MessageChannel;
  filter?: ConversationFilter;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
};

export async function getConversations(params: Params = {}) {
  const {
    merchantId,
    channel,
    filter = "all",
    from,
    to,
    page = 1,
    pageSize = 20,
  } = params;

  const where: Prisma.ReviewRequestWhereInput = {
    conversation: { not: Prisma.DbNull },
    ...(merchantId && { merchantId }),
    ...(channel && { channel }),
    ...((from || to) && {
      sentAt: {
        ...(from && { gte: from }),
        ...(to && { lte: to }),
      },
    }),
    ...(filter === "with_inbound" && { lastInboundAt: { not: null } }),
    ...(filter === "with_review" && { review: { is: {} } }),
    ...(filter === "no_review" && { review: { is: null } }),
  };

  const [total, rows, stats] = await Promise.all([
    prisma.reviewRequest.count({ where }),
    prisma.reviewRequest.findMany({
      where,
      orderBy: [{ lastInboundAt: "desc" }, { sentAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        merchantId: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        channel: true,
        status: true,
        productName: true,
        sentAt: true,
        lastInboundAt: true,
        messageStatus: true,
        conversation: true,
        merchant: { select: { shopDomain: true } },
        review: { select: { rating: true, comment: true, status: true } },
      },
    }),
    prisma.reviewRequest.groupBy({
      by: ["channel"],
      where: { conversation: { not: Prisma.DbNull } },
      _count: { _all: true },
    }),
  ]);

  return {
    rows,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    channelStats: stats,
  };
}

export async function getConversationKpis() {
  const base: Prisma.ReviewRequestWhereInput = {
    conversation: { not: Prisma.DbNull },
  };
  const [total, withInbound, withReview] = await Promise.all([
    prisma.reviewRequest.count({ where: base }),
    prisma.reviewRequest.count({
      where: { ...base, lastInboundAt: { not: null } },
    }),
    prisma.reviewRequest.count({
      where: { ...base, review: { is: {} } },
    }),
  ]);
  return { total, withInbound, withReview };
}
