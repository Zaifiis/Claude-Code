import { getPlatformSettings, getPlatforms } from "@/lib/data";
import { PlatformCard } from "./platform-card";

export default async function PlatformsPage() {
  const [platforms, settings] = await Promise.all([getPlatforms(), getPlatformSettings()]);
  const settingsByPlatform = new Map(settings.map((s) => [s.platform_id, s]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Platforms</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Turn platforms on or off and set the brand voice n8n uses when generating content for
          each one. n8n reads this table before calling the Idea Generator agent.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {platforms.map((platform) => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            settings={settingsByPlatform.get(platform.id)}
          />
        ))}
      </div>
    </div>
  );
}
