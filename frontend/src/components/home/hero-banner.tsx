"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Repeat,
  Pause,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { bannerService } from "@/services/banner.service";
import { getSafeErrorMessage } from "@/lib/safe-error";

const GRADIENTS = [
  "from-indigo-600 to-purple-700",
  "from-violet-600 to-fuchsia-700",
  "from-emerald-600 to-teal-700",
  "from-amber-500 to-orange-600",
  "from-rose-600 to-pink-700",
  "from-sky-600 to-blue-700",
];

const IMAGE_ROTATE_MS = 5000;

function getGoogleDriveFileId(url: string): string | null {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2) return match2[1];
  return null;
}

function isEmbedUrl(url: string): boolean {
  if (getGoogleDriveFileId(url)) return true;
  if (/youtube\.com\/embed\//.test(url)) return true;
  if (/youtu\.be\//.test(url)) return true;
  if (/youtube\.com\/watch\?v=/.test(url)) return true;
  if (/vimeo\.com\//.test(url)) return true;
  if (/screenpal\.com\//.test(url)) return true;
  return false;
}

function getEmbedUrl(url: string): string {
  const gdriveId = getGoogleDriveFileId(url);
  if (gdriveId) return `https://drive.google.com/file/d/${gdriveId}/preview`;
  if (/youtu\.be\/([a-zA-Z0-9_-]+)/.test(url)) {
    const id = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)?.[1];
    if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1`;
  }
  if (/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/.test(url)) {
    const id = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/)?.[1];
    if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1`;
  }
  if (/screenpal\.com\/watch\/([a-zA-Z0-9_-]+)/.test(url)) {
    const id = url.match(/screenpal\.com\/watch\/([a-zA-Z0-9_-]+)/)?.[1];
    if (id) return `https://go.screenpal.com/embed/${id}`;
  }
  return url;
}

function HeroSkeleton() {
  return (
    <div className="w-full px-3 sm:px-4 lg:px-6">
      <div className="relative mx-auto max-w-7xl aspect-video overflow-hidden rounded-2xl sm:rounded-3xl">
        <div className="flex h-full animate-pulse bg-gradient-to-r from-indigo-500 to-purple-600">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-4">
              <Skeleton className="h-6 w-32 bg-white/30" />
              <Skeleton className="h-12 w-3/4 bg-white/30" />
              <Skeleton className="h-5 w-1/2 bg-white/30" />
                <Skeleton className="h-11 w-36 rounded-md bg-white/30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroVideo({
  src,
  isMuted,
  loop,
  setRef,
  onEnded,
  onReady,
}: {
  src: string;
  isMuted: boolean;
  loop: boolean;
  setRef: (el: HTMLVideoElement | null) => void;
  onEnded: () => void;
  onReady?: () => void;
}) {
  const [ready, setReady] = useState(false);
  return (
    <video
      ref={(el) => {
        setRef(el);
        if (el) {
          el.onloadeddata = () => {
            setReady(true);
            onReady?.();
          };
        }
      }}
      src={src}
      autoPlay
      loop={loop}
      playsInline
      preload="auto"
      muted={isMuted}
      onEnded={loop ? undefined : onEnded}
      className={cn(
        "h-full w-full object-cover transition-opacity duration-300",
        ready ? "opacity-100" : "opacity-0"
      )}
      onError={(e) => {
        const video = e.currentTarget as HTMLVideoElement;
        const parent = video.parentElement;
        if (parent) parent.style.display = "none";
      }}
    />
  );
}

function HeroImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [ready, setReady] = useState(false);
  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        "max-h-full max-w-full object-contain transition-opacity duration-300",
        ready ? "opacity-100" : "opacity-0"
      )}
      onLoad={() => setReady(true)}
      onError={(e) => {
        const target = e.currentTarget as HTMLImageElement;
        const parent = target.parentElement;
        if (parent) parent.style.display = "none";
      }}
    />
  );
}

function HeroEmbed({
  src,
  onReady,
}: {
  src: string;
  onReady?: () => void;
}) {
  return (
    <iframe
      src={getEmbedUrl(src)}
      className="h-full w-full border-0"
      allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
      allowFullScreen
      onLoad={() => onReady?.()}
    />
  );
}

