/**
 * VideoThumbnail — captures a frame at 3s from a video URL via canvas,
 * then renders it as a static image with a styled play button overlay.
 */

import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoThumbnailProps {
  src: string;
  className?: string;
  /** Size variant for the play button */
  playSize?: 'sm' | 'md' | 'lg';
}

function captureFrame(src: string, seekTo = 3): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      // Clamp seek time to video duration
      video.currentTime = Math.min(seekTo, video.duration * 0.1);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('No canvas context'));
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
      video.src = '';
    };

    video.onerror = () => reject(new Error('Video load failed'));
    video.src = src;
  });
}

export function VideoThumbnail({ src, className, playSize = 'md' }: VideoThumbnailProps) {
  const [thumb, setThumb] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    captureFrame(src)
      .then(setThumb)
      .catch(() => setFailed(true));
  }, [src]);

  const playBtn = {
    sm: 'w-7 h-7',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }[playSize];

  const iconSize = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  }[playSize];

  return (
    <div className={cn('relative overflow-hidden bg-black', className)}>
      {thumb && !failed ? (
        <img src={thumb} alt="Video preview" className="w-full h-full object-cover" />
      ) : (
        /* Gradient fallback while loading or on error */
        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
      )}

      {/* Dark vignette */}
      <div className="absolute inset-0 bg-black/25" />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            playBtn,
            'rounded-full flex items-center justify-center',
            'bg-white/20 backdrop-blur-sm border border-white/40',
            'shadow-[0_4px_24px_rgba(0,0,0,0.5)]',
            'transition-transform duration-200 group-hover:scale-110',
          )}
        >
          {/* Solid inner circle */}
          <div className={cn(
            'rounded-full bg-white flex items-center justify-center',
            playSize === 'sm' ? 'w-5 h-5' : playSize === 'md' ? 'w-8 h-8' : 'w-11 h-11',
          )}>
            <Play
              className={cn(iconSize, 'text-slate-900 fill-slate-900 ml-0.5')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
