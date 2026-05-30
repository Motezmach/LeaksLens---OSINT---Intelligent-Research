"use client";

import { Clock, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, apiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { SearchHistoryItem } from "@/types";

export default function HistoryPage() {
  const [items, setItems] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .get<SearchHistoryItem[]>("/history")
      .then((res) => setItems(res.data))
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function remove(id: string) {
    await api.delete(`/history/${id}`);
    setItems((cur) => cur.filter((i) => i.id !== id));
  }

  async function clearAll() {
    await api.delete("/history");
    setItems([]);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Clock className="h-5 w-5 text-primary" /> Search history
        </h1>
        {items.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearAll}>
            <Trash2 className="h-4 w-4" /> Clear all
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border bg-card/50" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No searches yet.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-mono">{item.term}</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                    {item.term_type}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.result_count} results · {formatDate(item.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href={`/search?q=${encodeURIComponent(item.term)}&type=${encodeURIComponent(item.term_type)}`}
                >
                  <Button variant="ghost" size="icon" title="Search again">
                    <Search className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(item.id)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
