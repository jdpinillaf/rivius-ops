"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { PlanBadge } from "@/components/plan-badge";
import { formatDate, formatNumber } from "@/lib/formatting";
import type { SubscriptionTier } from "@prisma/client";

type MerchantRow = {
  id: string;
  shopDomain: string;
  plan: SubscriptionTier;
  contactEmail: string | null;
  createdAt: Date;
  _count: { reviews: number; reviewRequests: number };
};

const columns: ColumnDef<MerchantRow>[] = [
  {
    accessorKey: "shopDomain",
    header: "Domain",
    cell: ({ row }) => (
      <Link
        href={`/merchants/${row.original.id}`}
        className="font-medium text-blue-600 hover:underline"
      >
        {row.original.shopDomain}
      </Link>
    ),
  },
  {
    accessorKey: "plan",
    header: "Plan",
    cell: ({ row }) => <PlanBadge tier={row.original.plan} />,
  },
  {
    accessorKey: "contactEmail",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.contactEmail ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "_count.reviews",
    header: "Reviews",
    cell: ({ row }) => formatNumber(row.original._count.reviews),
  },
  {
    accessorKey: "_count.reviewRequests",
    header: "Requests",
    cell: ({ row }) => formatNumber(row.original._count.reviewRequests),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
];

export function MerchantsTable({ data }: { data: MerchantRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumn="shopDomain"
      searchPlaceholder="Search by domain..."
    />
  );
}
