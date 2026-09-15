import { ShopifyClient, ShopifyError } from "./client.js";

/**
 * Bulk operations.
 *
 * A 5,000-product store is one JSONL download instead of 200 paginated calls.
 * The catch is the result shape: nested connections are flattened into separate
 * lines, each child carrying a `__parentId`. Reassembling that correctly is the
 * only real complexity in the sync.
 */

export interface BulkOperation {
  id: string;
  status: string;
  errorCode: string | null;
  objectCount: string | null;
  url: string | null;
  partialDataUrl: string | null;
}

const RUN_MUTATION = `
  mutation bulkRun($query: String!) {
    bulkOperationRunQuery(query: $query) {
      bulkOperation { id status }
      userErrors { field message }
    }
  }
`;

const POLL_QUERY = `
  query {
    currentBulkOperation {
      id
      status
      errorCode
      objectCount
      url
      partialDataUrl
    }
  }
`;

const CANCEL_MUTATION = `
  mutation bulkCancel($id: ID!) {
    bulkOperationCancel(id: $id) {
      bulkOperation { id status }
      userErrors { field message }
    }
  }
`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Run a bulk query to completion and return the JSONL text.
 *
 * Shopify allows exactly one running bulk operation per shop, so if one is
 * already in flight we cancel it. In production, prefer subscribing to the
 * bulk_operations/finish webhook over polling — this polls because the sync CLI
 * is a one-shot process with nowhere to receive a webhook.
 */
export async function runBulkQuery(
  client: ShopifyClient,
  query: string,
  options: { pollIntervalMs?: number; timeoutMs?: number } = {},
): Promise<string> {
  const pollIntervalMs = options.pollIntervalMs ?? 2000;
  const timeoutMs = options.timeoutMs ?? 10 * 60 * 1000;

  await cancelRunningOperation(client);

  const started = await client.query<{
    bulkOperationRunQuery: {
      bulkOperation: { id: string; status: string } | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(RUN_MUTATION, { query });

  const errors = started.bulkOperationRunQuery.userErrors;
  if (errors.length > 0) {
    throw new ShopifyError(
      `Bulk operation rejected: ${errors.map((e) => e.message).join("; ")}`,
      undefined,
      errors,
    );
  }
  if (!started.bulkOperationRunQuery.bulkOperation) {
    throw new ShopifyError("Bulk operation was not created.");
  }

  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (Date.now() > deadline) {
      throw new ShopifyError(`Bulk operation did not finish within ${timeoutMs}ms.`);
    }
    await sleep(pollIntervalMs);

    const polled = await client.query<{ currentBulkOperation: BulkOperation | null }>(POLL_QUERY);
    const operation = polled.currentBulkOperation;
    if (!operation) continue;

    if (operation.status === "COMPLETED") {
      // No URL means the query matched nothing at all — a legitimate outcome
      // for an empty store, not an error.
      if (!operation.url) return "";
      return downloadText(operation.url);
    }

    if (["FAILED", "CANCELED", "EXPIRED"].includes(operation.status)) {
      throw new ShopifyError(
        `Bulk operation ${operation.status}` +
          (operation.errorCode ? ` (${operation.errorCode})` : ""),
      );
    }
  }
}

async function cancelRunningOperation(client: ShopifyClient): Promise<void> {
  const polled = await client.query<{ currentBulkOperation: BulkOperation | null }>(POLL_QUERY);
  const operation = polled.currentBulkOperation;
  if (!operation) return;
  if (!["CREATED", "RUNNING"].includes(operation.status)) return;

  await client.query(CANCEL_MUTATION, { id: operation.id });

  // Cancellation is not instant; give it a moment before starting a new one.
  for (let i = 0; i < 10; i++) {
    await sleep(1000);
    const check = await client.query<{ currentBulkOperation: BulkOperation | null }>(POLL_QUERY);
    if (!check.currentBulkOperation) return;
    if (!["CREATED", "RUNNING", "CANCELING"].includes(check.currentBulkOperation.status)) return;
  }
}

async function downloadText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ShopifyError(`Could not download bulk result: HTTP ${response.status}`);
  }
  return response.text();
}

export interface BulkNode {
  id: string;
  __parentId?: string;
  [key: string]: unknown;
}

/**
 * Parse bulk JSONL into parents with their children grouped by type.
 *
 * Bulk output is one JSON object per line, depth-first: a product, then its
 * variants (each with `__parentId` pointing at the product), then the next
 * product. Children can arrive before the parent is fully processed, and a
 * child's parent is not guaranteed to have been seen yet, so this does two
 * passes rather than assuming order.
 *
 * `classify` maps a node to a bucket name — usually by inspecting its gid.
 */
export function parseBulkJsonl(
  jsonl: string,
  classify: (node: BulkNode) => string,
): {
  roots: BulkNode[];
  childrenOf: (parentId: string, bucket: string) => BulkNode[];
} {
  const roots: BulkNode[] = [];
  const children = new Map<string, Map<string, BulkNode[]>>();

  for (const line of jsonl.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let node: BulkNode;
    try {
      node = JSON.parse(trimmed) as BulkNode;
    } catch {
      // One malformed line should not lose the whole catalog.
      continue;
    }

    const parentId = node.__parentId;
    if (typeof parentId === "string") {
      const bucket = classify(node);
      const byBucket = children.get(parentId) ?? new Map<string, BulkNode[]>();
      const list = byBucket.get(bucket) ?? [];
      list.push(node);
      byBucket.set(bucket, list);
      children.set(parentId, byBucket);
    } else {
      roots.push(node);
    }
  }

  return {
    roots,
    childrenOf: (parentId, bucket) => children.get(parentId)?.get(bucket) ?? [],
  };
}

/** Bucket a node by the type segment of its gid: gid://shopify/<Type>/<id>. */
export function classifyByGid(node: BulkNode): string {
  const id = typeof node.id === "string" ? node.id : "";
  const match = id.match(/gid:\/\/shopify\/([^/]+)\//);
  return match?.[1] ?? "Unknown";
}
