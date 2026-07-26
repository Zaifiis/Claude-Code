import * as React from "react";
import { Globe } from "lucide-react";
import type { PlatformKey } from "@/lib/domain/constants";

/**
 * Monochrome brand glyphs drawn with currentColor so they inherit text colour.
 * Simplified marks — recognisable without shipping full brand assets.
 */
export function PlatformIcon({
  platform,
  className = "size-4",
}: {
  platform: PlatformKey;
  className?: string;
}) {
  const common = { className, viewBox: "0 0 24 24", "aria-hidden": true } as const;
  switch (platform) {
    case "youtube":
    case "youtube_shorts":
      return (
        <svg {...common} fill="currentColor">
          <path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 3.9 12 3.9 12 3.9s-7.5 0-9.4.5A3 3 0 0 0 .5 6.5C0 8.4 0 12 0 12s0 3.6.5 5.5a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.5.5-5.5s0-3.6-.5-5.5ZM9.6 15.5v-7l6.3 3.5-6.3 3.5Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common} fill="currentColor">
          <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common} fill="currentColor">
          <path d="M16.5 3c.3 2.1 1.5 3.6 3.5 3.9v2.6c-1.3.1-2.5-.3-3.5-1v5.9c0 3.6-2.7 6.1-6 6.1a5.9 5.9 0 0 1-6-6c0-3.5 2.9-6 6.3-5.9v2.7c-.3-.1-.6-.1-.9-.1a3.2 3.2 0 0 0 .1 6.4c1.7 0 3-1.3 3-3.2V3h3.5Z" />
        </svg>
      );
    case "x":
      return (
        <svg {...common} fill="currentColor">
          <path d="M18.9 2H22l-7.3 8.4L23 22h-6.7l-5.2-6.9L5.1 22H2l7.8-9L1.5 2h6.9l4.7 6.3L18.9 2Zm-1.2 18h1.7L7.4 3.8H5.6L17.7 20Z" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common} fill="currentColor">
          <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9v2.2h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12Z" />
        </svg>
      );
    default:
      return <Globe className={className} aria-hidden />;
  }
}
