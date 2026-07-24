import { getContentItems, getPlatforms } from "@/lib/data";
import Link from "next/link";

export default async function OverviewPage() {
  const [platforms, items] = await Promise.all([getPlatforms(), getContentItems()]);

  const platformById = new Map(platforms.map((p) => [p.id, p]));

  const stats = platforms.map((platform) => {
    const platformItems = items.filter((item) => item.platform_id === platform.id);
    return {
      platform,
      pending: platformItems.filter((i) => i.status === "Pending").length,
      ready: platformItems.filter((i) => i.status === "Ready").length,
      posted: platformItems.filter((i) => i.status === "Posted").length,
    };
  });

  const recent = items.slice(0, 8);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Overview</h1>
        <p className="mt-1 text-sm text-neutral-400">
          What your n8n automation has generated and posted, per platform.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ platform, pending, ready, posted }) => (
          <div
            key={platform.id}
            className="rounded-lg border border-neutral-800 bg-neutral-900 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-100">{platform.display_name}</p>
              <span
                className={`h-2 w-2 rounded-full ${
                  platform.enabled ? "bg-emerald-500" : "bg-neutral-700"
                }`}
                title={platform.enabled ? "Active" : "Disabled"}
              />
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <dt className="text-xs text-neutral-500">Pending</dt>
                <dd className="text-lg font-semibold text-neutral-100">{pending}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Ready</dt>
                <dd className="text-lg font-semibold text-neutral-100">{ready}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Posted</dt>
                <dd className="text-lg font-semibold text-neutral-100">{posted}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-neutral-800 bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
          <h2 className="text-sm font-medium text-neutral-100">Recent activity</h2>
          <Link href="/queue" className="text-xs text-neutral-400 hover:text-neutral-200">
            Go to queue &rarr;
          </Link>
        </div>
        <ul className="divide-y divide-neutral-800">
          {recent.length === 0 ? (
            <li className="px-4 py-6 text-sm text-neutral-500">
              Nothing generated yet. Your n8n idea-generation workflow will populate this.
            </li>
          ) : (
            recent.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-neutral-100">{item.title ?? "(untitled)"}</p>
                  <p className="text-xs text-neutral-500">
                    {platformById.get(item.platform_id)?.display_name ?? "Unknown platform"} ·{" "}
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: "bg-amber-500/10 text-amber-400",
    Ready: "bg-sky-500/10 text-sky-400",
    Posted: "bg-emerald-500/10 text-emerald-400",
    Rejected: "bg-red-500/10 text-red-400",
  };
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}
