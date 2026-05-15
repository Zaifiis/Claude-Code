import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { searchAds, extractProductName, detectCategory } from "@/lib/facebook-ads";

const FREE_DAILY_LIMIT = 5;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Daily search limit for FREE users
  if (session.user.plan === "FREE") {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const isNewDay = !user?.lastSearchDate || new Date(user.lastSearchDate) < today;
    const searches = isNewDay ? 0 : (user?.dailySearches ?? 0);
    if (searches >= FREE_DAILY_LIMIT)
      return Response.json({ error: "Daily search limit reached. Upgrade to PRO for unlimited searches.", limitReached: true }, { status: 429 });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { dailySearches: isNewDay ? 1 : { increment: 1 }, lastSearchDate: new Date() },
    });
  }

  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q) return Response.json({ error: "Query required" }, { status: 400 });

  try {
    const result = await searchAds({ searchTerms: q, limit: 50 });
    const ads = result.data ?? [];

    // Save search history
    await prisma.searchHistory.create({
      data: { userId: session.user.id, query: q, resultsCount: ads.length },
    });

    const enriched = ads.map((ad) => ({
      id: ad.id,
      pageId: ad.page_id,
      pageName: ad.page_name,
      adTitle: ad.ad_creative_link_titles?.[0] ?? null,
      adBody: ad.ad_creative_bodies?.[0] ?? null,
      adLibraryUrl: ad.ad_snapshot_url ?? null,
      startDate: ad.ad_delivery_start_time ?? null,
      platforms: ad.publisher_platforms ?? [],
      spend: ad.spend ?? null,
      impressions: ad.impressions ?? null,
      productName: extractProductName(ad),
      category: detectCategory(ad),
    }));

    return Response.json({ ads: enriched, query: q });
  } catch (err: any) {
    return Response.json({ error: err.message ?? "Search failed" }, { status: 500 });
  }
}
