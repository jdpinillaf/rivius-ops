import type { SubscriptionTier, ReviewRequestStatus, ReviewStatus, MessageChannel, CommissionStatus } from "@prisma/client";

export type KpiData = {
  label: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
};

export type MerchantRow = {
  id: string;
  shopDomain: string;
  plan: SubscriptionTier;
  contactEmail: string | null;
  createdAt: Date;
  _count: {
    reviews: number;
    reviewRequests: number;
  };
};

export type PlanDistribution = {
  plan: SubscriptionTier;
  _count: { _all: number };
};

export type ReviewTrendPoint = {
  date: string;
  count: number;
};

export type WhatsAppCostByCountry = {
  countryCode: string;
  totalCost: number;
  count: number;
};

export type ActivityEvent = {
  id: string;
  type: "merchant" | "review" | "subscription" | "request";
  description: string;
  createdAt: Date;
};

export type DateRange = {
  from: Date;
  to: Date;
};

export type PaginationParams = {
  page: number;
  pageSize: number;
};

export { SubscriptionTier, ReviewRequestStatus, ReviewStatus, MessageChannel, CommissionStatus };
