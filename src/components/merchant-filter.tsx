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

export function MerchantFilter({ merchants }: { merchants: Merchant[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("merchantId") ?? "all";

  function onChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete("merchantId");
    } else {
      params.set("merchantId", value);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="All merchants" />
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
  );
}
