"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { button: "h-7 w-7", input: "h-7 w-10 text-xs" },
  md: { button: "h-9 w-9", input: "h-9 w-14 text-sm" },
  lg: { button: "h-11 w-11", input: "h-11 w-16 text-base" },
};

function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  disabled = false,
  className,
}: QuantitySelectorProps) {
  const config = sizeConfig[size];

  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= min && val <= max) {
      onChange(val);
    }
  };

  return (
    <div className={cn("flex items-center", className)}>
      <Button
        variant="outline"
        size="icon"
        className={cn("rounded-r-none border-r-0", config.button)}
        onClick={handleDecrement}
        disabled={disabled || value <= min}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center border-y border-input bg-background text-center font-medium outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          config.input
        )}
      />
      <Button
        variant="outline"
        size="icon"
        className={cn("rounded-l-none border-l-0", config.button)}
        onClick={handleIncrement}
        disabled={disabled || value >= max}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}

export { QuantitySelector };
export type { QuantitySelectorProps };
