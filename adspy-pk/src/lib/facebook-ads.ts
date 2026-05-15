import axios from "axios";

const FB_API = "https://graph.facebook.com/v20.0/ads_archive";
const TOKEN = process.env.FB_ACCESS_TOKEN!;

export const SEARCH_KEYWORDS = [
  "buy online pakistan",
  "free delivery pakistan",
  "order now pk",
  "cash on delivery",
  "best price pakistan",
  "shop now pk",
  "sale pakistan",
  "discount pk",
  "dropshipping",
  "trending pakistan",
];

export const PRODUCT_CATEGORIES = [
  "Beauty & Skincare",
  "Fashion & Clothing",
  "Electronics",
  "Health & Fitness",
  "Home & Kitchen",
  "Food & Beverages",
  "Education",
  "Real Estate",
  "Make Money",
  "Other",
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Beauty & Skincare": ["skincare", "cream", "serum", "beauty", "makeup", "lotion", "facewash", "glow", "whitening", "fairness"],
  "Fashion & Clothing": ["clothes", "fashion", "dress", "shirt", "shoes", "wear", "outfit", "kurta", "shalwar", "lawn"],
  "Electronics": ["phone", "mobile", "laptop", "earphones", "charger", "gadget", "speaker", "smartwatch", "tablet"],
  "Health & Fitness": ["weight loss", "protein", "supplement", "fitness", "gym", "health", "diet", "slimming", "herbal"],
  "Home & Kitchen": ["kitchen", "home", "furniture", "decor", "appliance", "cookware", "bedsheet", "mattress"],
  "Food & Beverages": ["food", "restaurant", "delivery", "snacks", "tea", "coffee", "biryani", "bakery"],
  "Education": ["course", "learning", "academy", "training", "skill", "certificate", "ielts", "digital"],
  "Real Estate": ["property", "house", "apartment", "plot", "housing", "flat", "commercial"],
  "Make Money": ["earn", "income", "freelance", "business", "profit", "investment", "passive", "affiliate"],
};

const STOP_WORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with",
  "by","from","up","about","into","through","during","this","that","these",
  "those","is","are","was","were","be","been","being","have","has","had",
  "do","does","did","will","would","could","should","may","might","shall",
  "can","need","dare","ought","used","buy","get","our","your","their","we",
  "you","they","it","he","she","pk","pakistan","now","online","delivery",
  "free","best","new","sale","shop","order","price","cash","offer",
]);

export interface FbAd {
  id: string;
  page_id: string;
  page_name: string;
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  ad_creative_link_descriptions?: string[];
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  ad_snapshot_url?: string;
  impressions?: { lower_bound: string; upper_bound: string };
  spend?: { lower_bound: string; upper_bound: string };
  publisher_platforms?: string[];
}

export function extractProductName(ad: FbAd): string {
  const texts = [
    ...(ad.ad_creative_link_titles || []),
    ...(ad.ad_creative_bodies || []),
    ...(ad.ad_creative_link_descriptions || []),
  ].join(" ");

  const words = texts
    .replace(/[^a-zA-Z\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

  const wordFreq = words.reduce<Record<string, number>>((acc, w) => {
    acc[w] = (acc[w] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));

  if (sorted.length === 0) return ad.page_name || "Unknown Product";

  return sorted.join(" ");
}

export function detectCategory(ad: FbAd): string {
  const text = [
    ...(ad.ad_creative_bodies || []),
    ...(ad.ad_creative_link_titles || []),
    ...(ad.ad_creative_link_descriptions || []),
  ]
    .join(" ")
    .toLowerCase();

  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some((k) => text.includes(k))) return cat;
  }
  return "Other";
}

export function calculateTrendingScore(
  adCount: number,
  advertiserCount: number,
  firstSeenDaysAgo: number
): number {
  const recencyBonus =
    firstSeenDaysAgo < 7
      ? 30
      : firstSeenDaysAgo < 14
      ? 20
      : firstSeenDaysAgo < 30
      ? 10
      : 0;
  return adCount * 0.5 + advertiserCount * 2 + recencyBonus;
}

async function fetchWithRetry(params: Record<string, string>, retries = 3): Promise<{ data: FbAd[]; paging?: any }> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await axios.get(FB_API, { params, timeout: 30000 });
      return res.data;
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 429 || status === 503) {
        const delay = Math.pow(2, attempt) * 60000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      if (status === 401 || status === 403) {
        throw new Error("FB_TOKEN_EXPIRED");
      }
      throw err;
    }
  }
  throw new Error("FB_RATE_LIMIT_EXCEEDED");
}

export async function searchAds(params: {
  searchTerms?: string;
  after?: string;
  limit?: number;
}): Promise<{ data: FbAd[]; paging?: any }> {
  const fields = [
    "id",
    "page_id",
    "page_name",
    "ad_creative_bodies",
    "ad_creative_link_titles",
    "ad_delivery_start_time",
    "ad_delivery_stop_time",
    "ad_snapshot_url",
    "impressions",
    "spend",
    "publisher_platforms",
    "ad_creative_link_descriptions",
  ].join(",");

  const reqParams: Record<string, string> = {
    access_token: TOKEN,
    fields,
    "ad_reached_countries[0]": "PK",
    ad_active_status: "ACTIVE",
    ad_type: "ALL",
    limit: String(params.limit ?? 100),
  };

  if (params.searchTerms) reqParams.search_terms = params.searchTerms;
  if (params.after) reqParams.after = params.after;

  return fetchWithRetry(reqParams);
}
