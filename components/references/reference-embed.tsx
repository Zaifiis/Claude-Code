"use client";

import * as React from "react";
import { ExternalLink, Play, LinkIcon, ImageOff } from "lucide-react";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { PLATFORM_MAP, type PlatformKey } from "@/lib/domain/constants";
import { cn } from "@/lib/utils";

const YT_EMBED_PREFIX = "https://www.youtube-nocookie.com/embed/";

export interface EmbedData {
  url: string;
  platform: PlatformKey;
  embed_url: string | null;
  thumbnail_url: string | null;
  title?: string;
}

/**
 * Renders a safe preview for a saved reference.
 * - YouTube: a real, responsive embedded player, lazy-loaded on click.
 * - Everything else: a rich fallback card (thumbnail if we have one, otherwise
 *   a clean platform placeholder) with an "Open Original" affordance.
 * We NEVER iframe an arbitrary user URL — only our self-constructed YouTube
 * embed URLs are ever placed in an <iframe>.
 */
export function ReferenceEmbed({ data, className }: { data: EmbedData; className?: string }) {
  const [playing, setPlaying] = React.useState(false);
  const [thumbError, setThumbError] = React.useState(false);
  const canEmbed = !!data.embed_url && data.embed_url.startsWith(YT_EMBED_PREFIX);

  if (canEmbed) {
    return (
      <div className={cn("relative aspect-video w-full overflow-hidden rounded-[var(--radius-md)] bg-black", className)}>
        {playing ? (
          <iframe
            src={`${data.embed_url}?autoplay=1&rel=0`}
            title={data.title || "YouTube video"}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full"
            aria-label="Play video"
          >
            {data.thumbnail_url && !thumbError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.thumbnail_url}
                alt={data.title || "Video thumbnail"}
                className="h-full w-full object-cover"
                onError={() => setThumbError(true)}
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-surface-2">
                <PlatformIcon platform={data.platform} className="size-10 text-faint" />
              </div>
            )}
            <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />
            <span className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform duration-150 group-hover:scale-110">
              <Play className="ml-0.5 size-6 fill-current" />
            </span>
          </button>
        )}
      </div>
    );
  }

  // Non-embeddable fallback
  return (
    <ReferenceFallback data={data} className={className} thumbError={thumbError} onThumbError={() => setThumbError(true)} />
  );
}

function ReferenceFallback({
  data,
  className,
  thumbError,
  onThumbError,
}: {
  data: EmbedData;
  className?: string;
  thumbError: boolean;
  onThumbError: () => void;
}) {
  const platform = PLATFORM_MAP[data.platform];
  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-2",
        className,
      )}
    >
      {data.thumbnail_url && !thumbError ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.thumbnail_url}
            alt={data.title || "Reference thumbnail"}
            className="h-full w-full object-cover"
            onError={onThumbError}
            loading="lazy"
          />
          <span className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/25" />
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center">
          <span
            className="flex size-11 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: platform?.color ?? "var(--faint)" }}
          >
            <PlatformIcon platform={data.platform} className="size-5" />
          </span>
          <span className="flex items-center gap-1 text-[11px] font-medium text-faint">
            {data.platform === "other" ? <LinkIcon className="size-3" /> : <ImageOff className="size-3" />}
            No preview available
          </span>
        </div>
      )}
      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
        <ExternalLink className="size-3" /> Open Original
      </span>
    </a>
  );
}
