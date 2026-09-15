/**
 * Shopify Admin GraphQL client.
 *
 * Deliberately tiny — no SDK. The app only issues a handful of queries, and the
 * two things that actually matter are getting the API version right and
 * surviving throttling, both of which are a few lines each.
 */

/**
 * Current stable Admin API version. Shopify ships a new one quarterly and
 * supports each for a year; bump this deliberately, not automatically, and
 * re-read the release notes when you do.
 */
export const SHOPIFY_API_VERSION = "2026-07";

export interface ShopifyCredentials {
  /** e.g. sana-threads-dev.myshopify.com */
  shopDomain: string;
  /** Admin API access token — shpat_ (custom app) or an OAuth offline token. */
  accessToken: string;
  apiVersion?: string;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
  extensions?: {
    cost?: {
      requestedQueryCost: number;
      actualQueryCost: number;
      throttleStatus: {
        maximumAvailable: number;
        currentlyAvailable: number;
        restoreRate: number;
      };
    };
  };
}

export class ShopifyError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly userErrors?: unknown,
  ) {
    super(message);
    this.name = "ShopifyError";
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ShopifyClient {
  private readonly endpoint: string;

  constructor(private readonly credentials: ShopifyCredentials) {
    const version = credentials.apiVersion ?? SHOPIFY_API_VERSION;
    this.endpoint = `https://${credentials.shopDomain}/admin/api/${version}/graphql.json`;
  }

  get shopDomain(): string {
    return this.credentials.shopDomain;
  }

  async query<T>(
    query: string,
    variables: Record<string, unknown> = {},
    attempt = 0,
  ): Promise<T> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.credentials.accessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    // 429 carries Retry-After; 5xx is worth a couple of tries.
    if (response.status === 429 || response.status >= 500) {
      if (attempt >= 4) {
        throw new ShopifyError(
          `Shopify returned ${response.status} after ${attempt + 1} attempts.`,
          response.status,
        );
      }
      const retryAfter = Number.parseFloat(response.headers.get("Retry-After") ?? "");
      const waitMs = Number.isFinite(retryAfter) ? retryAfter * 1000 : 2 ** attempt * 1000;
      await sleep(waitMs);
      return this.query<T>(query, variables, attempt + 1);
    }

    if (response.status === 401 || response.status === 403) {
      throw new ShopifyError(
        `Shopify rejected the access token for ${this.credentials.shopDomain}. ` +
          "Check the token and that the app has the required scopes.",
        response.status,
      );
    }

    if (!response.ok) {
      const body = await response.text();
      throw new ShopifyError(
        `Shopify HTTP ${response.status}: ${body.slice(0, 300)}`,
        response.status,
      );
    }

    const payload = (await response.json()) as GraphQLResponse<T>;

    if (payload.errors?.length) {
      // Cost-based throttling arrives as a 200 with a THROTTLED error, not a
      // 429. Missing this is the classic way to "mysteriously" lose half a sync.
      const throttled = payload.errors.some((e) => e.extensions?.code === "THROTTLED");
      if (throttled && attempt < 4) {
        const status = payload.extensions?.cost?.throttleStatus;
        const needed = payload.extensions?.cost?.requestedQueryCost ?? 100;
        const waitMs = status
          ? Math.max(1000, ((needed - status.currentlyAvailable) / status.restoreRate) * 1000)
          : 2 ** attempt * 1000;
        await sleep(waitMs);
        return this.query<T>(query, variables, attempt + 1);
      }

      throw new ShopifyError(payload.errors.map((e) => e.message).join("; "));
    }

    if (!payload.data) throw new ShopifyError("Shopify returned no data.");
    return payload.data;
  }
}

/** Strip HTML to plain text. Product descriptions arrive as descriptionHtml. */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** gid://shopify/Product/123 -> "123" */
export function numericId(gid: string): string {
  const parts = gid.split("/");
  return parts[parts.length - 1] ?? gid;
}
