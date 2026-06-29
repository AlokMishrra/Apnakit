"use client";

import * as React from "react";
import { Loader2, Check, MapPin, Home, Briefcase, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  usePincodeCheck,
  type ServiceabilityState,
} from "@/hooks/use-pincode-check";
import { ServiceabilityBanner } from "@/hooks/serviceability-banner";

export interface AddressFormData {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  type: "HOME" | "WORK" | "OTHER";
  isDefault: boolean;
}

export const emptyAddressForm: AddressFormData = {
  name: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  type: "HOME",
  isDefault: false,
};

const TYPE_OPTIONS: { value: AddressFormData["type"]; label: string; Icon: any }[] = [
  { value: "HOME", label: "Home", Icon: Home },
  { value: "WORK", label: "Work", Icon: Briefcase },
  { value: "OTHER", label: "Other", Icon: Building2 },
];

export interface AddressFormProps {
  initial?: Partial<AddressFormData>;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  onSubmit: (data: AddressFormData) => Promise<void> | void;
  /** When true, the form is used inside a tight checkout drawer — tighter spacing */
  compact?: boolean;
  /** Hide the isDefault checkbox (e.g. when adding the first address from checkout) */
  hideDefault?: boolean;
}

export function AddressForm({
  initial,
  submitLabel = "Save Address",
  cancelLabel = "Cancel",
  onCancel,
  onSubmit,
  compact = false,
  hideDefault = false,
}: AddressFormProps) {
  const [form, setForm] = React.useState<AddressFormData>({
    ...emptyAddressForm,
    ...initial,
  });
  const [saving, setSaving] = React.useState(false);
  const { state: pinState, check: checkPincode, reset: resetPin } = usePincodeCheck();

  // Keep form in sync with `initial` when caller swaps the record being edited.
  // Only re-sync when the edited record itself changes (by id), not on every parent re-render.
  const editingId =
    (initial as any)?.id ?? (initial as any)?._id ?? null;
  React.useEffect(() => {
    if (!initial) return;
    setForm({ ...emptyAddressForm, ...initial });
    resetPin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  const set = <K extends keyof AddressFormData>(k: K, v: AddressFormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handlePincodeChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    set("pincode", cleaned);
    checkPincode(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.name ||
      !form.phone ||
      form.phone.length < 10 ||
      !form.addressLine1 ||
      !form.city ||
      !form.state ||
      !form.pincode ||
      form.pincode.length !== 6
    ) {
      return;
    }
    if (pinState.status === "unserviceable") {
      return;
    }
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  const isServiceable = pinState.status === "serviceable";
  const isUnserviceable = pinState.status === "unserviceable";
  const canSave =
    !!form.name &&
    !!form.phone &&
    form.phone.length >= 10 &&
    !!form.addressLine1 &&
    !!form.city &&
    !!form.state &&
    form.pincode.length === 6;

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", compact && "space-y-3")}>
      <div className={cn("grid gap-4", compact ? "sm:grid-cols-1" : "sm:grid-cols-2")}>
        <Input
          label="Full Name *"
          placeholder="Enter full name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          required
        />
        <Input
          label="Phone *"
          placeholder="10-digit phone"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
          required
        />

        <div className={compact ? "" : "sm:col-span-2"}>
          <label className="text-sm font-medium text-foreground">Pincode *</label>
          <div className="relative mt-1.5">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit pincode"
              value={form.pincode}
              onChange={(e) => handlePincodeChange(e.target.value)}
              className={cn(
                "pl-10 pr-10 transition-colors",
                isServiceable && "border-emerald-300 focus-visible:ring-emerald-100",
                isUnserviceable && "border-amber-300 focus-visible:ring-amber-100"
              )}
              required
            />
            {isServiceable && (
              <Check className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
            )}
          </div>
          <ServiceabilityBanner state={pinState} />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Address Type</label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map(({ value, label, Icon }) => (
              <button
                type="button"
                key={value}
                onClick={() => set("type", value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs font-medium transition-all",
                  form.type === value
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-border bg-white text-foreground hover:border-indigo-300"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <Input
            label="Address Line 1 *"
            placeholder="House No., Building, Street"
            value={form.addressLine1}
            onChange={(e) => set("addressLine1", e.target.value)}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Address Line 2"
            placeholder="Area, Landmark (optional)"
            value={form.addressLine2}
            onChange={(e) => set("addressLine2", e.target.value)}
          />
        </div>
        <Input
          label="City *"
          placeholder="Enter city"
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
          required
        />
        <Input
          label="State *"
          placeholder="Enter state"
          value={form.state}
          onChange={(e) => set("state", e.target.value)}
          required
        />
      </div>

      {!hideDefault && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => set("isDefault", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Set as default delivery address
        </label>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          disabled={!canSave || saving}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            {cancelLabel}
          </Button>
        )}
        {isUnserviceable && (
          <p className="text-xs text-amber-700">
            This pincode isn&apos;t serviceable yet — choose a different one to continue.
          </p>
        )}
      </div>
    </form>
  );
}

export type { ServiceabilityState };
