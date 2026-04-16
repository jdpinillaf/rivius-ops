export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/layout/page-header";
import { getAllWhatsAppMessages } from "@/lib/queries/messages";
import { MessageEditor } from "./message-editor";

const MESSAGE_META: Record<
  string,
  { label: string; description: string; placeholders: string[] }
> = {
  rating_prompt: {
    label: "Calificacion",
    description: "Cuando el cliente debe dar estrellas",
    placeholders: [],
  },
  comment_prompt: {
    label: "Comentario",
    description: "Despues de la calificacion, pide comentario",
    placeholders: [],
  },
  media_prompt: {
    label: "Foto/Video",
    description: "Pide foto o video del producto",
    placeholders: [],
  },
  review_success: {
    label: "Resena exitosa",
    description: "Confirmacion de resena registrada",
    placeholders: [],
  },
  next_product_yes: {
    label: "Siguiente producto (Si)",
    description: "Cuando acepta resenar otro producto",
    placeholders: ["productName"],
  },
  next_product_no: {
    label: "Siguiente producto (No)",
    description: "Cuando rechaza resenar otro producto",
    placeholders: [],
  },
  next_product_invalid: {
    label: "Siguiente producto (Invalido)",
    description: "Cuando no responde si/no",
    placeholders: ["productName"],
  },
  next_product_offer: {
    label: "Ofrecer siguiente producto",
    description: "Ofrece resenar otro producto del pedido",
    placeholders: ["productName"],
  },
  abandoned: {
    label: "Conversacion abandonada",
    description: "Despues de 5 intentos fallidos",
    placeholders: [],
  },
  discount_notification: {
    label: "Descuento",
    description: "Envia codigo de descuento despues de resena",
    placeholders: ["valueLabel", "discountCode", "storeName", "storeUrl"],
  },
  attribute_complete: {
    label: "Atributos completos",
    description: "Cuando se recolectaron todos los atributos",
    placeholders: [],
  },
};

const DEFAULTS: Record<string, string> = {
  rating_prompt:
    "Escribe el numero de la opcion que desees. _Ejemplo: 5_\n\n\u00bfCuantas estrellas?\n5. \u2b50\u2b50\u2b50\u2b50\u2b50\n4. \u2b50\u2b50\u2b50\u2b50\n3. \u2b50\u2b50\u2b50\n2. \u2b50\u2b50\n1. \u2b50",
  comment_prompt:
    "\u00a1Gracias! \u00bfNos regalas un comentario sobre tu calificacion?\n\nPuedes escribirlo o enviar un mensaje de voz \ud83c\udfa4\n\n_Ejemplo: Excelente producto, 100% lo recomiendo_",
  media_prompt:
    "Queremos saber mas, compartenos una foto o video del producto que compraste \ud83d\udcf8\n\n\u00a1Recibe a cambio un cupon de descuento para tu proxima compra! \ud83c\udf81",
  review_success:
    "\u00a1Gracias! *Tu resena fue registrada* con exito \ud83d\udc4d",
  next_product_yes:
    "\u00a1Perfecto! Cuentanos como fue tu experiencia con *{{productName}}*\n\nEscribe el numero de la opcion que desees. _Ejemplo: 5_\n\n\u00bfCuantas estrellas?\n5. \u2b50\u2b50\u2b50\u2b50\u2b50\n4. \u2b50\u2b50\u2b50\u2b50\n3. \u2b50\u2b50\u2b50\n2. \u2b50\u2b50\n1. \u2b50",
  next_product_no: "Entendido. \u00a1Gracias por tu tiempo! \ud83d\ude4c",
  next_product_invalid:
    "Responde *si* o *no*. \u00bfQuieres dar tu opinion sobre *{{productName}}*?",
  next_product_offer:
    "Tu pedido tiene mas productos. \u00bfQuieres continuar con *{{productName}}*?\n\u2022 Si\n\u2022 No",
  abandoned:
    "Lo sentimos, no pudimos completar tu resena. Puedes intentar de nuevo mas tarde.",
  discount_notification:
    "Tu codigo de descuento por *{{valueLabel}}* es: *{{discountCode}}*\n\nUsalo en tu proxima compra en *{{storeName}}*: {{storeUrl}}\n\n\u00a1Gracias! \ud83c\udf89",
  attribute_complete: "Gracias, ya tenemos la informacion necesaria.",
};

const ALL_KEYS = Object.keys(MESSAGE_META);

export default async function MessagesPage() {
  const savedMessages = await getAllWhatsAppMessages();
  const savedMap = new Map(savedMessages.map((m: { key: string; body: string }) => [m.key, m.body]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mensajes WhatsApp"
        description="Editor de plantillas de mensajes de WhatsApp"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {ALL_KEYS.map((key) => {
          const meta = MESSAGE_META[key];
          const currentBody = savedMap.get(key) ?? DEFAULTS[key] ?? "";
          const defaultBody = DEFAULTS[key] ?? "";

          return (
            <MessageEditor
              key={key}
              messageKey={key}
              label={meta.label}
              description={meta.description}
              placeholders={meta.placeholders}
              currentBody={currentBody}
              defaultBody={defaultBody}
            />
          );
        })}
      </div>
    </div>
  );
}
