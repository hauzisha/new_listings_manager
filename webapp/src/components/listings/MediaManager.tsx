/**
 * MediaManager — read-only gallery for the full listing view.
 * Navigation arrows, thumbnail strip, counter. No edit controls.
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Film, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaManagerProps {
  listingId: string;
  images: string[];
  videos: string[];
}

export function MediaManager({ images, videos }: MediaManagerProps) {
  const items = [
    ...images.map((url) => ({ url, type: 'image' as const })),
    ...videos.map((url) => ({ url, type: 'video' as const })),
  ];
  const [current, setCurrent] = useState(0);

  if (items.length === 0) {
    return (
      <div className="aspect-video rounded-2xl bg-muted flex items-center justify-center border border-border">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No photos added yet</p>
        </div>
      </div>
    );
  }

  const item = items[Math.min(current, items.length - 1)];

  return (
    <div className="space-y-3">
      {/* Main viewer */}
      <div className="relative rounded-2xl overflow-hidden aspect-video bg-black">
        {item.type === 'image' ? (
          <img src={item.url} alt={`Media ${current + 1}`} className="w-full h-full object-cover" />
        ) : (
          <video src={item.url} controls className="w-full h-full object-contain" />
        )}

        {items.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((c) => (c === 0 ? items.length - 1 : c - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrent((c) => (c === items.length - 1 ? 0 : c + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full">
          {current + 1} / {items.length}
        </div>

        {item.type === 'video' && (
          <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5" /> Video
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all',
                i === current ? 'border-primary' : 'border-border opacity-60 hover:opacity-100'
              )}
            >
              {it.type === 'image' ? (
                <img src={it.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Film className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
