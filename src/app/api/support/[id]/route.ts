import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ErrorGroupStatus } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { status, note } = body as { status: ErrorGroupStatus; note?: string };

  const data: Record<string, unknown> = { status };
  if (note !== undefined) data.note = note;
  if (status === "RESOLVED") data.resolvedAt = new Date();

  await prisma.errorGroup.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true });
}
