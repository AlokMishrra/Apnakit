"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  className,
  inputClassName,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(() => {
    const arr = new Array(length).fill("");
    if (value) {
      for (let i = 0; i < Math.min(value.length, length); i++) {
        arr[i] = value[i] || "";
      }
    }
    return arr;
  });

  // Sync external value -> digits
  useEffect(() => {
    const arr = new Array(length).fill("");
    for (let i = 0; i < Math.min(value.length, length); i++) {
      arr[i] = value[i] || "";
    }
    setDigits(arr);
  }, [value, length]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  const updateValue = useCallback(
    (newDigits: string[]) => {
      setDigits(newDigits);
      const joined = newDigits.join("");
      onChange(joined);
      if (joined.length === length && newDigits.every((d) => d !== "")) {
        onComplete?.(joined);
      }
    },
    [length, onChange, onComplete]
  );

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return; // digits only
    const char = val.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    updateValue(newDigits);
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = "";
        updateValue(newDigits);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        updateValue(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const joined = digits.join("");
      if (joined.length === length) onComplete?.(joined);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    const newDigits = new Array(length).fill("");
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    updateValue(newDigits);
    const lastIndex = Math.min(pasted.length, length) - 1;
    inputRefs.current[lastIndex]?.focus();
  };

  return (
    <div className={cn("flex justify-center gap-2", className)}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[i] || ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`OTP digit ${i + 1}`}
          className={cn(
            "h-12 w-12 sm:h-14 sm:w-14 rounded-lg border-2 bg-white text-center text-xl font-semibold text-foreground",
            "focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20",
            "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
            !digits[i] && "border-gray-300",
            digits[i] && "border-indigo-600",
            inputClassName
          )}
        />
      ))}
    </div>
  );
}
