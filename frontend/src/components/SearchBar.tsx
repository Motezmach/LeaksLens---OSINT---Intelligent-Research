"use client";

import {
  AtSign,
  Check,
  Globe,
  Hash,
  KeyRound,
  Loader2,
  Network,
  Search,
  User,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SearchType } from "@/types";

interface SearchTypeDef {
  value: SearchType;
  label: string;
  icon: typeof Search;
  placeholder: string;
}

export const SEARCH_TYPES: SearchTypeDef[] = [
  { value: "email", label: "Email", icon: AtSign, placeholder: "name@example.com" },
  { value: "username", label: "Username", icon: User, placeholder: "johndoe" },
  { value: "ip", label: "IP", icon: Network, placeholder: "12.34.56.78" },
  { value: "password", label: "Password", icon: KeyRound, placeholder: "hunter2" },
  { value: "name", label: "Name", icon: User, placeholder: "John Doe" },
  { value: "hash", label: "Hash", icon: Hash, placeholder: "5f4dcc3b..." },
  { value: "domain", label: "Domain", icon: Globe, placeholder: "example.com" },
];

const DEFAULT_TYPE: SearchTypeDef = SEARCH_TYPES[0] as SearchTypeDef;

interface SearchBarProps {
  initialTerm?: string;
  initialType?: SearchType;
  initialWildcard?: boolean;
  loading?: boolean;
  autoFocus?: boolean;
  className?: string;
  onSearch: (term: string, type: SearchType, wildcard: boolean) => void;
}

export function SearchBar({
  initialTerm = "",
  initialType = "email",
  initialWildcard = false,
  loading = false,
  autoFocus,
  className,
  onSearch,
}: SearchBarProps) {
  const [term, setTerm] = useState(initialTerm);
  const [type, setType] = useState<SearchType>(initialType);
  const [wildcard, setWildcard] = useState(initialWildcard);

  const active = SEARCH_TYPES.find((t) => t.value === type) ?? DEFAULT_TYPE;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = term.trim();
    if (!trimmed) return;
    onSearch(trimmed, type, wildcard);
  }

  return (
    <form onSubmit={submit} className={cn("w-full space-y-5", className)}>
      {/* Search input */}
      <div className="relative flex items-center">
        <active.icon className="pointer-events-none absolute left-4 h-5 w-5 text-muted-foreground" />
        <Input
          value={term}
          autoFocus={autoFocus}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={`Search ${active.label.toLowerCase()} (comma-separated for multiple)`}
          className="h-14 rounded-xl border-2 pl-12 pr-32 text-base shadow-lg focus:border-primary/60"
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
        />
        <Button
          type="submit"
          disabled={loading || !term.trim()}
          className="absolute right-2 h-10 rounded-lg px-6 text-sm font-semibold"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {/* Type selector row */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {SEARCH_TYPES.map((t) => {
          const selected = t.value === type;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all",
                selected
                  ? "border-primary bg-primary/15 text-primary shadow-sm shadow-primary/20"
                  : "border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Wildcard checkbox centered below */}
      <div className="flex justify-center">
        <label
          className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg border border-border/60 bg-card/40 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          title="Use % (any chars) and _ (one char) as wildcards"
        >
          <span
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded border transition-colors",
              wildcard
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/40 bg-transparent"
            )}
          >
            {wildcard && <Check className="h-3 w-3" />}
          </span>
          <input
            type="checkbox"
            className="sr-only"
            checked={wildcard}
            onChange={(e) => setWildcard(e.target.checked)}
          />
          Enable Wildcard
        </label>
      </div>
    </form>
  );
}
