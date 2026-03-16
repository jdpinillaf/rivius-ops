import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  // ReviewRequestStatus
  PENDING: "bg-yellow-100 text-yellow-700",
  SENT: "bg-blue-100 text-blue-700",
  RESPONDED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  // ReviewStatus
  PUBLISHED: "bg-green-100 text-green-700",
  HIDDEN: "bg-gray-100 text-gray-700",
  FLAGGED: "bg-orange-100 text-orange-700",
  // ErrorGroupStatus
  OPEN: "bg-red-100 text-red-700",
  RESOLVED: "bg-green-100 text-green-700",
  IGNORED: "bg-gray-100 text-gray-700",
  // CommissionStatus
  EARNED: "bg-green-100 text-green-700",
  PAID: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  // MessageChannel
  EMAIL: "bg-indigo-100 text-indigo-700",
  WHATSAPP: "bg-green-100 text-green-700",
  ALL: "bg-purple-100 text-purple-700",
  // Billed
  true: "bg-green-100 text-green-700",
  false: "bg-yellow-100 text-yellow-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusColors[status] ?? "bg-gray-100 text-gray-700"
      )}
    >
      {status}
    </span>
  );
}
