import type { SubscriptionTier } from "@prisma/client";

export const PLAN_PRICES: Record<SubscriptionTier, number> = {
  FREE: 0,
  STARTER: 9,
  GROWTH: 39,
  SCALE: 99,
};

export const PLAN_NAMES: Record<SubscriptionTier, string> = {
  FREE: "Free",
  STARTER: "Starter",
  GROWTH: "Pro",
  SCALE: "Elite",
};

export const PLAN_COLORS: Record<SubscriptionTier, string> = {
  FREE: "gray",
  STARTER: "blue",
  GROWTH: "purple",
  SCALE: "amber",
};

export const PLAN_LIMITS: Record<SubscriptionTier, number> = {
  FREE: 50,
  STARTER: 200,
  GROWTH: 1000,
  SCALE: 5000,
};

export const WHATSAPP_COUNTRY_PRICES: Record<string, number> = {
  MX: 0.06,
  CO: 0.04,
  AR: 0.05,
  CL: 0.06,
  PE: 0.04,
  ES: 0.07,
  US: 0.05,
  BR: 0.05,
  EC: 0.05,
  BO: 0.04,
  PY: 0.04,
  UY: 0.05,
  VE: 0.05,
  PA: 0.05,
  CR: 0.05,
  GT: 0.04,
  HN: 0.04,
  DO: 0.05,
};

export const WHATSAPP_DEFAULT_PRICE = 0.06;

export const COUNTRY_NAMES: Record<string, string> = {
  MX: "Mexico",
  CO: "Colombia",
  AR: "Argentina",
  CL: "Chile",
  PE: "Peru",
  ES: "Spain",
  US: "United States",
  BR: "Brazil",
  EC: "Ecuador",
  BO: "Bolivia",
  PY: "Paraguay",
  UY: "Uruguay",
  VE: "Venezuela",
  PA: "Panama",
  CR: "Costa Rica",
  GT: "Guatemala",
  HN: "Honduras",
  DO: "Dominican Republic",
};
