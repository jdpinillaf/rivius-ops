"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { formatDateTime } from "@/lib/formatting";

type DuplicateRow = {
  requestId: string;
  merchantId: string;
  shopDomain: string;
  customerPhone: string | null;
  customerEmail: string | null;
  productName: string | null;
  sentAt: Date;
  usageCreatedAt: Date;
  secondsBetween: number;
};

function maskPhone(phone: string | null): string {
  if (!phone) return "—";
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 4)}…${phone.slice(-4)}`;
}

function maskEmail(email: string | null): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain || local.length < 2) return email;
  return `${local.slice(0, 2)}…@${domain}`;
}

const columns: ColumnDef<DuplicateRow>[] = [
  {
    accessorKey: "shopDomain",
    header: "Merchant",
    cell: ({ row }) => (
      <span className="font-medium text-sm">{row.original.shopDomain}</span>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm">{maskPhone(row.original.customerPhone)}</span>
        <span className="text-xs text-muted-foreground">{maskEmail(row.original.customerEmail)}</span>
      </div>
    ),
  },
  {
    accessorKey: "productName",
    header: "Product",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground max-w-[200px] truncate block">
        {row.original.productName ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "secondsBetween",
    header: "Gap",
    cell: ({ row }) => {
      const s = row.original.secondsBetween;
      const display = s < 60 ? `${s}s` : s < 3600 ? `${Math.round(s / 60)}m` : `${Math.round(s / 3600)}h`;
      const tone = s < 60 ? "text-amber-600" : s < 600 ? "text-orange-600" : "text-red-600";
      return <span className={`text-sm font-medium tabular-nums ${tone}`}>{display}</span>;
    },
  },
  {
    accessorKey: "usageCreatedAt",
    header: "First send",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{formatDateTime(row.original.usageCreatedAt)}</span>
    ),
  },
  {
    accessorKey: "sentAt",
    header: "Second send",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{formatDateTime(row.original.sentAt)}</span>
    ),
  },
];

export function DuplicatesTable({ data }: { data: DuplicateRow[] }) {
  return <DataTable columns={columns} data={data} />;
}
