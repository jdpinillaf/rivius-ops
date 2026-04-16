import { prisma } from "@/lib/prisma";

export async function getAllWhatsAppMessages() {
  return prisma.whatsAppMessageTemplate.findMany({
    orderBy: { key: "asc" },
  });
}

export async function upsertWhatsAppMessage(key: string, body: string) {
  return prisma.whatsAppMessageTemplate.upsert({
    where: { key },
    update: { body },
    create: { key, body },
  });
}
