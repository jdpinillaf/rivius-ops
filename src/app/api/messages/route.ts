import { NextRequest, NextResponse } from "next/server";
import { upsertWhatsAppMessage } from "@/lib/queries/messages";

const KNOWN_KEYS = new Set([
  "rating_prompt",
  "comment_prompt",
  "media_prompt",
  "review_success",
  "next_product_yes",
  "next_product_no",
  "next_product_invalid",
  "next_product_offer",
  "abandoned",
  "discount_notification",
  "attribute_complete",
]);

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { key, body: messageBody } = body as { key: string; body: string };

  if (!key || typeof key !== "string" || !KNOWN_KEYS.has(key)) {
    return NextResponse.json(
      { ok: false, error: "Invalid message key" },
      { status: 400 }
    );
  }

  if (!messageBody || typeof messageBody !== "string") {
    return NextResponse.json(
      { ok: false, error: "Message body is required" },
      { status: 400 }
    );
  }

  await upsertWhatsAppMessage(key, messageBody);

  return NextResponse.json({ ok: true });
}
