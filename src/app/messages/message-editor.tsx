"use client";

import { useCallback, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw, Check, AlertCircle } from "lucide-react";

const PLACEHOLDER_SAMPLES: Record<string, string> = {
  productName: "Serum Vitamina C",
  valueLabel: "10%",
  discountCode: "GRACIAS10",
  storeName: "Mi Tienda",
  storeUrl: "https://mitienda.com",
};

type Props = {
  messageKey: string;
  label: string;
  description: string;
  placeholders: string[];
  currentBody: string;
  defaultBody: string;
};

function renderWhatsAppPreview(text: string): React.ReactNode[] {
  // Replace {{placeholder}} with highlighted chips
  const withPlaceholders = text.replace(
    /\{\{(\w+)\}\}/g,
    (_, name) => `\x00PH_START\x00${name}\x00PH_END\x00`
  );

  const lines = withPlaceholders.split("\n");

  return lines.map((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    // Split by placeholder markers
    const segments = line.split(/\x00PH_START\x00|\x00PH_END\x00/);

    let segIdx = 0;
    let remaining = line;

    // Re-parse to identify placeholders
    const tokens: { type: "text" | "placeholder"; value: string }[] = [];
    const phRegex = /\x00PH_START\x00(\w+)\x00PH_END\x00/g;
    let lastIndex = 0;
    let match;

    while ((match = phRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({ type: "text", value: line.slice(lastIndex, match.index) });
      }
      tokens.push({ type: "placeholder", value: match[1] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) {
      tokens.push({ type: "text", value: line.slice(lastIndex) });
    }
    if (tokens.length === 0) {
      tokens.push({ type: "text", value: "" });
    }

    tokens.forEach((token, tokIdx) => {
      if (token.type === "placeholder") {
        parts.push(
          <span
            key={`${lineIdx}-${tokIdx}`}
            className="inline-block rounded bg-emerald-200 px-1.5 py-0.5 text-xs font-medium text-emerald-800"
          >
            {PLACEHOLDER_SAMPLES[token.value] ?? token.value}
          </span>
        );
      } else {
        // Parse WhatsApp formatting: *bold*, _italic_, ~strikethrough~
        parts.push(
          <span key={`${lineIdx}-${tokIdx}`}>
            {parseWhatsAppFormatting(token.value)}
          </span>
        );
      }
    });

    return (
      <span key={lineIdx}>
        {parts}
        {lineIdx < lines.length - 1 && <br />}
      </span>
    );
  });
}

function parseWhatsAppFormatting(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  // Combined regex for *bold*, _italic_, ~strikethrough~
  const regex = /(\*([^*]+)\*)|(_([^_]+)_)|(~([^~]+)~)/g;
  let lastIndex = 0;
  let match;
  let keyIdx = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // *bold*
      result.push(
        <strong key={keyIdx++} className="font-semibold">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // _italic_
      result.push(
        <em key={keyIdx++} className="italic">
          {match[4]}
        </em>
      );
    } else if (match[5]) {
      // ~strikethrough~
      result.push(
        <s key={keyIdx++} className="line-through">
          {match[6]}
        </s>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  if (result.length === 0) {
    result.push(text);
  }

  return result;
}

export function MessageEditor({
  messageKey,
  label,
  description,
  placeholders,
  currentBody,
  defaultBody,
}: Props) {
  const [body, setBody] = useState(currentBody);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDirty = body !== currentBody;
  const isDefault = body === defaultBody;

  const handleSave = useCallback(async () => {
    setStatus("saving");
    setErrorMessage("");

    try {
      const res = await fetch("/api/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: messageKey, body }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Unknown error");
    }
  }, [messageKey, body]);

  const handleReset = useCallback(() => {
    setBody(defaultBody);
    setStatus("idle");
    setErrorMessage("");
  }, [defaultBody]);

  const insertPlaceholder = useCallback(
    (placeholder: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const insertion = `{{${placeholder}}}`;
      const newBody =
        body.slice(0, start) + insertion + body.slice(end);

      setBody(newBody);

      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        textarea.focus();
        const newPos = start + insertion.length;
        textarea.setSelectionRange(newPos, newPos);
      });
    },
    [body]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="font-mono text-xs rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
            {messageKey}
          </span>
          <span>{label}</span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Editor column */}
          <div className="space-y-3">
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (status === "saved" || status === "error") setStatus("idle");
              }}
              rows={8}
              className="w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-y font-mono leading-relaxed"
            />

            {/* Placeholder chips */}
            {placeholders.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-muted-foreground self-center">
                  Placeholders:
                </span>
                {placeholders.map((ph) => (
                  <button
                    key={ph}
                    type="button"
                    onClick={() => insertPlaceholder(ph)}
                    className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100 cursor-pointer"
                  >
                    {`{{${ph}}}`}
                  </button>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={!isDirty || status === "saving"}
                size="sm"
              >
                {status === "saving" ? (
                  <>Guardando...</>
                ) : status === "saved" ? (
                  <>
                    <Check data-icon="inline-start" className="h-3.5 w-3.5" />
                    Guardado
                  </>
                ) : (
                  <>
                    <Save data-icon="inline-start" className="h-3.5 w-3.5" />
                    Guardar
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isDefault}
              >
                <RotateCcw data-icon="inline-start" className="h-3.5 w-3.5" />
                Restaurar
              </Button>
            </div>

            {/* Status feedback */}
            {status === "error" && (
              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {errorMessage}
              </div>
            )}

            {status === "saved" && (
              <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                <Check className="h-3.5 w-3.5 flex-shrink-0" />
                Mensaje guardado correctamente
              </div>
            )}
          </div>

          {/* Preview column */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Vista previa</p>
            <div className="rounded-lg bg-[#e5ddd5] p-3">
              <div className="ml-auto max-w-[85%] rounded-lg bg-[#dcf8c6] px-3 py-2 text-sm leading-relaxed shadow-sm">
                {renderWhatsAppPreview(body)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
