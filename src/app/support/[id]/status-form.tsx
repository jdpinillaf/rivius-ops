"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type StatusFormProps = {
  id: string;
  currentStatus: string;
  currentNote: string;
};

export function StatusForm({ id, currentStatus, currentNote }: StatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState(currentNote);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setSaving(true);
    try {
      await fetch(`/api/support/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Status</label>
        <Select value={status} onValueChange={(v) => { if (v) setStatus(v); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="IGNORED">Ignored</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 space-y-1">
        <label className="text-sm text-muted-foreground">Note</label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
        />
      </div>
      <Button onClick={onSave} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
