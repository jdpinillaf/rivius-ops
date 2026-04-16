"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Merchant = { id: string; shopDomain: string };

const CHANNEL_OPTIONS = [
  { value: "all", label: "All channels" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "Email" },
  { value: "ALL", label: "All (dual)" },
] as const;

const FILTER_OPTIONS = [
  { value: "all", label: "All threads" },
  { value: "with_inbound", label: "Customer replied" },
  { value: "with_review", label: "Resulted in review" },
  { value: "no_review", label: "No review yet" },
] as const;

export function ConversationsFilters({ merchants }: { merchants: Merchant[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const merchantId = searchParams.get("merchantId") ?? "all";
  const channel = searchParams.get("channel") ?? "all";
  const filter = searchParams.get("filter") ?? "all";

  const merchantLabel =
    merchantId === "all"
      ? "All merchants"
      : merchants.find((m) => m.id === merchantId)?.shopDomain ?? "All merchants";
  const channelLabel =
    CHANNEL_OPTIONS.find((o) => o.value === channel)?.label ?? "All channels";
  const filterLabel =
    FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? "All threads";

  function update(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={merchantId} onValueChange={(v) => update("merchantId", v)}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder={merchantLabel}>{merchantLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All merchants</SelectItem>
          {merchants.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.shopDomain}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={channel} onValueChange={(v) => update("channel", v)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={channelLabel}>{channelLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {CHANNEL_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filter} onValueChange={(v) => update("filter", v)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={filterLabel}>{filterLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {FILTER_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
