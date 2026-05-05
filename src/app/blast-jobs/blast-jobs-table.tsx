"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/formatting";
import type { BlastJobStatus, MessageChannel } from "@prisma/client";

type BlastJobRow = {
  id: string;
  status: BlastJobStatus;
  channel: MessageChannel;
  sent: number;
  failed: number;
  total: number;
  limit: number | null;
  error: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  merchant: { shopDomain: string; plan: string };
};

const columns: ColumnDef<BlastJobRow>[] = [
  {
    accessorKey: "merchant.shopDomain",
    header: "Merchant",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-sm">{row.original.merchant.shopDomain}</span>
        <span className="text-xs text-muted-foreground">{row.original.merchant.plan}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "channel",
    header: "Channel",
    cell: ({ row }) => <StatusBadge status={row.original.channel} />,
  },
  {
    id: "progress",
    header: "Progress",
    cell: ({ row }) => {
      const { sent, failed, total } = row.original;
      const processed = sent + failed;
      const pct = total > 0 ? Math.round((processed / total) * 100) : 0;
      return (
        <div className="flex flex-col gap-1 min-w-[140px]">
          <div className="flex justify-between text-xs">
            <span className="font-medium">{processed} / {total}</span>
            <span className="text-muted-foreground">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-emerald-400"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "sent",
    header: "Sent",
    cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.sent}</span>,
  },
  {
    accessorKey: "failed",
    header: "Failed",
    cell: ({ row }) => (
      <span className={`text-sm tabular-nums ${row.original.failed > 0 ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
        {row.original.failed}
      </span>
    ),
  },
  {
    accessorKey: "error",
    header: "Error",
    cell: ({ row }) => (
      row.original.error ? (
        <span className="text-xs text-red-600 max-w-[300px] truncate block" title={row.original.error}>
          {row.original.error}
        </span>
      ) : <span className="text-xs text-muted-foreground">—</span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>
    ),
  },
  {
    accessorKey: "completedAt",
    header: "Completed",
    cell: ({ row }) => (
      row.original.completedAt
        ? <span className="text-xs text-muted-foreground">{formatDateTime(row.original.completedAt)}</span>
        : <span className="text-xs text-muted-foreground">—</span>
    ),
  },
];

export function BlastJobsTable({ data }: { data: BlastJobRow[] }) {
  return <DataTable columns={columns} data={data} />;
}
