import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ReviewStatus } from "@prisma/client";
import { subDays } from "date-fns";

export async function getReviews(filters?: {
  merchantId?: string;
  status?: ReviewStatus;
  rating?: number;
  from?: Date;
  to?: Date;
}) {
  const from = filters?.from ?? subDays(new Date(), 7);
  const to = filters?.to ?? new Date();

  const where: Prisma.ReviewWhereInput = {
    createdAt: { gte: from, lte: to },
    ...(filters?.merchantId && { merchantId: filters.merchantId }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.rating && { rating: filters.rating }),
  };

  return prisma.review.findMany({
    where,
    select: {
      id: true,
      customerName: true,
      customerEmail: true,
      productName: true,
      rating: true,
      status: true,
      pinned: true,
      createdAt: true,
      merchant: { select: { shopDomain: true } },
      media: { select: { type: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}
