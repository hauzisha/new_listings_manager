/**
 * MediaManager — gallery with inline media management:
 * - Set as default (moves to index 0)
 * - Drag to reorder thumbnails
 * - Rotate image (90° increments, applied via canvas)
 * - 3-dot menu per thumbnail: Edit Listing, Copy URL, Set Default
 */

import { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Film,
  Building2,
  MoreVertical,
  Star,
  RotateCw,
  Copy,
  Pencil,
  GripVertical,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  rotation?: number; // 0 | 90 | 180 | 270
}

interface MediaManagerProps {
  listingId: string;
  images: string[];
  videos: string[];
  editable?: boolean;
}

// ─── Rotate image URL via canvas ─────────────────────────────────────────────

async function rotateImageUrl(url: string, degrees: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const rad = (degrees * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      const w = Math.round(img.width * cos + img.height * sin);
      const h = Math.round(img.width * sin + img.height * cos);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.translate(w / 2, h / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ─── Dropdown menu ────────────────────────────────────────────────────────────

function ThumbnailMenu({
  isDefault,
  isImage,
  onSetDefault,
  onCopyUrl,
  onEditListing,
  onRotate,
}: {
  isDefault: boolean;
  isImage: boolean;
  onSetDefault: () => void;
  onCopyUrl: () => void;
  onEditListing: () => void;
  onRotate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
        title="Options"
      >
        <MoreVertical className="w-3 h-3" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={close} />
          <div className="absolute bottom-full right-0 mb-1.5 z-50 w-44 bg-popover border border-border rounded-xl shadow-lg overflow-hidden py-1">
            {!isDefault && (
              <MenuItem
                icon={<Star className="w-3.5 h-3.5" />}
                label="Set as Default"
                onClick={() => { onSetDefault(); close(); }}
              />
            )}
            {isImage && onRotate && (
              <MenuItem
                icon={<RotateCw className="w-3.5 h-3.5" />}
                label="Rotate 90°"
                onClick={() => { onRotate(); close(); }}
              />
            )}
            <MenuItem
              icon={<Copy className="w-3.5 h-3.5" />}
              label="Copy URL"
              onClick={() => { onCopyUrl(); close(); }}
            />
            <div className="my-1 border-t border-border" />
            <MenuItem
              icon={<Pencil className="w-3.5 h-3.5" />}
              label="Edit Listing"
              onClick={() => { onEditListing(); close(); }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors text-left"
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MediaManager({ listingId, images, videos, editable = false }: MediaManagerProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Build ordered media list
  const [items, setItems] = useState<MediaItem[]>(() => [
    ...images.map((url) => ({ url, type: 'image' as const, rotation: 0 })),
    ...videos.map((url) => ({ url, type: 'video' as const, rotation: 0 })),
  ]);
  const [current, setCurrent] = useState(0);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Drag state
  const dragIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const updateMedia = useMutation({
    mutationFn: (updated: MediaItem[]) => {
      const imgs = updated.filter((i) => i.type === 'image').map((i) => i.url);
      const vids = updated.filter((i) => i.type === 'video').map((i) => i.url);
      return api.put(`/api/listings/${listingId}`, { images: imgs, videos: vids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing', listingId] });
    },
    onError: () => toast.error('Failed to save changes'),
  });

  const saveItems = useCallback(
    (updated: MediaItem[]) => {
      setItems(updated);
      updateMedia.mutate(updated);
    },
    [updateMedia]
  );

  // ── Set default ────────────────────────────────────────────────────────────
  const handleSetDefault = (idx: number) => {
    const updated = [...items];
    const [moved] = updated.splice(idx, 1);
    updated.unshift(moved);
    setSavingIndex(0);
    saveItems(updated);
    setCurrent(0);
    setTimeout(() => setSavingIndex(null), 1500);
    toast.success('Set as default media');
  };

  // ── Rotate ─────────────────────────────────────────────────────────────────
  const handleRotate = async (idx: number) => {
    const item = items[idx];
    if (item.type !== 'image') return;
    try {
      const rotated = await rotateImageUrl(item.url, 90);
      const updated = items.map((it, i) =>
        i === idx ? { ...it, url: rotated, rotation: ((it.rotation ?? 0) + 90) % 360 } : it
      );
      saveItems(updated);
      toast.success('Image rotated');
    } catch {
      toast.error('Could not rotate image');
    }
  };

  // ── Copy URL ───────────────────────────────────────────────────────────────
  const handleCopyUrl = async (idx: number) => {
    try {
      await navigator.clipboard.writeText(items[idx].url);
      setCopiedIndex(idx);
      toast.success('URL copied');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error('Could not copy URL');
    }
  };

  // ── Drag reorder (thumbnails) ──────────────────────────────────────────────
  const handleDragStart = (idx: number) => {
    dragIndex.current = idx;
  };
  const handleDragEnter = (idx: number) => {
    dragOverIndex.current = idx;
  };
  const handleDragEnd = () => {
    const from = dragIndex.current;
    const to = dragOverIndex.current;
    if (from === null || to === null || from === to) {
      dragIndex.current = null;
      dragOverIndex.current = null;
      return;
    }
    const updated = [...items];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    dragIndex.current = null;
    dragOverIndex.current = null;
    saveItems(updated);
    setCurrent(to);
    toast.success('Order updated');
  };

  // ── Empty state ────────────────────────────────────────────────────────────
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
          <img
            src={item.url}
            alt={`Media ${current + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <video src={item.url} controls className="w-full h-full object-contain" />
        )}

        {/* Nav arrows */}
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

        {/* Counter */}
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full">
          {current + 1} / {items.length}
        </div>

        {/* Video badge */}
        {item.type === 'video' && (
          <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5" /> Video
          </div>
        )}

        {/* Default badge */}
        {current === 0 && (
          <div className="absolute top-3 right-3 bg-amber-500/90 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3 fill-white" /> Default
          </div>
        )}
      </div>

      {/* Thumbnails strip */}
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 select-none">
          {items.map((it, i) => (
            <div
              key={`${it.url}-${i}`}
              draggable={editable}
              onDragStart={() => handleDragStart(i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={cn(
                'relative flex-shrink-0 w-16 h-12 rounded-lg overflow-visible border-2 transition-all group/thumb cursor-pointer',
                i === current ? 'border-primary' : 'border-border opacity-60 hover:opacity-100'
              )}
            >
              {/* Thumbnail image/video */}
              <div
                className="w-full h-full rounded-[6px] overflow-hidden"
                onClick={() => setCurrent(i)}
              >
                {it.type === 'image' ? (
                  <img src={it.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Film className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Default star indicator */}
              {i === 0 && (
                <div className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                  <Star className="w-2.5 h-2.5 fill-white text-white" />
                </div>
              )}

              {/* Copied indicator */}
              {copiedIndex === i && (
                <div className="absolute inset-0 rounded-[6px] bg-black/60 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Saving indicator */}
              {savingIndex === i && (
                <div className="absolute inset-0 rounded-[6px] bg-black/40 flex items-center justify-center">
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                </div>
              )}

              {/* Drag handle (edit mode) */}
              {editable && (
                <div className="absolute top-0.5 left-0.5 opacity-0 group-hover/thumb:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-3 h-3 text-white drop-shadow" />
                </div>
              )}

              {/* 3-dot menu */}
              {editable && (
                <div className="absolute bottom-0.5 right-0.5 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                  <ThumbnailMenu
                    isDefault={i === 0}
                    isImage={it.type === 'image'}
                    onSetDefault={() => handleSetDefault(i)}
                    onRotate={it.type === 'image' ? () => handleRotate(i) : undefined}
                    onCopyUrl={() => handleCopyUrl(i)}
                    onEditListing={() => navigate(`/dashboard/agent/listings/edit/${listingId}`)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Single item: show options row */}
      {items.length === 1 && editable && (
        <div className="flex justify-end">
          <ThumbnailMenu
            isDefault={true}
            isImage={items[0].type === 'image'}
            onSetDefault={() => {}}
            onRotate={items[0].type === 'image' ? () => handleRotate(0) : undefined}
            onCopyUrl={() => handleCopyUrl(0)}
            onEditListing={() => navigate(`/dashboard/agent/listings/edit/${listingId}`)}
          />
        </div>
      )}
    </div>
  );
}
