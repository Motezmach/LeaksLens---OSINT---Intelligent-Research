"use client";

import { SearchX } from "lucide-react";

import { ResultCard } from "@/components/ResultCard";
import type { LeakRecord } from "@/types";

export function ResultList({ records }: { records: LeakRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <SearchX className="h-10 w-10 text-muted-foreground" />
        <p className="mt-4 font-medium">No records found</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Nothing matched this term across the connected databases. Try a different
          term or search type.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((r) => (
        <ResultCard key={r.id} record={r} />
      ))}
    </div>
  );
}
