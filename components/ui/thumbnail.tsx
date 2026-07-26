"use client";

import * as React from "react";
import { PlatformIcon } from "./platform-icon";
import { PLATFORM_MAP, type PlatformKey } from "@/lib/domain/constants";
import { cn } from "@/lib/utils";

/**
 * Image thumbnail that degrades gracefully: if the src is missing or fails to
 * load (offline, hotlink-blocked, deleted), it shows a clean platform
 * placeholder instead of a broken-image icon.
 */
export function Thumbnail({
  src,
  platform,
  alt = "",
  imgClassName,
}: {
  src: string | null | undefined;
  platform: PlatformKey;
  alt?: string;
  imgClassName?: string;
}) {
  const [error, setError] = React.useState(false);
  const p = PLATFORM_MAP[platform];

  if (!src || error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface-2" style={{ color: p?.color }}>
        <PlatformIcon platform={platform} className="size-8 opacity-80" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      loading="lazy"
      className={cn("h-full w-full object-cover", imgClassName)}
    />
  );
}
