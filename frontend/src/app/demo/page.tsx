"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiError } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

function DemoAccessInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { loginWithDemoKey } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = params.get("key")?.trim();
    if (!key) {
      setError("Missing demo key. Use the QR code or link provided by the presenter.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await loginWithDemoKey(key);
        if (!cancelled) router.replace("/search");
      } catch (err) {
        if (!cancelled) setError(apiError(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, loginWithDemoKey, router]);

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Demo access unavailable</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">Go to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Opening demo workspace</CardTitle>
        <CardDescription>Signing you in securely — one moment…</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </CardContent>
    </Card>
  );
}

export default function DemoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense
        fallback={
          <Card className="w-full max-w-md">
            <CardContent className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        }
      >
        <DemoAccessInner />
      </Suspense>
    </div>
  );
}
