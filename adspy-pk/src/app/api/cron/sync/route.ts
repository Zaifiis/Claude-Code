import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  searchAds, extractProductName, detectCategory,
  calculateTrendingScore, SEARCH_KEYWORDS,
} from "@/lib/facebook-ads";
import nodemailer from "nodemailer";

async function alertAdmin(message: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT ?? "587"),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL,
      subject: "AdSpy PK — Sync Error",
      text: message,
    });
  } catch {}
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const log = await prisma.syncLog.create({ data: { status: "RUNNING" } });
  const start = Date.now();
  let totalAds = 0;
  let totalProducts = 0;

  try {
    const threeDAysAgo = new Date(Date.now() - 3 * 86400000);

    for (const keyword of SEARCH_KEYWORDS) {
      let after: string | undefined;

      // Fetch up to 2 pages per keyword
      for (let page = 0; page < 2; page++) {
        let result;
        try {
          result = await searchAds({ searchTerms: keyword, after, limit: 100 });
        } catch (err: any) {
          if (err.message === "FB_TOKEN_EXPIRED") {
            await alertAdmin(`Facebook token expired. Keyword: ${keyword}`);
          }
          break;
        }

        const ads = result.data ?? [];
        if (ads.length === 0) break;

        for (const ad of ads) {
          // Skip if we've already seen this ad
          const existing = await prisma.ad.findUnique({ where: { fbAdId: ad.id } });
          if (existing) {
            await prisma.ad.update({
              where: { fbAdId: ad.id },
              data: { status: "ACTIVE", updatedAt: new Date() },
            });
            continue;
          }

          const productName = extractProductName(ad);
          const category = detectCategory(ad);

          // Find or create product by name+category
          let product = await prisma.product.findFirst({
            where: { name: { equals: productName, mode: "insensitive" }, category },
          });

          if (!product) {
            product = await prisma.product.create({
              data: { name: productName, category, firstSeenAt: new Date(), lastSeenAt: new Date() },
            });
            totalProducts++;
          }

          // Create the ad record
          await prisma.ad.create({
            data: {
              fbAdId: ad.id,
              pageId: ad.page_id,
              pageName: ad.page_name,
              adTitle: ad.ad_creative_link_titles?.[0] ?? null,
              adBody: ad.ad_creative_bodies?.[0] ?? null,
              adLibraryUrl: ad.ad_snapshot_url ?? null,
              startDate: ad.ad_delivery_start_time ? new Date(ad.ad_delivery_start_time) : null,
              endDate: ad.ad_delivery_stop_time ? new Date(ad.ad_delivery_stop_time) : null,
              platforms: ad.publisher_platforms ?? [],
              spendLower: ad.spend?.lower_bound ?? null,
              spendUpper: ad.spend?.upper_bound ?? null,
              estimatedReach: ad.impressions?.lower_bound ?? null,
              productId: product.id,
              status: "ACTIVE",
            },
          });
          totalAds++;

          // Update product aggregates
          const uniqueAdvertisers = await prisma.ad.groupBy({
            by: ["pageId"],
            where: { productId: product.id, status: "ACTIVE" },
            _count: true,
          });
          const adCount = await prisma.ad.count({ where: { productId: product.id, status: "ACTIVE" } });
          const firstSeen = Math.floor((Date.now() - product.firstSeenAt.getTime()) / 86400000);
          const score = calculateTrendingScore(adCount, uniqueAdvertisers.length, firstSeen);

          await prisma.product.update({
            where: { id: product.id },
            data: {
              adCount,
              advertiserCount: uniqueAdvertisers.length,
              trendingScore: score,
              lastSeenAt: new Date(),
              isActive: true,
            },
          });
        }

        after = result.paging?.cursors?.after;
        if (!after) break;
      }
    }

    // Mark stale ads as INACTIVE
    await prisma.ad.updateMany({
      where: { updatedAt: { lt: threeDAysAgo }, status: "ACTIVE" },
      data: { status: "INACTIVE" },
    });

    // Update products with no active ads
    const staleProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: { _count: { select: { ads: { where: { status: "ACTIVE" } } } } },
    });
    for (const p of staleProducts) {
      if (p._count.ads === 0) {
        await prisma.product.update({ where: { id: p.id }, data: { isActive: false } });
      }
    }

    const duration = Date.now() - start;
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: "SUCCESS", productsFound: totalProducts, adsFound: totalAds, duration },
    });

    return Response.json({ ok: true, duration, productsFound: totalProducts, adsFound: totalAds });
  } catch (err: any) {
    const duration = Date.now() - start;
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: "FAILED", errorMessage: err.message, duration },
    });
    await alertAdmin(`Sync failed: ${err.message}`);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
