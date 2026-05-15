"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, ExternalLink, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryColor, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) { setQuery(q); doSearch(q); }
  }, []);

  async function doSearch(q?: string) {
    const term = q ?? query;
    if (!term.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        if (data.limitReached) setResults([]);
      } else {
        setResults(data.ads ?? []);
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  }

  const QUICK_TERMS = ["skincare", "fashion", "mobile accessories", "weight loss", "home decor", "online course"];

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Search box */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              placeholder="Search e.g. 'skincare cream', 'mobile accessories'..."
              className="pl-9"
            />
          </div>
          <Button onClick={() => doSearch()} loading={loading}>
            <Zap className="h-4 w-4" />
            Search
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-slate-400">Quick:</span>
          {QUICK_TERMS.map((t) => (
            <button
              key={t}
              onClick={() => { setQuery(t); doSearch(t); }}
              className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : searched && results.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No ads found</p>
          <p className="text-sm mt-1">Try different keywords</p>
        </div>
      ) : (
        <>
          {results.length > 0 && (
            <p className="text-sm text-slate-500">{results.length} ads found for "{query}"</p>
          )}
          <div className="space-y-3">
            {results.map((ad) => (
              <Card key={ad.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                      {ad.pageName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-slate-900 text-sm">{ad.pageName}</p>
                        <Badge className={categoryColor(ad.category)}>{ad.category}</Badge>
                        <span className="text-xs text-slate-400">{ad.startDate ? formatDate(ad.startDate) : "—"}</span>
                      </div>
                      {ad.adTitle && <p className="font-medium text-slate-800 text-sm mb-1">{ad.adTitle}</p>}
                      {ad.adBody && <p className="text-slate-500 text-xs line-clamp-2">{ad.adBody}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        {ad.platforms?.map((p: string) => (
                          <span key={p} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{p}</span>
                        ))}
                        {ad.spend && (
                          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Spend: {ad.spend.lower_bound}–{ad.spend.upper_bound}
                          </span>
                        )}
                        {ad.adLibraryUrl && (
                          <a href={ad.adLibraryUrl} target="_blank" rel="noopener noreferrer"
                            className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> View Ad
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
