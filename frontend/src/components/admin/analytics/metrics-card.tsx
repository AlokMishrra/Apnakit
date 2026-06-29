"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  suffix?: string;
  className?: string;
}

export function MetricsCard({
  title,
  value,
  change,
  changeLabel = "vs last period",
  icon,
  iconBg = "bg-violet-100",
  suffix,
  className,
}: MetricsCardProps) {
  const getChangeColor = () => {
    if (change === undefined || change === null) return "text-muted-foreground";
    if (change > 0) return "text-emerald-600";
    if (change < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  const getChangeIcon = () => {
    if (change === undefined || change === null) return <Minus className="h-3 w-3" />;
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    if (change < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-1.5">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {suffix && (
              <span className="text-sm font-medium text-muted-foreground">{suffix}</span>
            )}
          </div>
          {change !== undefined && (
            <div className={cn("flex items-center gap-1 text-xs font-medium", getChangeColor())}>
              {getChangeIcon()}
              <span>{Math.abs(change)}%</span>
              <span className="text-muted-foreground">{changeLabel}</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl text-violet-600",
              iconBg
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
