import { getContentItems, getPlatforms } from "@/lib/data";
import { QueueItem } from "./queue-item";

export default async function QueuePage() {
  const [items, platforms] = await Promise.all([
    getContentItems({ status: ["Pending", "Ready"] }),
    getPlatforms(),
  ]);
  const platformById = new Map(platforms.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Queue</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Review what n8n generated. Approving sets status to Ready, which is what the publish
          workflow picks up.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-6 text-sm text-neutral-500">
          Nothing waiting for review right now.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <QueueItem key={item.id} item={item} platform={platformById.get(item.platform_id)} />
          ))}
        </div>
      )}
    </div>
  );
}
