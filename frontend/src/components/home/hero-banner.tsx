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

function HeroSkeleton() {
  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex min-h-[400px] animate-pulse items-center bg-gradient-to-r from-indigo-500 to-purple-600 sm:min-h-[480px] lg:min-h-[540px]">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-4">
            <Skeleton className="h-6 w-32 bg-white/30" />
            <Skeleton className="h-12 w-3/4 bg-white/30" />
            <Skeleton className="h-5 w-1/2 bg-white/30" />
            <Skeleton className="h-11 w-36 rounded-md bg-white/30" />
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
}: {
  src: string;
  isMuted: boolean;
  loop: boolean;
  setRef: (el: HTMLVideoElement | null) => void;
  onEnded: () => void;
}) {
  return (
    <video
      ref={setRef}
      src={src}
      autoPlay
      loop={loop}
      playsInline
      preload="auto"
      muted={isMuted}
      onEnded={loop ? undefined : onEnded}
      className="h-full w-full object-cover"
      onError={(e) => {
        (e.currentTarget as HTMLVideoElement).style.display = "none";
      }}
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
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner, index) => {
          const gradient = GRADIENTS[index % GRADIENTS.length];
          const link = banner.link || "#";
          const isExternal = /^https?:\/\//.test(link);
          const isVideo = (banner.mediaType || "IMAGE") === "VIDEO";
          const isMuted = mutedMap[banner.id] ?? true;
          const shouldLoop = isVideo && banner.loopVideo === true;
          return (
            <div
              key={banner.id}
              className={cn(
                "relative min-w-full text-white",
                !banner.image && `bg-gradient-to-r ${gradient}`
              )}
            >
              {banner.image && (
                <div className="absolute inset-0">
                  {isVideo ? (
                    <HeroVideo
                      src={banner.image}
                      isMuted={isMuted}
                      loop={shouldLoop}
                      setRef={(el) => {
                        videoRefs.current[banner.id] = el;
                      }}
                      onEnded={nextSlide}
                    />
                  ) : (
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                </div>
              )}

              {/* Video controls: only on the active video slide */}
              {isVideo && banner.image && index === currentSlide && (
                <div className="absolute right-4 bottom-4 z-20 flex items-center gap-2 sm:right-6 sm:bottom-6">
                  {/* Loop indicator (only when looping is enabled) */}
                  {shouldLoop && (
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600/80 text-white shadow-lg backdrop-blur-sm sm:h-10 sm:w-10"
                      aria-label="Video will loop"
                      title="Video loops and hero will not advance"
                    >
                      <Repeat className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  )}
                  {/* Play/Pause */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      togglePlayPause();
                    }}
                    aria-label={isPlaying ? "Pause video" : "Play video"}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:h-10 sm:w-10"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                  {/* Mute/Unmute */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleMute(banner.id);
                    }}
                    aria-label={isMuted ? "Unmute video" : "Mute video"}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:h-10 sm:w-10"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
              )}

              <div className="relative mx-auto flex min-h-[400px] max-w-7xl items-center px-4 py-16 sm:min-h-[480px] sm:px-6 lg:min-h-[540px] lg:px-8">
                <div className="max-w-2xl space-y-6">
                  {banner.showTitle !== false && (
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                      {banner.title}
                    </h1>
                  )}
                  {banner.subtitle && banner.showSubtitle !== false && (
                    <p className="text-lg text-white/90 sm:text-xl">{banner.subtitle}</p>
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

      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 bg-white/20 text-white hover:bg-white/30"
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 bg-white/20 text-white hover:bg-white/30"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {banners.map((banner, index) => {
              const isVidDot = (banner.mediaType || "IMAGE") === "VIDEO";
              return (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={cn(
                    "h-3 rounded-full transition-all flex items-center justify-center",
                    index === currentSlide ? "w-8 bg-white" : "w-3 bg-white/50"
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
  );
}
