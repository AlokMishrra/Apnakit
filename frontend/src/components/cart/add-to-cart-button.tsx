"use client";

import * as React from "react";
import { ShoppingCart, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCartActions, useCartItem } from "@/hooks/use-cart-actions";
import { useSelector } from "react-redux";
import { VariantPickerDialog } from "@/components/product/variant-picker-dialog";
import type { Product, ProductVariant } from "@/types";

type AddState = "idle" | "adding" | "added";
type RemoveState = "idle" | "removing";

interface AddToCartButtonProps {
  product: Product;
  /** If true, navigates to /checkout after a successful add (gated on serviceability). */
  buyNow?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** ms before reverting "Added" back to "Add to Cart". Default 1800. */
  revertMs?: number;
  /** Custom label override (idle state). */
  label?: string;
}

/**
 * Reusable Add-to-Cart button with **instant optimistic UI feedback**:
 *
 * - Not in cart → "Add to Cart" (indigo)
 * - On click → instantly updates Redux cart (header badge jumps),
 *   then flips to "Added ✓" (green) for `revertMs`, then back to "Add"
 * - Already in cart → "Remove" (rose/red) — click removes the line
 * - In either case the underlying network call is debounced so rapid
 *   clicks don't fire multiple requests
 */
export function AddToCartButton({
  product,
  buyNow = false,
  size = "md",
  className,
  revertMs = 1800,
  label = "Add to Cart",
}: AddToCartButtonProps) {
  const productId = product._id || (product as any).id;
  const cartItem = useCartItem(productId);
  const { setQuantity, remove } = useCartActions();
  const isSyncing = useSelector(
    (state: any) => !!state?.cart?.pendingByItem?.[`${productId}`]
  );
  const inCart = !!cartItem && cartItem.quantity > 0;
  const [addState, setAddState] = React.useState<AddState>("idle");
  const [removeState, setRemoveState] = React.useState<RemoveState>("idle");
  const [variantOpen, setVariantOpen] = React.useState(false);
  const revertTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasMultipleVariants = (product.variants?.length ?? 0) > 1;

  React.useEffect(
    () => () => {
      if (revertTimer.current) clearTimeout(revertTimer.current);
    },
    []
  );

  const handleAdd = () => {
    if (inCart) return;
    if (addState !== "idle") return;
    if ((product.stock ?? 0) <= 0) return;
    if (hasMultipleVariants) {
      setVariantOpen(true);
      return;
    }
    setAddState("adding");
    setQuantity(product, 1, { goToCheckout: buyNow });
    setAddState("added");
    if (revertTimer.current) clearTimeout(revertTimer.current);
    revertTimer.current = setTimeout(() => setAddState("idle"), revertMs);
  };

  const handleVariantAdd = (variant: ProductVariant) => {
    setAddState("adding");
    setQuantity(product, 1, { goToCheckout: buyNow, variantId: variant._id });
    setAddState("added");
    if (revertTimer.current) clearTimeout(revertTimer.current);
    revertTimer.current = setTimeout(() => setAddState("idle"), revertMs);
  };

  const handleRemove = () => {
    if (!cartItem || removeState !== "idle") return;
    setRemoveState("removing");
    remove(product);
    if (revertTimer.current) clearTimeout(revertTimer.current);
    revertTimer.current = setTimeout(() => setRemoveState("idle"), 350);
  };

  const inStock = (product.stock ?? 0) > 0;

  if (!inStock) {
    return (
      <Button size={size} variant="outline" className={cn("w-full", className)} disabled>
        Out of Stock
      </Button>
    );
  }

  // Already in cart → "Remove" button
  if (inCart) {
    return (
      <Button
        size={size}
        variant="outline"
        className={cn(
          "w-full border-rose-200 bg-rose-50/40 text-rose-600 transition-colors",
          "hover:border-rose-400 hover:bg-rose-100 hover:text-rose-700 active:scale-[0.97]",
          className
        )}
        onClick={handleRemove}
        disabled={removeState !== "idle" || isSyncing}
        aria-label={`Remove ${product.name} from cart`}
      >
        {removeState === "removing" || isSyncing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <X className="mr-2 h-4 w-4" />
        )}
        {removeState === "removing" ? "Removing..." : "Remove"}
      </Button>
    );
  }

  // Not in cart → animated Add to Cart
  const buttonLabel =
    addState === "adding"
      ? "Adding..."
      : addState === "added"
      ? "Added"
      : buyNow
      ? "Buy Now"
      : label;
  const Icon = addState === "adding" ? Loader2 : addState === "added" ? Check : ShoppingCart;
  const colorClass =
    addState === "added"
      ? "bg-emerald-600 hover:bg-emerald-700"
      : "bg-indigo-600 hover:bg-indigo-700";

  return (
    <>
    <Button
      size={size}
      className={cn(
        "w-full text-white transition-all duration-200 active:scale-[0.97]",
        colorClass,
        className
      )}
      onClick={handleAdd}
      disabled={addState !== "idle"}
      aria-live="polite"
    >
      <Icon
        className={cn(
          "mr-2 h-4 w-4 transition-transform",
          addState === "adding" && "animate-spin",
          addState === "added" && "scale-110"
        )}
      />
      {buttonLabel}
    </Button>
    {hasMultipleVariants && (
      <VariantPickerDialog
        product={product}
        open={variantOpen}
        onOpenChange={setVariantOpen}
        onAddToCart={handleVariantAdd}
      />
    )}
    </>
  );
}
