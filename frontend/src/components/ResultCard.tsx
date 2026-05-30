"use client";

import { Calendar, Copy, Database, Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn, severityColor } from "@/lib/utils";
import type { LeakRecord } from "@/types";

// Fields we render first, in this order, with friendly labels.
const PRIMARY: { key: string; label: string; secret?: boolean }[] = [
  { key: "email", label: "Email" },
  { key: "username", label: "Username" },
  { key: "password", label: "Password", secret: true },
  { key: "hash", label: "Hash", secret: true },
  { key: "salt", label: "Salt", secret: true },
  { key: "name", label: "Name" },
  { key: "lastip", label: "Last IP" },
  { key: "ip", label: "IP" },
  { key: "phone", label: "Phone" },
  { key: "address", label: "Address" },
];

const HIDDEN_KEYS = new Set(["source"]);

function FieldRow({
  label,
  value,
  secret,
}: {
  label: string;
  value: string;
  secret?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const show = !secret || revealed;

  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="w-24 shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <code
          className={cn(
            "min-w-0 break-all font-mono text-sm",
            secret && "text-red-300",
            !show && "select-none blur-[5px]"
          )}
        >
          {show ? value : "•••••••••••"}
        </code>
        {secret && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            title={revealed ? "Hide" : "Reveal"}
          >
            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(value)}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          title="Copy"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function ResultCard({ record }: { record: LeakRecord }) {
  const fields = record.fields as Record<string, unknown>;

  const primaryRows = PRIMARY.filter((f) => fields[f.key]).map((f) => ({
    ...f,
    value: String(fields[f.key]),
  }));
  const shownKeys = new Set(primaryRows.map((r) => r.key));
  const extraRows = Object.entries(fields)
    .filter(([k, v]) => !shownKeys.has(k) && !HIDDEN_KEYS.has(k) && v != null && v !== "")
    .map(([k, v]) => ({ key: k, label: k.replace(/_/g, " "), value: String(v) }));

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b bg-card/60 px-4 py-3">
        <span className={cn("h-2 w-2 rounded-full", dotColor(record.severity))} />
        <Database className="h-4 w-4 text-muted-foreground" />
        <h3 className="mr-1 truncate font-medium">{record.database_label}</h3>
        <Badge className={cn(severityColor(record.severity))}>{record.severity}</Badge>
        {record.has_password && (
          <Badge className="gap-1 border-red-700/50 bg-red-900/40 text-red-300">
            <KeyRound className="h-3 w-3" /> credentials
          </Badge>
        )}
        <Badge className="border-border bg-secondary text-muted-foreground">
          {record.provider}
        </Badge>
        {record.breach_date && (
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {record.breach_date}
          </span>
        )}
      </div>

      <div className="divide-y divide-border/50 px-4 py-2">
        {primaryRows.map((r) => (
          <FieldRow key={r.key} label={r.label} value={r.value} secret={r.secret} />
        ))}
        {extraRows.map((r) => (
          <FieldRow key={r.key} label={r.label} value={r.value} />
        ))}
      </div>
    </Card>
  );
}

function dotColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-red-500";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-amber-500";
    case "low":
      return "bg-sky-500";
    default:
      return "bg-slate-500";
  }
}
