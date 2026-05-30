import { Radar } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 grid-backdrop" aria-hidden />
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Radar className="h-7 w-7 text-primary" />
          <span className="text-xl font-semibold">LeakLens</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
