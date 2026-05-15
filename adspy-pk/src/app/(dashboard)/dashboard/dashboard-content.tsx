"use client";
import { useEffect, useState } from "react";
import { TrendingUp, Package, Activity, Users, RefreshCw, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/dashboard/product-card";
import { formatDate, timeAgo } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

interface Stats {
  totalProducts: number;
  newToday: number;
  activeAds: number;
  advertiserCount: number;
}

export function DashboardContent({ userName }: { userName: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const statCards = data ? [
    { label: "Total Products", value: data.stats.totalProducts, icon: Package, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "New Today", value: data.stats.newToday, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Active Ads", value: data.stats.activeAds, icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Advertisers", value: data.stats.advertiserCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Welcome back, {userName.split(" ")[0]} 👋</h2>
        <p className="text-slate-500 mt-1 text-sm">
          {data?.lastSync
            ? `Last synced ${timeAgo(data.lastSync.createdAt)} · ${data.lastSync.adsFound} ads found`
            : "Waiting for first sync..."}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          : statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
                  </div>
                  <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      {/* Trend chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-500" />
            New Products This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data?.trendData ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="products" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top trending */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-5 w-5 text-orange-500" />
          <h3 className="font-semibold text-slate-900">Top Trending Products</h3>
          <Badge variant="warning">Live</Badge>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.topProducts ?? []).map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* Last sync info */}
      {data?.lastSync && (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${data.lastSync.status === "SUCCESS" ? "bg-emerald-400" : "bg-red-400"}`} />
              <span className="text-sm text-slate-600">
                Last sync: {formatDate(data.lastSync.createdAt)} — {" "}
                {data.lastSync.adsFound} ads, {data.lastSync.productsFound} new products
                {data.lastSync.duration && ` in ${(data.lastSync.duration / 1000).toFixed(1)}s`}
              </span>
              <span className={`ml-auto text-xs font-medium ${data.lastSync.status === "SUCCESS" ? "text-emerald-600" : "text-red-600"}`}>
                {data.lastSync.status}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
