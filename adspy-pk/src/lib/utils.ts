import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function trendingLabel(score: number): string {
  if (score >= 80) return "🔥🔥🔥 Hot";
  if (score >= 50) return "🔥🔥 Rising";
  if (score >= 20) return "🔥 Trending";
  return "New";
}

export function categoryColor(category: string): string {
  const map: Record<string, string> = {
    "Beauty & Skincare": "bg-pink-100 text-pink-700",
    "Fashion & Clothing": "bg-purple-100 text-purple-700",
    "Electronics": "bg-blue-100 text-blue-700",
    "Health & Fitness": "bg-green-100 text-green-700",
    "Home & Kitchen": "bg-orange-100 text-orange-700",
    "Food & Beverages": "bg-yellow-100 text-yellow-700",
    "Education": "bg-indigo-100 text-indigo-700",
    "Real Estate": "bg-teal-100 text-teal-700",
    "Make Money": "bg-emerald-100 text-emerald-700",
  };
  return map[category] ?? "bg-slate-100 text-slate-700";
}
