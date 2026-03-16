"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/formatting";
import { Image, Video, Mic, Pin } from "lucide-react";
import type { ReviewStatus, MediaType } from "@prisma/client";

type ReviewRow = {
  id: string;
  customerName: string | null;
  customerEmail: string;
  productName: string;
  rating: number;
  status: ReviewStatus;
  pinned: boolean;
  createdAt: Date;
  media: { type: MediaType }[];
  merchant: { shopDomain: string };
};

const columns: ColumnDef<ReviewRow>[] = [
  {
    accessorKey: "merchant.shopDomain",
    header: "Merchant",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.merchant.shopDomain}</span>
    ),
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.customerName ?? row.original.customerEmail}
      </span>
    ),
  },
  {
    accessorKey: "productName",
    header: "Product",
    cell: ({ row }) => (
      <span className="max-w-[180px] truncate text-sm">
        {row.original.productName}
      </span>
    ),
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => (
      <span className="text-amber-500">
        {"★".repeat(row.original.rating)}
        {"☆".repeat(5 - row.original.rating)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "media",
    header: "Media",
    cell: ({ row }) => {
      const media = row.original.media;
      if (media.length === 0) return "—";
      const hasImage = media.some((m) => m.type === "IMAGE");
      const hasVideo = media.some((m) => m.type === "VIDEO");
      const hasAudio = media.some((m) => m.type === "AUDIO");
      return (
        <div className="flex gap-1">
          {hasImage && <Image className="h-3.5 w-3.5 text-muted-foreground" />}
          {hasVideo && <Video className="h-3.5 w-3.5 text-muted-foreground" />}
          {hasAudio && <Mic className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      );
    },
  },
  {
    accessorKey: "pinned",
    header: "Pinned",
    cell: ({ row }) =>
      row.original.pinned ? (
        <Pin className="h-3.5 w-3.5 text-amber-500" />
      ) : null,
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
];

export function ReviewsTable({ data }: { data: ReviewRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumn="customerName"
      searchPlaceholder="Search by customer..."
      defaultPageSize={50}
    />
  );
}
