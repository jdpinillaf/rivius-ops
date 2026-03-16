"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { PLAN_NAMES } from "@/lib/constants";
import type { SubscriptionTier } from "@prisma/client";

const COLORS: Record<string, string> = {
  FREE: "#9ca3af",
  STARTER: "#3b82f6",
  GROWTH: "#a855f7",
  SCALE: "#f59e0b",
};

type PlanData = {
  plan: SubscriptionTier;
  _count: { _all: number };
};

export function MrrChart({ data }: { data: PlanData[] }) {
  const chartData = data.map((d) => ({
    name: PLAN_NAMES[d.plan],
    count: d._count._all,
    plan: d.plan,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 60 }}>
        <XAxis type="number" />
        <YAxis type="category" dataKey="name" width={60} />
        <Tooltip />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.plan} fill={COLORS[entry.plan] ?? "#6b7280"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
