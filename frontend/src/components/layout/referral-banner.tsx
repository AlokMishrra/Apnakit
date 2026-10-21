"use client";

import { Tag, X } from "lucide-react";
import { useState } from "react";
import { useReferral } from "@/lib/referral";

/**
 * Shows the discount a referred visitor is eligible for, so the customer
 * knows the partner code was picked up from the link they followed.
 */
export function ReferralBanner() {
  const { code, discountPercent, loading } = useReferral();
  const [dismissed, setDismissed] = useState(false);

  if (loading || dismissed || !code || !discountPercent) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-[#5b0a0a] px-4 py-2 text-white">
      <p className="flex items-center gap-2 text-sm">
        <Tag className="h-4 w-4 shrink-0" />
        <span>
          Partner code <span className="font-semibold">{code}</span> applied — you get{" "}
          <span className="font-semibold">{discountPercent}% off</span> your order.
        </span>
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss referral offer"
        className="shrink-0 rounded p-1 hover:bg-white/15"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
