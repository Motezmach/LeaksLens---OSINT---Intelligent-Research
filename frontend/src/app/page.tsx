"use client";

import { Database, KeyRound, Lock, Network, Radar, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import type { SearchType } from "@/types";

const FEATURES = [
  {
    icon: Database,
    title: "Billions of Records",
    desc: "Breach compilations, stealer logs, and combolists.",
  },
  {
    icon: KeyRound,
    title: "Full Credentials",
    desc: "Emails, usernames, passwords, and cracked hashes.",
  },
  {
    icon: Network,
    title: "7 Search Types",
    desc: "Email, username, IP, password, name, hash, domain.",
  },
  {
    icon: Radar,
    title: "Enrichment",
    desc: "Subdomains, WHOIS, and reputation signals.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const isLoggedIn = Boolean(token);

  function handleSearch(term: string, type: SearchType, wildcard: boolean) {
    const sp = new URLSearchParams({ q: term, type });
    if (wildcard) sp.set("wildcard", "1");
    router.push(`/search?${sp.toString()}`);
  }

  // ── Logged-in: clean, full-screen search view ──
  if (isLoggedIn) {
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        <div className="absolute inset-0 grid-backdrop" aria-hidden />

        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2 font-semibold">
            <Radar className="h-6 w-6 text-primary" />
            <span className="text-lg">LeakLens</span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.email}
              </span>
            )}
            <Link href="/search">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
          </div>
        </header>

        <main className="relative z-10 mx-auto flex flex-1 flex-col items-center justify-center px-6 pb-12">
          <h1 className="text-center text-4xl font-bold tracking-tight sm:text-6xl">
            Find where your data
            <span className="text-primary"> leaked</span>.
          </h1>

          <div className="mt-12 w-full max-w-4xl">
            <SearchBar onSearch={handleSearch} autoFocus />
          </div>

          <div className="mt-20 grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border bg-card/50 p-5 backdrop-blur transition-colors hover:border-primary/40"
              >
                <f.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-2 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ── Guest: marketing landing ──
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 grid-backdrop" aria-hidden />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-semibold">
          <Radar className="h-6 w-6 text-primary" />
          <span className="text-lg">LeakLens</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button>Get started</Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6">
        <section className="mx-auto max-w-3xl pb-12 pt-16 text-center sm:pt-24">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            OSINT Intelligence Platform
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Find where your data
            <span className="text-primary"> leaked</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-muted-foreground sm:text-lg">
            Search leaked databases and breach compilations by email, username,
            IP, password, name, hash, or domain.
          </p>

          <div className="mx-auto mt-10 max-w-4xl">
            <SearchBar onSearch={handleSearch} autoFocus />
          </div>
        </section>

        <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border bg-card/50 p-5 backdrop-blur transition-colors hover:border-primary/40"
            >
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>

        <section className="mb-24 flex flex-col items-center gap-3 rounded-2xl border bg-card/50 px-6 py-10 text-center backdrop-blur">
          <Lock className="h-7 w-7 text-primary" />
          <h2 className="text-2xl font-semibold">For defenders and researchers</h2>
          <p className="max-w-lg text-sm text-muted-foreground">
            Built for authorized security research and personal exposure monitoring.
          </p>
          <Link href="/register" className="mt-2">
            <Button size="lg">Create an account</Button>
          </Link>
        </section>
      </main>
    </div>
  );
}
