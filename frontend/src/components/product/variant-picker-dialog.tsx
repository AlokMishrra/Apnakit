"use client";

import * as React from "react";
import { Check, Package, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Product, ProductVariant } from "@/types";

interface VariantPickerDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (variant: ProductVariant) => void;
}

export function VariantPickerDialog({
  product,
  open,
  onOpenChange,
  onAddToCart,
}: VariantPickerDialogProps) {
  const [selected, setSelected] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && product.variants?.length > 0) {
      const inStock = product.variants.find((v) => (v.stock ?? 0) > 0);
      setSelected(inStock?._id || product.variants[0]._id);
    }
  }, [open, product.variants]);

  const selectedVariant = product.variants?.find((v) => v._id === selected);
  const attributes = selectedVariant?.attributes || {};
  const attrEntries = Object.entries(attributes);

  const handleAdd = () => {
    if (!selectedVariant) return;
    onAddToCart(selectedVariant);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold leading-tight line-clamp-2">
                {product.name}
              </DialogTitle>
              {product.brand && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {product.brand?.name || product.brand}
                </p>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1 hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-5 py-4 max-h-[50vh] overflow-y-auto">
          <p className="text-sm font-medium text-foreground mb-3">
            Select Variant
          </p>
          <div className="space-y-2">
            {product.variants?.map((variant) => {
              const isSelected = selected === variant._id;
              const outOfStock = (variant.stock ?? 0) <= 0;
              const variantAttrs = variant.attributes || {};
              const attrSummary = Object.values(variantAttrs).join(", ");

              return (
                <button
                  key={variant._id}
                  disabled={outOfStock}
                  onClick={() => setSelected(variant._id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all",
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/50"
                      : "border-border hover:border-indigo-300 hover:bg-muted/50",
                    outOfStock && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                      isSelected
                        ? "border-indigo-600 bg-indigo-600"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {variant.name}
                    </p>
                    {attrSummary && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {attrSummary}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-foreground">
                      ₹{Number(variant.price).toLocaleString("en-IN")}
                    </p>
                    {variant.compareAtPrice &&
                      Number(variant.compareAtPrice) > Number(variant.price) && (
                        <p className="text-xs text-muted-foreground line-through">
                          ₹{Number(variant.compareAtPrice).toLocaleString("en-IN")}
                        </p>
                      )}
                  </div>
                  {outOfStock && (
                    <span className="text-xs font-medium text-destructive">
                      Out of Stock
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-4 border-t bg-muted/30">
          {selectedVariant && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Selected:</span>
              <span className="text-sm font-semibold text-foreground">
                ₹{Number(selectedVariant.price).toLocaleString("en-IN")}
              </span>
            </div>
          )}
          <Button
            onClick={handleAdd}
            disabled={!selectedVariant || (selectedVariant.stock ?? 0) <= 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Package className="mr-2 h-4 w-4" />
            {(selectedVariant?.stock ?? 0) <= 0 ? "Out of Stock" : "Add to Cart"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
