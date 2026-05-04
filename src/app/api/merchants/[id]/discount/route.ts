import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

const ALLOWED_PERCENTS = new Set([10, 25, 50, 75, 100]);
const ALLOWED_MONTHS = new Set([1, 3, 6, 12]);

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let body: { percent?: number; months?: number | null; reason?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const percent = Number(body.percent);
  if (!Number.isInteger(percent) || !ALLOWED_PERCENTS.has(percent)) {
    return NextResponse.json(
      { ok: false, error: "percent must be one of 10, 25, 50, 75, 100" },
      { status: 400 }
    );
  }

  let months: number | null = null;
  if (body.months !== null && body.months !== undefined) {
    const m = Number(body.months);
    if (!Number.isInteger(m) || !ALLOWED_MONTHS.has(m)) {
      return NextResponse.json(
        { ok: false, error: "months must be one of 1, 3, 6, 12 or null (forever)" },
        { status: 400 }
      );
    }
    months = m;
  }

  const reason = (body.reason ?? "").toString().trim().slice(0, 500) || null;

  const merchant = await prisma.merchant.findUnique({ where: { id }, select: { id: true } });
  if (!merchant) {
    return NextResponse.json({ ok: false, error: "Merchant not found" }, { status: 404 });
  }

  // Use $executeRaw to avoid Prisma's default RETURNING clause, which would
  // try to read columns declared in the schema but not present in the shared DB
  // (e.g. referralCode). Schema drift is acceptable here — rivius-ops schema is
  // a superset that also covers ShopifyApp, and not all columns are migrated.
  await prisma.merchant.update({
    where: { id },
    data: {
      betaDiscountPercent: percent,
      betaDiscountMonths: months,
      betaDiscountReason: reason,
      betaDiscountAt: new Date(),
      betaDiscountBy: "ops-admin",
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const merchant = await prisma.merchant.findUnique({ where: { id }, select: { id: true } });
  if (!merchant) {
    return NextResponse.json({ ok: false, error: "Merchant not found" }, { status: 404 });
  }

  await prisma.merchant.update({
    where: { id },
    data: {
      betaDiscountPercent: null,
      betaDiscountMonths: null,
      betaDiscountReason: null,
      betaDiscountAt: null,
      betaDiscountBy: null,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true });
}
