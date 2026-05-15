"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Download, Trash2, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryColor, formatDate, trendingLabel } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export function SavedContent() {
  const { data: session } = useSession();
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/saved")
      .then((r) => r.json())
      .then((d) => setSaved(d.saved ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function remove(productId: string) {
    await fetch(`/api/products/${productId}/save`, { method: "POST" });
    setSaved((prev) => prev.filter((s) => s.productId !== productId));
    toast.success("Removed from saved");
  }

  async function exportCSV() {
    if (session?.user?.plan !== "PRO") {
      toast.error("CSV export requires PRO plan");
      return;
    }
    const res = await fetch("/api/saved/export");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "adspy-saved.csv";
    a.click();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{saved.length} saved products</p>
        <Button onClick={exportCSV} variant="outline" size="sm">
          <Download className="h-3.5 w-3.5" />
          Export CSV
          {session?.user?.plan !== "PRO" && <Badge variant="warning" className="ml-1">PRO</Badge>}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : saved.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No saved products yet</p>
          <p className="text-sm mt-1">Save products from the Products page to track them here</p>
          <Link href="/products">
            <Button className="mt-4">Browse Products</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {saved.map((s) => (
            <Card key={s.id}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <Badge className={categoryColor(s.product.category)}>{s.product.category}</Badge>
                      <Badge variant="warning">{trendingLabel(s.product.trendingScore)}</Badge>
                    </div>
                    <Link href={`/products/${s.product.id}`} className="font-semibold text-slate-900 hover:text-indigo-600">
                      {s.product.name}
                    </Link>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>{s.product.adCount} active ads</span>
                      <span>{s.product.advertiserCount} advertisers</span>
                      <span>First seen {formatDate(s.product.firstSeenAt)}</span>
                    </div>
                    {s.note && (
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 rounded-lg p-2">
                        <FileText className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                        {s.note}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => remove(s.productId)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
