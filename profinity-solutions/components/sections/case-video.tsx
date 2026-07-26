'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

function youTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return m ? m[1] : null;
}

// 16:9 media card. Takes an mp4 or YouTube URL (from config). With no src it
// shows a branded poster fallback. Click to play.
export function CaseVideo({ src, label }: { src: string; label: string }) {
  const [playing, setPlaying] = useState(false);
  const yt = src ? youTubeId(src) : null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-surface">
      {playing && src ? (
        yt ? (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${yt}?autoplay=1`}
            title={label}
            allow="accelerated-encoding; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video className="h-full w-full" src={src} controls autoPlay playsInline />
        )
      ) : (
        <button
          type="button"
          onClick={() => src && setPlaying(true)}
          disabled={!src}
          aria-label={src ? `Play ${label}` : `${label} — video coming soon`}
          className="group relative flex h-full w-full items-center justify-center"
        >
          {/* Branded poster */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(80% 80% at 50% 30%, rgba(33,89,201,0.35), transparent 70%), linear-gradient(135deg, #0a1226, #0e1a33)',
            }}
          />
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(125,211,252,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.12)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-gradient shadow-[0_10px_30px_-6px_rgba(59,130,246,0.7)] transition-transform group-hover:scale-110">
              <Play className="h-6 w-6 translate-x-0.5 fill-white text-white" />
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {src ? 'Watch the case study' : 'Video coming soon'}
            </span>
          </div>
        </button>
      )}
    </div>
  );
}
