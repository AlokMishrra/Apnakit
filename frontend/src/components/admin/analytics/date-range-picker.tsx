"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

export type DateRange = {
  label: string;
  value: string;
  startDate: Date;
  endDate: Date;
};

const PRESETS: DateRange[] = [
  {
    label: "Today",
    value: "today",
    startDate: new Date(),
    endDate: new Date(),
  },
  {
    label: "7 Days",
    value: "7days",
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  },
  {
    label: "30 Days",
    value: "30days",
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  },
  {
    label: "90 Days",
    value: "90days",
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  },
  {
    label: "1 Year",
    value: "1year",
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  },
];

interface DateRangePickerProps {
  value?: string;
  onChange?: (range: DateRange) => void;
  className?: string;
}

export function DateRangePicker({ value = "30days", onChange, className }: DateRangePickerProps) {
  const [selected, setSelected] = useState(value);

  const handleSelect = (preset: DateRange) => {
    setSelected(preset.value);
    onChange?.(preset);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1 rounded-lg border bg-white p-1 shadow-sm">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handleSelect(preset)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              selected === preset.value
                ? "bg-violet-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <button className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground">
        <Calendar className="h-4 w-4" />
        Custom
      </button>
    </div>
  );
}
