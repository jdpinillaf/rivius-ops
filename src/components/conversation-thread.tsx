import { cn } from "@/lib/utils";

type Media = {
  url: string;
  contentType?: string;
  fileName?: string;
  type?: "audio" | "image" | "video";
  transcript?: string;
  caption?: string;
};

type Message = {
  id?: string;
  role: "user" | "assistant" | "system";
  text?: string;
  media?: Media[];
};

type Conversation = {
  messages?: Message[];
  state?: string;
  attempts?: number;
};

function parseConversation(raw: unknown): Conversation {
  if (!raw || typeof raw !== "object") return {};
  return raw as Conversation;
}

function MediaItem({ media }: { media: Media }) {
  const kind =
    media.type ??
    (media.contentType?.startsWith("image/")
      ? "image"
      : media.contentType?.startsWith("audio/")
        ? "audio"
        : media.contentType?.startsWith("video/")
          ? "video"
          : undefined);

  if (kind === "image") {
    return (
      <a href={media.url} target="_blank" rel="noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.url}
          alt={media.caption ?? media.fileName ?? "image"}
          className="mt-2 max-h-40 rounded-md border border-black/10 object-cover"
        />
      </a>
    );
  }

  if (kind === "audio") {
    return (
      <div className="mt-2 space-y-1">
        <audio controls src={media.url} className="h-8 w-full" />
        {media.transcript && (
          <p className="text-[11px] italic text-muted-foreground">
            “{media.transcript}”
          </p>
        )}
      </div>
    );
  }

  if (kind === "video") {
    return (
      <video
        controls
        src={media.url}
        className="mt-2 max-h-52 w-full rounded-md border border-black/10"
      />
    );
  }

  return (
    <a
      href={media.url}
      target="_blank"
      rel="noreferrer"
      className="mt-2 block text-xs text-blue-600 underline"
    >
      {media.fileName ?? media.contentType ?? "Attachment"}
    </a>
  );
}

function Bubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="my-2 flex justify-center">
        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {message.text ?? "system"}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex", isUser ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
          isUser
            ? "bg-white border border-black/10 text-black"
            : "bg-emerald-500 text-white"
        )}
      >
        <div className="mb-1 text-[10px] uppercase tracking-wide opacity-70">
          {isUser ? "Customer" : "Rivius"}
        </div>
        {message.text && (
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        )}
        {message.media?.map((m, i) => (
          <MediaItem key={`${message.id ?? "m"}-${i}`} media={m} />
        ))}
      </div>
    </div>
  );
}

export function ConversationThread({ conversation }: { conversation: unknown }) {
  const parsed = parseConversation(conversation);
  const messages = parsed.messages ?? [];

  if (messages.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No messages in thread.</p>
    );
  }

  return (
    <div className="space-y-2 rounded-lg bg-black/[0.02] p-3">
      {messages.map((msg, i) => (
        <Bubble key={msg.id ?? `msg-${i}`} message={msg} />
      ))}
      {(parsed.state || parsed.attempts) && (
        <div className="flex gap-2 pt-2 text-[10px] text-muted-foreground">
          {parsed.state && <span>state: {parsed.state}</span>}
          {parsed.attempts !== undefined && (
            <span>attempts: {parsed.attempts}</span>
          )}
        </div>
      )}
    </div>
  );
}
