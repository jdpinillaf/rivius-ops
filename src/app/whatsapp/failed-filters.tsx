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
type CodeOption = { code: string; label: string };

type Props = {
  merchants: Merchant[];
  availableCodes: CodeOption[];
  selectedMerchantId?: string;
  selectedErrorCode?: string;
  from?: string;
  to?: string;
};

export function WhatsAppFailedFilters({
  merchants,
  availableCodes,
  selectedMerchantId,
  selectedErrorCode,
  from,
  to,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of ["failedMerchantId", "errorCode", "from", "to", "page"]) {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters =
    !!selectedMerchantId || !!selectedErrorCode || !!from || !!to;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-md border bg-muted/30 p-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Merchant</label>
        <Select
          value={selectedMerchantId ?? "all"}
          onValueChange={(v) => update("failedMerchantId", v)}
        >
          <SelectTrigger className="w-[200px]">
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
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Error Code</label>
        <Select
          value={selectedErrorCode ?? "all"}
          onValueChange={(v) => update("errorCode", v)}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All codes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All codes</SelectItem>
            {availableCodes
              .filter((c) => c.code !== "unknown")
              .map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="from" className="text-xs font-medium text-muted-foreground">
          From
        </label>
        <input
          id="from"
          type="date"
          defaultValue={from ?? ""}
          onChange={(e) => update("from", e.target.value || null)}
          className="h-9 rounded-md border px-3 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="to" className="text-xs font-medium text-muted-foreground">
          To
        </label>
        <input
          id="to"
          type="date"
          defaultValue={to ?? ""}
          onChange={(e) => update("to", e.target.value || null)}
          className="h-9 rounded-md border px-3 text-sm"
        />
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="h-9 rounded-md border px-3 text-sm text-muted-foreground hover:bg-muted"
        >
          Clear
        </button>
      )}
    </div>
  );
}
