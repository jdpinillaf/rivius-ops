"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/formatting";

const PERCENT_OPTIONS = [10, 25, 50, 75, 100] as const;
const MONTH_OPTIONS = [
  { value: "", label: "Forever" },
  { value: "1", label: "1 month" },
  { value: "3", label: "3 months" },
  { value: "6", label: "6 months" },
  { value: "12", label: "12 months" },
] as const;

type Props = {
  merchantId: string;
  current: {
    betaDiscountPercent: number | null;
    betaDiscountMonths: number | null;
    betaDiscountReason: string | null;
    betaDiscountAt: Date | null;
    betaDiscountBy: string | null;
  };
};

export function BetaDiscountCard({ merchantId, current }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [percent, setPercent] = useState<number>(current.betaDiscountPercent ?? 50);
  const [months, setMonths] = useState<string>(
    current.betaDiscountMonths !== null && current.betaDiscountMonths !== undefined
      ? String(current.betaDiscountMonths)
      : ""
  );
  const [reason, setReason] = useState<string>(current.betaDiscountReason ?? "");

  const isActive = current.betaDiscountPercent !== null;

  async function applyDiscount() {
    setError(null);
    const res = await fetch(`/api/merchants/${merchantId}/discount`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        percent,
        months: months === "" ? null : Number(months),
        reason,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Error applying discount");
      return;
    }
    startTransition(() => router.refresh());
  }

  async function removeDiscount() {
    if (!confirm("Remove discount for this merchant?")) return;
    setError(null);
    const res = await fetch(`/api/merchants/${merchantId}/discount`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Error removing discount");
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          Custom Discount
          {isActive && (
            <Badge variant="secondary" className="font-mono text-xs">
              {current.betaDiscountPercent}% off ·{" "}
              {current.betaDiscountMonths
                ? `${current.betaDiscountMonths} mo`
                : "forever"}
            </Badge>
          )}
        </CardTitle>
        {isActive && (
          <Button
            variant="destructive"
            size="sm"
            onClick={removeDiscount}
            disabled={pending}
          >
            Remove
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Apply a percentage discount to this merchant's next Shopify Billing charge.
          Works for any merchant (beta tester, partner, special case). The discount
          kicks in after the trial period and does not modify already-active subscriptions.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Percent</span>
            <select
              className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              disabled={pending}
            >
              {PERCENT_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}%
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Duration</span>
            <select
              className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              disabled={pending}
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Reason</span>
          <textarea
            className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            rows={2}
            placeholder="e.g. Beta tester, partner, churn save, manual promo"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={pending}
            maxLength={500}
          />
        </label>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <div className="flex items-center justify-between gap-2">
          <Button onClick={applyDiscount} disabled={pending}>
            {isActive ? "Update discount" : "Apply discount"}
          </Button>
          {isActive && current.betaDiscountAt && (
            <span className="text-xs text-muted-foreground">
              Granted by {current.betaDiscountBy ?? "?"} on{" "}
              {formatDateTime(current.betaDiscountAt)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
