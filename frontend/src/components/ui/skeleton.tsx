import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

function Skeleton({
  className,
  variant = "text",
  width,
  height,
  lines = 1,
  ...props
}: SkeletonProps) {
  if (variant === "text" && lines > 1) {
    return (
      <div className="space-y-2" {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "animate-shimmer rounded-md bg-muted",
              i === lines - 1 && "w-3/4",
              className
            )}
            style={{ width: width || "100%", height: height || 16 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "animate-shimmer bg-muted",
        {
          "rounded-md": variant === "text",
          "rounded-full": variant === "circular",
          "rounded-lg": variant === "rounded",
        },
        className
      )}
      style={{ width: width || "100%", height: height || 20 }}
      {...props}
    />
  );
}

function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border p-4 space-y-4", className)} {...props}>
      <Skeleton variant="rectangular" className="h-48 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export { Skeleton, SkeletonCard };
