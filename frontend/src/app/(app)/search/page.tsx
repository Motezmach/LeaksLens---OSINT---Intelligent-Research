"use client";

import { AlertTriangle, Clock, Database, KeyRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { EnrichmentPanel } from "@/components/EnrichmentPanel";
import { ResultList } from "@/components/ResultList";
import { SearchBar } from "@/components/SearchBar";
import { useSearch } from "@/lib/useSearch";
import type { SearchType } from "@/types";

const VALID_TYPES = new Set<SearchType>([
  "email",
  "username",
  "ip",
  "password",
  "hash",
  "name",
  "domain",
]);

function SearchInner() {
  const router = useRouter();
  const params = useSearchParams();

  const q = params.get("q") ?? "";
  const rawType = params.get("type") as SearchType | null;
  const type: SearchType = rawType && VALID_TYPES.has(rawType) ? rawType : "email";
  const wildcard = params.get("wildcard") === "1";

  const { loading, data, error, run } = useSearch();
  const lastKey = useRef<string>("");

  useEffect(() => {
    if (!q) return;
    const key = `${type}|${wildcard ? 1 : 0}|${q}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    run(q, type, wildcard);
  }, [q, type, wildcard, run]);

  function onSearch(term: string, t: SearchType, w: boolean) {
    const sp = new URLSearchParams({ q: term, type: t });
    if (w) sp.set("wildcard", "1");
    router.push(`/search?${sp.toString()}`);
  }

  return (
    <div className="space-y-6">
      <SearchBar
        initialTerm={q}
        initialType={type}
        initialWildcard={wildcard}
        loading={loading}
        onSearch={onSearch}
      />

      {data && !data.snusbase_configured && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          Snusbase API key is not configured on the server. Set SNUSBASE_API_KEY.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg border bg-card/50" />
          ))}
        </div>
      )}

      {data && !loading && (
        <>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Database className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">{data.total}</span> records
            </span>
            <span>
              across <span className="font-semibold text-foreground">{data.database_count}</span>{" "}
              databases
            </span>
            <span className="flex items-center gap-1.5">
              <KeyRound className="h-4 w-4 text-red-400" />
              {data.records.filter((r) => r.has_password).length} with credentials
            </span>
            <span className="ml-auto flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {data.took_ms} ms
            </span>
          </div>

          <EnrichmentPanel items={data.enrichment} />

          <ResultList records={data.records} />
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-14 animate-pulse rounded-xl border bg-card/50" />}>
      <SearchInner />
    </Suspense>
  );
}
