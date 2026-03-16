import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDateTime, formatRelative, formatNumber } from "@/lib/formatting";
import { getErrorGroupDetail } from "@/lib/queries/support";
import { StatusForm } from "./status-form";

type Props = { params: Promise<{ id: string }> };

export default async function SupportDetailPage({ params }: Props) {
  const { id } = await params;
  const group = await getErrorGroupDetail(id);
  if (!group) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={group.source} description={`Error group ${group.id}`} />

      {/* Group info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Error Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Source</p>
            <p className="text-sm font-medium">{group.source}</p>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-muted-foreground">Message</p>
            <p className="text-sm font-medium break-all">{group.message}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <StatusBadge status={group.status} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Count</p>
            <p className="text-sm font-medium">{formatNumber(group.count)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">First Seen</p>
            <p className="text-sm font-medium">{formatDate(group.firstSeenAt)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Seen</p>
            <p className="text-sm font-medium">{formatRelative(group.lastSeenAt)}</p>
          </div>
          {group.resolvedAt && (
            <div>
              <p className="text-sm text-muted-foreground">Resolved At</p>
              <p className="text-sm font-medium">{formatDateTime(group.resolvedAt)}</p>
            </div>
          )}
          {group.note && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-sm text-muted-foreground">Note</p>
              <p className="text-sm font-medium">{group.note}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status update form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Update Status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusForm
            id={group.id}
            currentStatus={group.status}
            currentNote={group.note ?? ""}
          />
        </CardContent>
      </Card>

      {/* Occurrences table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Occurrences ({group.occurrences.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Stack Trace</TableHead>
                  <TableHead>Metadata</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.occurrences.map((occ) => (
                  <TableRow key={occ.id}>
                    <TableCell className="text-sm">
                      {occ.merchant?.shopDomain ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[400px] truncate text-xs font-mono">
                      {occ.stackTrace ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs">
                      {occ.metadata ? JSON.stringify(occ.metadata) : "—"}
                    </TableCell>
                    <TableCell>{formatDateTime(occ.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {group.occurrences.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No occurrences
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
