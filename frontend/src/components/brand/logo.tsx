import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string | null;
  className?: string;
  imageClassName?: string;
  showWordmark?: boolean;
  variant?: "color" | "white" | "dark";
}

// Source logo.jpeg is 527 × 170 — aspect ratio ≈ 3.1 : 1 (wide).
// Sizing is controlled by the parent's className (e.g. h-10, h-12, h-16).
// The image's intrinsic aspect ratio is preserved via w-auto.
const ASPECT = 527 / 170;

export function Logo({
  href = "/",
  className,
  imageClassName,
  showWordmark = true,
}: LogoProps) {
  const wordmark = (
    <span
      className={cn("inline-flex items-center", className)}
      aria-label="ApnaKit"
    >
      {showWordmark ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo.png"
          alt="ApnaKit"
          className={cn("h-full w-auto", imageClassName)}
          draggable={false}
        />
      ) : (
        // Square crop of the wordmark (left "A" portion)
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo.png"
          alt="ApnaKit"
          className={cn("h-full w-auto object-contain object-left", imageClassName)}
          draggable={false}
        />
      )}
    </span>
  );

  if (!href) return wordmark;

  return (
    <Link
      href={href}
      aria-label="ApnaKit home"
      className="inline-flex items-center"
    >
      {wordmark}
    </Link>
  );
}

// Helper for callers that want a pre-computed width to prevent CLS.
export function logoWidthForHeight(h: number): number {
  return Math.round(h * ASPECT);
}
