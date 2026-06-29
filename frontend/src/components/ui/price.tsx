"use client";

import { cn, formatCurrency, calculateDiscount } from "@/lib/utils";

interface PriceProps {
  amount: number;
  originalAmount?: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
  showDiscount?: boolean;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

const sizeClasses = {
  sm: { current: "text-sm", original: "text-xs", discount: "text-xs" },
  md: { current: "text-lg", original: "text-sm", discount: "text-xs" },
  lg: { current: "text-2xl font-bold", original: "text-base", discount: "text-sm" },
};

function Price({
  amount,
  originalAmount,
  currency = "INR",
  size = "md",
  showDiscount = true,
  className,
  orientation = "horizontal",
}: PriceProps) {
  const discount = originalAmount ? calculateDiscount(amount, originalAmount) : 0;
  const hasDiscount = discount > 0 && originalAmount;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5",
        orientation === "vertical" && "flex-col items-start gap-0",
        className
      )}
    >
      <span className={cn("text-foreground font-semibold", sizeClasses[size].current)}>
        {formatCurrency(amount, currency)}
      </span>
      {hasDiscount && (
        <>
          <span className={cn("text-muted-foreground line-through", sizeClasses[size].original)}>
            {formatCurrency(originalAmount, currency)}
          </span>
          {showDiscount && (
            <span className={cn("font-medium text-emerald-600", sizeClasses[size].discount)}>
              {discount}% off
            </span>
          )}
        </>
      )}
    </div>
  );
}

export { Price };
export type { PriceProps };
