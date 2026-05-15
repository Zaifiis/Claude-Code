"use client";
import { useEffect, useState, useCallback } from "react";
import { Filter, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/dashboard/product-card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PRODUCT_CATEGORIES } from "@/lib/facebook-ads";

const SORTS = [
  { value: "trendingScore", label: "🔥 Trending Score" },
  { value: "adCount", label: "📊 Most Ads" },
  { value: "advertiserCount", label: "👥 Most Advertisers" },
  { value: "newest", label: "🆕 Newest First" },
];

export function ProductsContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("trendingScore");
  const [minAds, setMinAds] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), sort });
    if (category) params.set("category", category);
    if (minAds > 0) params.set("minAds", String(minAds));
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products ?? []);
    setPagination(data.pagination ?? null);
    setLoading(false);
  }, [page, category, sort, minAds]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="w-48">
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
        <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="w-48">
          <option value="">All Categories</option>
          {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Button variant="outline" size="sm" onClick={() => setFiltersOpen(!filtersOpen)}>
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </Button>
        {pagination && (
          <span className="text-sm text-slate-500 ml-auto">
            {pagination.total} products
          </span>
        )}
      </div>

      {/* Min ads filter */}
      {filtersOpen && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Min Ads:</label>
          <input
            type="range" min={0} max={100} step={5} value={minAds}
            onChange={(e) => { setMinAds(parseInt(e.target.value)); setPage(1); }}
            className="flex-1 accent-indigo-600"
          />
          <span className="text-sm font-medium text-slate-700 w-8">{minAds}</span>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(9).fill(0).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Filter className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No products found</p>
          <p className="text-sm mt-1">Try changing your filters or wait for the next sync</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} isSaved={p.isSaved} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline" size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >Previous</Button>
          <span className="text-sm text-slate-600 px-3">
            Page {page} of {pagination.pages}
          </span>
          <Button
            variant="outline" size="sm"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >Next</Button>
        </div>
      )}
    </div>
  );
}
