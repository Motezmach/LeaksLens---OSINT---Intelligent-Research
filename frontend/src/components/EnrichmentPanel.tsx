"use client";

import { Globe, Info, Network, ShieldQuestion } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { EnrichmentItem } from "@/types";

const ICONS: Record<string, typeof Info> = {
  subdomains: Globe,
  whois: Network,
  reputation: ShieldQuestion,
};

export function EnrichmentPanel({ items }: { items: EnrichmentItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground">
        Context &amp; enrichment
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, i) => {
          const Icon = ICONS[item.kind] || Info;
          return (
            <Card key={`${item.source}-${i}`} className="p-4">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="font-medium">{item.title}</span>
              </div>
              <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                {item.summary}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
