"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  showCount?: boolean;
  count?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

function Rating({
  value,
  maxRating = 5,
  size = "md",
  showValue = false,
  showCount = false,
  count = 0,
  onChange,
  readonly = true,
  className,
}: RatingProps) {
  const [hoverValue, setHoverValue] = React.useState(0);

  const displayValue = hoverValue || value;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {Array.from({ length: maxRating }).map((_, i) => {
          const starValue = i + 1;
          const filled = starValue <= Math.floor(displayValue);
          const halfFilled = !filled && starValue - 0.5 <= displayValue;

          return (
            <button
              key={i}
              type="button"
              disabled={readonly}
              className={cn(
                "relative focus:outline-none",
                !readonly && "cursor-pointer hover:scale-110 transition-transform",
                readonly && "cursor-default"
              )}
              onMouseEnter={() => !readonly && setHoverValue(starValue)}
              onMouseLeave={() => !readonly && setHoverValue(0)}
              onClick={() => !readonly && onChange?.(starValue)}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  filled
                    ? "fill-amber-400 text-amber-400"
                    : halfFilled
                    ? "fill-amber-400/50 text-amber-400"
                    : "fill-muted text-muted-foreground"
                )}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-foreground ml-0.5">{value.toFixed(1)}</span>
      )}
      {showCount && count > 0 && (
        <span className="text-sm text-muted-foreground">({count.toLocaleString()})</span>
      )}
    </div>
  );
}

export { Rating };
export type { RatingProps };
