"use client";
import { useState } from "react";
import Link from "next/link";
import { Bookmark, ExternalLink, TrendingUp, Users, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, categoryColor, formatDate, trendingLabel } from "@/lib/utils";
import { toast } from "sonner";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    category: string;
    adCount: number;
    advertiserCount: number;
    trendingScore: number;
    firstSeenAt: string | Date;
    lastSeenAt: string | Date;
    isActive: boolean;
  };
  isSaved?: boolean;
}

export function ProductCard({ product, isSaved: initialSaved = false }: ProductCardProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  const borderColor =
    product.trendingScore >= 80
      ? "border-l-emerald-500"
      : product.trendingScore >= 50
      ? "border-l-amber-500"
      : "border-l-slate-300";

  async function toggleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}/save`, { method: "POST" });
      const data = await res.json();
      setSaved(data.saved);
      toast.success(data.saved ? "Product saved!" : "Removed from saved");
    } catch {
      toast.error("Failed to save product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className={cn("border-l-4 hover:shadow-md transition-shadow", borderColor)}>
      <CardContent className="pt-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge className={categoryColor(product.category)}>{product.category}</Badge>
            <Badge variant="warning">{trendingLabel(product.trendingScore)}</Badge>
          </div>
          <button
            onClick={toggleSave}
            disabled={loading}
            className={cn(
              "p-1.5 rounded-lg transition-colors flex-shrink-0",
              saved ? "text-indigo-600 bg-indigo-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            )}
          >
            <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
          </button>
        </div>

        {/* Product name */}
        <h3 className="font-semibold text-slate-900 mb-3 line-clamp-2">{product.name}</h3>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-0.5">
              <TrendingUp className="h-3 w-3" />
              Active Ads
            </div>
            <p className="font-bold text-slate-900">{product.adCount}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-0.5">
              <Users className="h-3 w-3" />
              Advertisers
            </div>
            <p className="font-bold text-slate-900">{product.advertiserCount}</p>
          </div>
        </div>

        {/* Score bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Trending Score</span>
            <span className="font-medium text-slate-700">{Math.round(product.trendingScore)}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, product.trendingScore)}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Calendar className="h-3 w-3" />
            {formatDate(product.firstSeenAt)}
          </div>
          <Link href={`/products/${product.id}`}>
            <Button size="sm" variant="outline">
              <ExternalLink className="h-3 w-3" />
              View Ads
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
