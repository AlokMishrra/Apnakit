"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, indeterminate, onCheckedChange, onChange, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    // Combine forwarded ref with internal ref
    const setRefs = (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    };

    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = !!indeterminate;
      }
    }, [indeterminate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked, e);
      }
      onChange?.(e);
    };

    return (
      <label
        className={cn(
          "relative inline-flex h-4 w-4 flex-shrink-0 cursor-pointer items-center justify-center rounded border-2 transition-colors",
          checked || indeterminate
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input bg-background hover:border-primary/60",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
          className
        )}
      >
        <input
          ref={setRefs}
          type="checkbox"
          checked={!!checked}
          onChange={handleChange}
          className="absolute inset-0 cursor-pointer opacity-0"
          {...props}
        />
        {indeterminate ? (
          <Minus className="h-3 w-3" />
        ) : checked ? (
          <Check className="h-3 w-3" />
        ) : null}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
