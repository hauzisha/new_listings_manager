import { useState, useRef, useCallback } from 'react';
import {
  Upload, X, Image, Film, Loader2, AlertCircle,
  GripVertical, Star, RotateCw, MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/lib/upload';
import { toast } from 'sonner';

interface MediaFile {
  url: string;
  type: 'image' | 'video';
  name: string;
}

interface MediaUploadProps {
  images: string[];
  videos: string[];
  onImagesChange: (urls: string[]) => void;
  onVideosChange: (urls: string[]) => void;
  maxImages?: number;
  maxVideos?: number;
  disabled?: boolean;
}

// ─── Rotate image via canvas ──────────────────────────────────────────────────

async function rotateImageUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d')!;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ─── Per-thumbnail 3-dot menu ─────────────────────────────────────────────────

function ThumbnailMenu({
  isDefault,
  isImage,
  onSetDefault,
  onRotate,
}: {
  isDefault: boolean;
  isImage: boolean;
  onSetDefault: () => void;
  onRotate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // Hide menu if there's nothing to show (default image without rotate option)
  if (isDefault && !onRotate) return null;

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
      >
        <MoreVertical className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div className="absolute bottom-full right-0 mb-1.5 z-50 w-40 bg-popover border border-border rounded-xl shadow-lg overflow-hidden py-1">
            {!isDefault && (
              <button
                type="button"
                onClick={() => { onSetDefault(); close(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors text-left"
              >
                <Star className="w-3.5 h-3.5 text-amber-500" />
                Set as Default
              </button>
            )}
            {isImage && onRotate && (
              <button
                type="button"
                onClick={() => { onRotate(); close(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors text-left"
              >
                <RotateCw className="w-3.5 h-3.5 text-muted-foreground" />
                Rotate 90°
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Single thumbnail ─────────────────────────────────────────────────────────

function MediaThumbnail({
  url,
  type,
  name,
  isDefault,
  index,
  onRemove,
  onSetDefault,
  onRotate,
  onDragStart,
  onDragEnter,
  onDragEnd,
  disabled,
}: {
  url: string;
  type: 'image' | 'video';
  name: string;
  isDefault: boolean;
  index: number;
  onRemove: () => void;
  onSetDefault: () => void;
  onRotate: () => void;
  onDragStart: (i: number) => void;
  onDragEnter: (i: number) => void;
  onDragEnd: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      draggable={!disabled}
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className="relative group aspect-video rounded-lg overflow-hidden border border-border bg-muted cursor-grab active:cursor-grabbing"
    >
      {type === 'image' ? (
        <img src={url} alt={name} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="relative w-full h-full">
          <video src={url} className="w-full h-full object-cover" preload="metadata" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Film className="w-6 h-6 text-white" />
          </div>
        </div>
      )}

      {/* Default star badge */}
      {isDefault && (
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-amber-500/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
          <Star className="w-2.5 h-2.5 fill-white" />
          Default
        </div>
      )}

      {/* Type badge */}
      {!isDefault && (
        <div className="absolute bottom-1.5 left-1.5">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white flex items-center gap-1">
            {type === 'image' ? <Image className="w-2.5 h-2.5" /> : <Film className="w-2.5 h-2.5" />}
            {type === 'image' ? 'Photo' : 'Video'}
          </span>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

      {/* Drag handle — top left on hover */}
      {!disabled && (
        <div className="absolute top-1.5 right-7 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-white drop-shadow" />
        </div>
      )}

      {/* Remove button — top right on hover */}
      {!disabled && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 3-dot menu — bottom right on hover */}
      {!disabled && (
        <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <ThumbnailMenu
            isDefault={isDefault}
            isImage={type === 'image'}
            onSetDefault={onSetDefault}
            onRotate={type === 'image' ? onRotate : undefined}
          />
        </div>
      )}
    </div>
  );
}

// ─── Uploading placeholder ────────────────────────────────────────────────────

function UploadingItem({ name, progress }: { name: string; progress: number }) {
  return (
    <div className="relative aspect-video rounded-lg border border-border bg-muted flex flex-col items-center justify-center gap-2 p-3">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
      <p className="text-[10px] text-muted-foreground text-center truncate w-full px-1">{name}</p>
      <div className="w-full bg-muted-foreground/20 rounded-full h-1">
        <div className="bg-primary h-1 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MediaUpload({
  images,
  videos,
  onImagesChange,
  onVideosChange,
  maxImages = 20,
  maxVideos = 5,
  disabled = false,
}: MediaUploadProps) {
  const [uploading, setUploading] = useState<{ name: string; progress: number; type: 'image' | 'video' }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  // Combined ordered list
  const allMedia: MediaFile[] = [
    ...images.map((url) => ({ url, type: 'image' as const, name: url.split('/').pop() || 'image' })),
    ...videos.map((url) => ({ url, type: 'video' as const, name: url.split('/').pop() || 'video' })),
  ];

  const canAddMore = images.length < maxImages || videos.length < maxVideos;

  // ── Upload ──────────────────────────────────────────────────────────────────
  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const imageFiles = fileArray.filter((f) => f.type.startsWith('image/'));
      const videoFiles = fileArray.filter((f) => f.type.startsWith('video/'));

      const newImages = imageFiles.slice(0, maxImages - images.length);
      const newVideos = videoFiles.slice(0, maxVideos - videos.length);
      const toUpload = [...newImages, ...newVideos];

      if (toUpload.length === 0) {
        if (imageFiles.length > newImages.length) toast.warning(`Maximum ${maxImages} images allowed`);
        if (videoFiles.length > newVideos.length) toast.warning(`Maximum ${maxVideos} videos allowed`);
        return;
      }

      const uploadingItems = toUpload.map((f) => ({
        name: f.name,
        progress: 10,
        type: f.type.startsWith('image/') ? ('image' as const) : ('video' as const),
      }));
      setUploading((prev) => [...prev, ...uploadingItems]);

      const newImageUrls: string[] = [];
      const newVideoUrls: string[] = [];

      await Promise.allSettled(
        toUpload.map(async (file, i) => {
          const itemType = file.type.startsWith('image/') ? 'image' : 'video';
          try {
            setUploading((prev) =>
              prev.map((u, idx) => (idx === uploading.length + i ? { ...u, progress: 30 } : u))
            );
            const result = await uploadFile(file);
            setUploading((prev) =>
              prev.map((u, idx) => (idx === uploading.length + i ? { ...u, progress: 100 } : u))
            );
            if (itemType === 'image') newImageUrls.push(result.url);
            else newVideoUrls.push(result.url);
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed';
            toast.error(`Failed to upload ${file.name}: ${msg}`);
          }
        })
      );

      setUploading((prev) => prev.slice(toUpload.length));
      if (newImageUrls.length > 0) onImagesChange([...images, ...newImageUrls]);
      if (newVideoUrls.length > 0) onVideosChange([...videos, ...newVideoUrls]);

      const total = newImageUrls.length + newVideoUrls.length;
      if (total > 0) toast.success(`${total} file${total > 1 ? 's' : ''} uploaded`);
    },
    [images, videos, maxImages, maxVideos, onImagesChange, onVideosChange, uploading.length]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) { processFiles(e.target.files); e.target.value = ''; }
  };

  // ── Reorder (drag) ──────────────────────────────────────────────────────────
  const handleDragStart = (i: number) => { dragIndex.current = i; };
  const handleDragEnter = (i: number) => { dragOverIndex.current = i; };
  const handleDragEnd = () => {
    const from = dragIndex.current;
    const to = dragOverIndex.current;
    dragIndex.current = null;
    dragOverIndex.current = null;
    if (from === null || to === null || from === to) return;

    const updated = [...allMedia];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);

    onImagesChange(updated.filter((m) => m.type === 'image').map((m) => m.url));
    onVideosChange(updated.filter((m) => m.type === 'video').map((m) => m.url));
    toast.success('Order updated');
  };

  // ── Set default (move to index 0) ───────────────────────────────────────────
  const handleSetDefault = (i: number) => {
    const item = allMedia[i];
    if (item.type === 'image') {
      // Promote image to front of images array
      const newImages = [item.url, ...images.filter((u) => u !== item.url)];
      onImagesChange(newImages);
    } else {
      // Promote video: move it to images[0] and remove from videos
      // so the gallery cover is always images[0]
      const newImages = [item.url, ...images];
      const newVideos = videos.filter((u) => u !== item.url);
      onImagesChange(newImages);
      onVideosChange(newVideos);
    }
    toast.success('Set as default');
  };

  // ── Rotate ──────────────────────────────────────────────────────────────────
  const handleRotate = async (i: number) => {
    const item = allMedia[i];
    if (item.type !== 'image') return;
    try {
      const rotated = await rotateImageUrl(item.url);
      const newImages = allMedia
        .map((m, idx) => (m.type === 'image' ? (idx === i ? rotated : m.url) : null))
        .filter(Boolean) as string[];
      onImagesChange(newImages);
      toast.success('Image rotated');
    } catch {
      toast.error('Could not rotate image');
    }
  };

  // ── Remove ──────────────────────────────────────────────────────────────────
  const handleRemove = (i: number) => {
    const item = allMedia[i];
    if (item.type === 'image') onImagesChange(images.filter((u) => u !== item.url));
    else onVideosChange(videos.filter((u) => u !== item.url));
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!disabled && e.dataTransfer.files.length) processFiles(e.dataTransfer.files); }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {dragOver ? 'Drop to upload' : 'Upload photos & videos'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Drag & drop or click · JPEG, PNG, WebP, MP4, MOV
            </p>
          </div>
          <div className="flex gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Image className="w-3.5 h-3.5" />{images.length}/{maxImages} photos
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Film className="w-3.5 h-3.5" />{videos.length}/{maxVideos} videos
            </span>
          </div>
        </div>
      </div>

      {allMedia.length === 0 && uploading.length === 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Images are compressed automatically. Drag thumbnails to reorder.
        </p>
      )}

      {(allMedia.length > 0 || uploading.length > 0) && (
        <>
          {allMedia.length > 1 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <GripVertical className="w-3.5 h-3.5 flex-shrink-0" />
              Drag to reorder · hover an image for more options
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {allMedia.map((m, i) => (
              <MediaThumbnail
                key={`${m.url}-${i}`}
                url={m.url}
                type={m.type}
                name={m.name}
                isDefault={i === 0}
                index={i}
                onRemove={() => handleRemove(i)}
                onSetDefault={() => handleSetDefault(i)}
                onRotate={() => handleRotate(i)}
                onDragStart={handleDragStart}
                onDragEnter={handleDragEnter}
                onDragEnd={handleDragEnd}
                disabled={disabled}
              />
            ))}
            {uploading.map((u, i) => (
              <UploadingItem key={i} name={u.name} progress={u.progress} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
