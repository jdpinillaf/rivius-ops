import type { SubscriptionTier } from "@prisma/client";
import { PLAN_NAMES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const colorMap: Record<SubscriptionTier, string> = {
  FREE: "bg-gray-100 text-gray-700",
  STARTER: "bg-blue-100 text-blue-700",
  GROWTH: "bg-purple-100 text-purple-700",
  SCALE: "bg-amber-100 text-amber-700",
};

export function PlanBadge({ tier }: { tier: SubscriptionTier }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colorMap[tier]
      )}
    >
      {PLAN_NAMES[tier]}
    </span>
  );
}
