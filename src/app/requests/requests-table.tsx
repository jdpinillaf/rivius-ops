"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/formatting";
import type { ReviewRequestStatus, MessageChannel } from "@prisma/client";

type RequestRow = {
  id: string;
  customerEmail: string;
  customerPhone: string | null;
  productName: string | null;
  channel: MessageChannel;
  status: ReviewRequestStatus;
  messageStatus: string | null;
  sentAt: Date | null;
  respondedAt: Date | null;
  error: string | null;
  merchant: { shopDomain: string };
};

const columns: ColumnDef<RequestRow>[] = [
  {
    accessorKey: "merchant.shopDomain",
    header: "Merchant",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.merchant.shopDomain}</span>
    ),
  },
  {
    accessorKey: "customerEmail",
    header: "Customer",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.customerEmail}</span>
    ),
  },
  {
    accessorKey: "productName",
    header: "Product",
    cell: ({ row }) => (
      <span className="max-w-[180px] truncate text-sm">
        {row.original.productName ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "channel",
    header: "Channel",
    cell: ({ row }) => <StatusBadge status={row.original.channel} />,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "messageStatus",
    header: "Msg Status",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.messageStatus ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "sentAt",
    header: "Sent",
    cell: ({ row }) =>
      row.original.sentAt ? formatDateTime(row.original.sentAt) : "—",
  },
  {
    accessorKey: "error",
    header: "Error",
    cell: ({ row }) => (
      <span className="max-w-[150px] truncate text-xs text-red-600">
        {row.original.error ?? "—"}
      </span>
    ),
  },
];

export function RequestsTable({ data }: { data: RequestRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumn="customerEmail"
      searchPlaceholder="Search by email..."
      defaultPageSize={50}
    />
  );
}
