import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ReviewRequestStatus, MessageChannel } from "@prisma/client";
import { subDays } from "date-fns";

export async function getRequests(filters?: {
  merchantId?: string;
  status?: ReviewRequestStatus;
  channel?: MessageChannel;
  from?: Date;
  to?: Date;
}) {
  const from = filters?.from ?? subDays(new Date(), 7);
  const to = filters?.to ?? new Date();

  const where: Prisma.ReviewRequestWhereInput = {
    sentAt: { gte: from, lte: to },
    ...(filters?.merchantId && { merchantId: filters.merchantId }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.channel && { channel: filters.channel }),
  };

  return prisma.reviewRequest.findMany({
    where,
    select: {
      id: true,
      customerEmail: true,
      customerPhone: true,
      productName: true,
      channel: true,
      status: true,
      messageStatus: true,
      sentAt: true,
      respondedAt: true,
      error: true,
      merchant: { select: { shopDomain: true } },
    },
    orderBy: { sentAt: "desc" },
    take: 500,
  });
}