export function HeroBanner() {
  const [banners, setBanners] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Map of bannerId -> muted state (default: true). Persists across slides.
  const [mutedMap, setMutedMap] = useState<Record<string, boolean>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const res = await bannerService.getBanners("HERO");
        const data = res?.data || res;
        const list = Array.isArray(data) ? data : data?.banners || [];
        const activeBanners = (Array.isArray(list) ? list : []).filter(
          (b: any) => b.isActive !== false
        );
        setBanners(activeBanners);
        // Initialize all video banners as muted (default)
        const initialMute: Record<string, boolean> = {};
        activeBanners.forEach((b: any) => {
          if ((b.mediaType || "IMAGE") === "VIDEO") {
            initialMute[b.id] = true;
          }
        });
        setMutedMap(initialMute);
      } catch (err) {
        const msg = getSafeErrorMessage(err, "");
        if (msg && !msg.toLowerCase().includes("network")) setError(true);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  const nextSlide = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const toggleMute = (bannerId: string) => {
    setMutedMap((prev) => ({ ...prev, [bannerId]: !prev[bannerId] }));
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  // Determine if current slide is a video
  const currentBanner = banners[currentSlide];
  const isCurrentVideo = currentBanner && (currentBanner.mediaType || "IMAGE") === "VIDEO";
  const doesCurrentLoop = isCurrentVideo && currentBanner?.loopVideo === true;

  // Auto-rotate: only for image slides, never for video slides
  useEffect(() => {
    if (isPaused || banners.length <= 1) return;
    // Videos: do not auto-advance. The video's `ended` event drives navigation,
    // and looping videos never advance.
    if (isCurrentVideo) return;
    const interval = setInterval(nextSlide, IMAGE_ROTATE_MS);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, banners.length, isCurrentVideo, currentSlide]);

  // Pause non-active videos, play active
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([id, el]) => {
      if (!el) return;
      if (id === banners[currentSlide]?.id) {
        if (isPlaying) {
          el.play().catch(() => {
            /* autoplay blocked — ignore */
          });
        } else {
          el.pause();
        }
      } else {
        el.pause();
        // Reset non-active videos to start (helps when revisiting the slide)
        try {
          el.currentTime = 0;
        } catch {
          /* ignore */
        }
      }
    });
  }, [currentSlide, banners, isPlaying]);

  if (loading) {
    return <HeroSkeleton />;
  }

  if (error || banners.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-3 sm:px-4 lg:px-6">
      <div
        className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl shadow-lg sm:rounded-3xl sm:shadow-xl"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="relative w-full aspect-video sm:aspect-[16/9] lg:aspect-auto lg:h-[400px]">
          <div
            className="absolute inset-0 flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {banners.map((banner, index) => {
              const gradient = GRADIENTS[index % GRADIENTS.length];
              const link = banner.link || "#";
              const isExternal = /^https?:\/\//.test(link);
              const isVideo = (banner.mediaType || "IMAGE") === "VIDEO";
              const isMuted = mutedMap[banner.id] ?? true;
              const shouldLoop = isVideo && banner.loopVideo === true;
              const useEmbed = isVideo && isEmbedUrl(banner.image);
              return (
                <div
                  key={banner.id}
                  className={cn(
                    "relative h-full w-full flex-shrink-0 text-white flex items-center justify-center",
                    `bg-gradient-to-r ${gradient}`
                  )}
                >
                  {banner.image && (
                    <>
                      {isVideo ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {useEmbed ? (
                            <HeroEmbed
                              src={banner.image}
                              onReady={() => {}}
                            />
                          ) : (
                            <HeroVideo
                              src={banner.image}
                              isMuted={isMuted}
                              loop={shouldLoop}
                              setRef={(el) => {
                                videoRefs.current[banner.id] = el;
                              }}
                              onEnded={nextSlide}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <HeroImage
                            src={banner.image}
                            alt={banner.title}
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                        </div>
                      )}
                    </>
                  )}

                  {isVideo && !useEmbed && banner.image && index === currentSlide && (
                    <div className="absolute right-3 bottom-3 z-20 flex items-center gap-2 sm:right-6 sm:bottom-6">
                      {shouldLoop && (
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/80 text-white shadow-lg backdrop-blur-sm sm:h-10 sm:w-10"
                          aria-label="Video will loop"
                          title="Video loops and hero will not advance"
                        >
                          <Repeat className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          togglePlayPause();
                        }}
                        aria-label={isPlaying ? "Pause video" : "Play video"}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:h-10 sm:w-10"
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleMute(banner.id);
                        }}
                        aria-label={isMuted ? "Unmute video" : "Mute video"}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:h-10 sm:w-10"
                      >
                        {isMuted ? (
                          <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </button>
                    </div>
                  )}

                  <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-8">
                    <div className="max-w-2xl space-y-3 sm:space-y-4">
                      {banner.showTitle !== false && (
                        <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-4xl">
                          {banner.title}
                        </h1>
                      )}
                      {banner.subtitle && banner.showSubtitle !== false && (
                        <p className="text-sm text-white/90 sm:text-base lg:text-lg">{banner.subtitle}</p>
                      )}
                      {banner.link && banner.showButton !== false && (
                        <Button
                          size="lg"
                          className="bg-white text-gray-900 hover:bg-gray-100"
                          asChild
                        >
                          {isExternal ? (
                            <a href={link} target="_blank" rel="noopener noreferrer">
                              Shop Now
                            </a>
                          ) : (
                            <Link href={link}>Shop Now</Link>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation arrows */}
        {banners.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 bg-white/20 text-white hover:bg-white/30 sm:left-4"
              onClick={prevSlide}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 bg-white/20 text-white hover:bg-white/30 sm:right-4"
              onClick={nextSlide}
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>

            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-4">
              {banners.map((banner, index) => {
                const isVidDot = (banner.mediaType || "IMAGE") === "VIDEO";
                return (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                    className={cn(
                      "h-2.5 rounded-full transition-all flex items-center justify-center sm:h-3",
                      index === currentSlide ? "w-7 sm:w-8 bg-white" : "w-2.5 bg-white/50"
                    )}
                  >
                    {isVidDot && index === currentSlide && (
                      <span className="sr-only">Video slide</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
