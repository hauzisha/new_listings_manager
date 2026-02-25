import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, Film, Loader2, AlertCircle, GripVertical } from 'lucide-react';
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

function MediaThumbnail({
  url,
  type,
  name,
  onRemove,
  disabled,
}: {
  url: string;
  type: 'image' | 'video';
  name: string;
  onRemove: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative group aspect-video rounded-lg overflow-hidden border border-border bg-muted">
      {type === 'image' ? (
        <img
          src={url}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="relative w-full h-full">
          <video
            src={url}
            className="w-full h-full object-cover"
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Film className="w-6 h-6 text-white" />
          </div>
        </div>
      )}
      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-1 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Type badge */}
      <div className="absolute bottom-1.5 left-1.5">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white flex items-center gap-1">
          {type === 'image' ? <Image className="w-2.5 h-2.5" /> : <Film className="w-2.5 h-2.5" />}
          {type === 'image' ? 'Photo' : 'Video'}
        </span>
      </div>
    </div>
  );
}

function UploadingItem({ name, progress }: { name: string; progress: number }) {
  return (
    <div className="relative aspect-video rounded-lg border border-border bg-muted flex flex-col items-center justify-center gap-2 p-3">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
      <p className="text-[10px] text-muted-foreground text-center truncate w-full max-w-full px-1">
        {name}
      </p>
      <div className="w-full bg-muted-foreground/20 rounded-full h-1">
        <div
          className="bg-primary h-1 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

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

  const allMedia: MediaFile[] = [
    ...images.map((url) => ({ url, type: 'image' as const, name: url.split('/').pop() || 'image' })),
    ...videos.map((url) => ({ url, type: 'video' as const, name: url.split('/').pop() || 'video' })),
  ];

  const canAddMore =
    images.length < maxImages || videos.length < maxVideos;

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const imageFiles = fileArray.filter((f) => f.type.startsWith('image/'));
      const videoFiles = fileArray.filter((f) => f.type.startsWith('video/'));

      const newImages = imageFiles.slice(0, maxImages - images.length);
      const newVideos = videoFiles.slice(0, maxVideos - videos.length);
      const toUpload = [...newImages, ...newVideos];

      if (toUpload.length === 0) {
        if (imageFiles.length > newImages.length) {
          toast.warning(`Maximum ${maxImages} images allowed`);
        }
        if (videoFiles.length > newVideos.length) {
          toast.warning(`Maximum ${maxVideos} videos allowed`);
        }
        return;
      }

      // Register all as uploading
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
            // Simulate progress tick
            setUploading((prev) =>
              prev.map((u, idx) =>
                idx === uploading.length + i ? { ...u, progress: 30 } : u
              )
            );

            const result = await uploadFile(file);

            setUploading((prev) =>
              prev.map((u, idx) =>
                idx === uploading.length + i ? { ...u, progress: 100 } : u
              )
            );

            if (itemType === 'image') {
              newImageUrls.push(result.url);
            } else {
              newVideoUrls.push(result.url);
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed';
            toast.error(`Failed to upload ${file.name}: ${msg}`, {
              description: 'Please try again',
            });
          }
        })
      );

      // Remove from uploading queue
      setUploading((prev) => prev.slice(toUpload.length));

      if (newImageUrls.length > 0) {
        onImagesChange([...images, ...newImageUrls]);
      }
      if (newVideoUrls.length > 0) {
        onVideosChange([...videos, ...newVideoUrls]);
      }

      const total = newImageUrls.length + newVideoUrls.length;
      if (total > 0) {
        toast.success(
          `${total} file${total > 1 ? 's' : ''} uploaded`,
          { description: 'Media added to your listing' }
        );
      }
    },
    [images, videos, maxImages, maxVideos, onImagesChange, onVideosChange, uploading.length]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  };

  const handleRemoveImage = (url: string) => {
    onImagesChange(images.filter((u) => u !== url));
  };

  const handleRemoveVideo = (url: string) => {
    onVideosChange(videos.filter((u) => u !== url));
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50',
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
              Drag & drop or click to browse · JPEG, PNG, WebP, MP4, MOV
            </p>
          </div>
          <div className="flex gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Image className="w-3.5 h-3.5" />
              {images.length}/{maxImages} photos
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Film className="w-3.5 h-3.5" />
              {videos.length}/{maxVideos} videos
            </span>
          </div>
        </div>
      </div>

      {/* Hint */}
      {allMedia.length === 0 && uploading.length === 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Images are compressed automatically to maintain quality while reducing file size.
        </p>
      )}

      {/* Media grid */}
      {(allMedia.length > 0 || uploading.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {allMedia.map((m) => (
            <MediaThumbnail
              key={m.url}
              url={m.url}
              type={m.type}
              name={m.name}
              onRemove={() =>
                m.type === 'image' ? handleRemoveImage(m.url) : handleRemoveVideo(m.url)
              }
              disabled={disabled}
            />
          ))}
          {uploading.map((u, i) => (
            <UploadingItem key={i} name={u.name} progress={u.progress} />
          ))}
        </div>
      )}
    </div>
  );
}
