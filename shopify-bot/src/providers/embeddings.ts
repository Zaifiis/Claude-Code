/**
 * Embeddings.
 *
 * Anthropic does not serve an embeddings API, so this is the one place the
 * stack needs a second vendor. The interface keeps that contained: the catalog
 * only knows `embed()`, and swapping vendors is one constructor call.
 *
 * DIMENSION MUST MATCH supabase/schema.sql. It declares vector(1024), which is
 * Voyage's and Cohere's default. OpenAI's text-embedding-3-small is 1536 — if
 * you use it, change the schema BEFORE inserting any rows, because pgvector
 * cannot alter a column's dimension once the table has data.
 */

export const EMBEDDING_DIMENSIONS = 1024;

export interface EmbeddingProvider {
  readonly name: string;
  readonly dimensions: number;
  /** Batch embed. Returns one vector per input, in the same order. */
  embed(texts: string[]): Promise<number[][]>;
}

/**
 * Voyage AI — Anthropic's recommended embedding partner.
 * voyage-3 returns 1024 dimensions, matching the schema as shipped.
 */
export class VoyageEmbeddings implements EmbeddingProvider {
  readonly name = "voyage";
  readonly dimensions = EMBEDDING_DIMENSIONS;

  constructor(
    private readonly apiKey: string,
    private readonly model = "voyage-3",
  ) {}

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const response = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ input: texts, model: this.model }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Voyage embeddings failed (${response.status}): ${body.slice(0, 300)}`);
    }

    const payload = (await response.json()) as {
      data?: Array<{ index: number; embedding: number[] }>;
    };
    if (!payload.data) throw new Error("Voyage returned no embedding data.");

    // The API does not guarantee order; index it explicitly.
    const out: number[][] = new Array(texts.length);
    for (const item of payload.data) out[item.index] = item.embedding;
    for (let i = 0; i < texts.length; i++) {
      if (!out[i]) throw new Error(`Voyage returned no embedding for input ${i}.`);
    }
    return out as number[][];
  }
}

/**
 * Deterministic offline embedder — hashed bag of words, L2 normalised.
 *
 * NOT semantic. "warm jacket" and "winter coat" land nowhere near each other,
 * which is the entire point of real embeddings. This exists so the Supabase
 * code path can be wired up, migrated and smoke-tested before you have an
 * embeddings key, and so CI never calls a paid API.
 *
 * Never ship it: with this embedder, retrieval quality is roughly keyword
 * search with extra steps.
 */
export class HashEmbeddings implements EmbeddingProvider {
  readonly name = "hash-offline";
  readonly dimensions = EMBEDDING_DIMENSIONS;

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((text) => this.embedOne(text));
  }

  private embedOne(text: string): number[] {
    const vector = new Array<number>(this.dimensions).fill(0);
    const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];

    for (const token of tokens) {
      // FNV-1a, folded into the vector space.
      let hash = 0x811c9dc5;
      for (let i = 0; i < token.length; i++) {
        hash ^= token.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
      }
      const index = hash % this.dimensions;
      // Sign from a second bit of the hash, so collisions do not all add up.
      const sign = (hash & 0x80000000) !== 0 ? -1 : 1;
      vector[index] = (vector[index] ?? 0) + sign;
    }

    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    if (magnitude === 0) return vector;
    return vector.map((value) => value / magnitude);
  }
}

export function createEmbeddingProvider(): EmbeddingProvider {
  const voyageKey = process.env["VOYAGE_API_KEY"];
  if (voyageKey) return new VoyageEmbeddings(voyageKey);
  return new HashEmbeddings();
}
