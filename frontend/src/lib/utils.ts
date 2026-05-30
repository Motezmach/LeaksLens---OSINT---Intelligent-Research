import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function severityColor(severity?: string | null): string {
  switch ((severity || "").toLowerCase()) {
    case "critical":
      return "bg-red-900/40 text-red-300 border-red-700/50";
    case "high":
      return "bg-red-600/20 text-red-400 border-red-600/40";
    case "medium":
      return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    case "low":
      return "bg-blue-600/20 text-blue-400 border-blue-600/40";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/40";
  }
}
