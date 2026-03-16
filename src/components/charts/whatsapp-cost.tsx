"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { COUNTRY_NAMES } from "@/lib/constants";

type CountryData = {
  countryCode: string;
  totalCost: number;
  count: number;
};

export function WhatsAppCostChart({ data }: { data: CountryData[] }) {
  const chartData = data.map((d) => ({
    country: COUNTRY_NAMES[d.countryCode] ?? d.countryCode,
    cost: d.totalCost,
    messages: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
        <XAxis type="number" tickFormatter={(v: number) => `$${v.toFixed(2)}`} />
        <YAxis type="category" dataKey="country" width={100} fontSize={12} />
        <Tooltip
          formatter={(value, name) => [
            name === "cost" ? `$${Number(value).toFixed(4)}` : value,
            name === "cost" ? "Cost" : "Messages",
          ]}
        />
        <Bar dataKey="cost" fill="#25d366" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
