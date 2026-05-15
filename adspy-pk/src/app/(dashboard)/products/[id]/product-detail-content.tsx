"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ExternalLink, Bookmark, TrendingUp, Users,
  Calendar, Activity, Store
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { categoryColor, formatDate, trendingLabel } from "@/lib/utils";
import { toast } from "sonner";

export function ProductDetailContent({ product }: { product: any }) {
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function toggleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${product.id}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      setSaved(data.saved);
      toast.success(data.saved ? "Saved to your list!" : "Removed from saved");
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  }

  const advertisers = [...new Map(product.ads.map((a: any) => [a.pageId, a])).values()];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <Link href="/products" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className={categoryColor(product.category)}>{product.category}</Badge>
              <Badge variant="warning">{trendingLabel(product.trendingScore)}</Badge>
              {!product.isActive && <Badge variant="destructive">Inactive</Badge>}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{product.name}</h1>
            <p className="text-sm text-slate-500">First seen {formatDate(product.firstSeenAt)} · Last seen {formatDate(product.lastSeenAt)}</p>
          </div>
          <Button onClick={toggleSave} loading={saving} variant={saved ? "secondary" : "default"}>
            <Bookmark className={saved ? "fill-current h-4 w-4" : "h-4 w-4"} />
            {saved ? "Saved" : "Save Product"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Active Ads", value: product.adCount, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Advertisers", value: product.advertiserCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Trending Score", value: Math.round(product.trendingScore), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Total Ads", value: product.ads.length, icon: Store, color: "text-amber-600", bg: "bg-amber-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-4">
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className="text-xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="mt-5 pt-5 border-t border-slate-100">
          <label className="block text-sm font-medium text-slate-700 mb-2">Add a note</label>
          <div className="flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why is this interesting? Your research notes..."
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button onClick={toggleSave} loading={saving} size="sm">Save with Note</Button>
          </div>
        </div>
      </div>

      {/* Advertisers */}
      <Card>
        <CardHeader>
          <CardTitle>Advertisers Running This Product ({advertisers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {advertisers.map((a: any) => (
              <span key={a.pageId} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-sm px-3 py-1 rounded-full">
                <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {a.pageName?.[0]?.toUpperCase() ?? "?"}
                </div>
                {a.pageName}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ads grid */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-4">All Ads ({product.ads.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {product.ads.map((ad: any) => (
            <Card key={ad.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {ad.pageName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-900 truncate">{ad.pageName}</p>
                    <p className="text-xs text-slate-400">{ad.startDate ? formatDate(ad.startDate) : "—"}</p>
                  </div>
                  <Badge variant={ad.status === "ACTIVE" ? "success" : "secondary"} className="ml-auto flex-shrink-0">
                    {ad.status}
                  </Badge>
                </div>
                {ad.adTitle && <p className="font-medium text-slate-800 text-sm">{ad.adTitle}</p>}
                {ad.adBody && <p className="text-slate-500 text-xs line-clamp-3">{ad.adBody}</p>}
                {ad.platforms?.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {ad.platforms.map((p: string) => (
                      <span key={p} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{p}</span>
                    ))}
                  </div>
                )}
                {ad.adLibraryUrl && (
                  <a href={ad.adLibraryUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800">
                    <ExternalLink className="h-3 w-3" /> View on Facebook Ads Library
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
