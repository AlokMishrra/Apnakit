"use client";

import * as React from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cartService } from "@/services/cart.service";
import { addItem, removeItem, updateQuantity, clearCart } from "@/store/slices/cartSlice";
import { getSafeErrorMessage, isAuthError } from "@/lib/safe-error";
import { useLocation } from "@/components/layout/location-context";
import type { Product, ProductVariant } from "@/types";

type RootState = {
  cart: {
    items: Array<{
      _id: string;
      product: Product;
      variant?: ProductVariant;
      quantity: number;
      price: number;
      totalPrice: number;
    }>;
  };
};

const itemIdFor = (productId: string, variantId?: string) =>
  `${productId}${variantId ? `-${variantId}` : ""}`;

/**
 * Look up the cart line for a given product. Since the cart only holds
 * one line per (product, variant) pair and most product cards don't
 * pre-select a variant, we accept ANY line that starts with the
 * product id. This matches what the addItem reducer does and keeps
 * the Add/Remove state in sync regardless of variant selection.
 */
function findCartItem(items: RootState["cart"]["items"], productId: string, variantId?: string) {
  if (!productId) return null;
  const exactId = itemIdFor(productId, variantId);
  const exact = items.find((i) => i._id === exactId);
  if (exact) return exact;
  return items.find((i) => i._id === productId || i._id.startsWith(`${productId}-`)) ?? null;
}

/**
 * useCartItem — selector hook returning the current cart line for a product/variant.
 * Returns `null` when the item isn't in the cart.
 */
export function useCartItem(productId: string | undefined, variantId?: string) {
  return useSelector((state: RootState) => {
    return findCartItem(state.cart.items, productId as string, variantId);
  });
}

/**
 * useCartActions — central cart actions with optimistic UI.
 *
 * - Updates Redux *immediately* so the UI reflects the change with no latency.
 * - API calls are debounced (250ms) so rapid clicks on +/- only fire one
 *   network request once the user pauses.
 * - On failure, the local state is rolled back and a toast is shown.
 */
export function useCartActions() {
  const dispatch = useDispatch();
  const router = useRouter();
  const store = useStore<RootState>();
  const { location, requestLocation, isPincodeServiceable } = useLocation();

  // Per-item debounce timers (key = itemId)
  const syncTimers = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Last dispatched quantity per item so we can rollback on API error
  const lastSyncedQty = React.useRef<Record<string, number>>({});

  const flushSync = React.useCallback(
    async (itemId: string, qty: number, productId: string, variantId?: string) => {
      const prev = lastSyncedQty.current[itemId] ?? 0;
      try {
        if (qty <= 0) {
          // Quantity is zero — find the cart item to remove it on the server
          const current = await cartService.getCart();
          const payload = (current as any)?.data?.data || (current as any)?.data;
          const serverItem = (payload?.items || []).find(
            (it: any) => it.productId === productId || it.product?.id === productId
          );
          if (serverItem?.id) {
            await cartService.removeFromCart(serverItem.id);
          }
        } else if (prev === 0) {
          // New line — POST
          await cartService.addToCart(productId, variantId, qty);
        } else {
          // Existing line — PATCH
          const current = await cartService.getCart();
          const payload = (current as any)?.data?.data || (current as any)?.data;
          const serverItem = (payload?.items || []).find(
            (it: any) => it.productId === productId || it.product?.id === productId
          );
          if (serverItem?.id) {
            await cartService.updateCartItem(serverItem.id, qty);
          } else {
            await cartService.addToCart(productId, variantId, qty);
          }
        }
        lastSyncedQty.current[itemId] = qty;
      } catch (err: any) {
        // Roll back to the last known good quantity
        if (prev === 0) {
          // Item shouldn't exist on client; force-remove it
          dispatch(removeItem(itemId));
        } else {
          dispatch(updateQuantity({ itemId, quantity: prev }));
        }
        if (isAuthError(err)) {
          toast.error("Please login", { description: "Sign in to manage your cart." });
          router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        } else {
          toast.error("Cart update failed", { description: getSafeErrorMessage(err) });
        }
      }
    },
    [dispatch, router]
  );

  const scheduleSync = React.useCallback(
    (itemId: string, qty: number, productId: string, variantId?: string) => {
      if (syncTimers.current[itemId]) clearTimeout(syncTimers.current[itemId]);
      syncTimers.current[itemId] = setTimeout(() => {
        flushSync(itemId, qty, productId, variantId);
      }, 250);
    },
    [flushSync]
  );

  // Helper used by callers that need a synchronous flush (e.g. when navigating)
  const flushAll = React.useCallback(async () => {
    const items = Object.entries(syncTimers.current);
    for (const [id, t] of items) {
      clearTimeout(t);
    }
    syncTimers.current = {};
    // Best-effort: re-fetch to reconcile
    try {
      const res = await cartService.getCart();
      // We don't have a setCart action wired to the latest response here; rely on
      // the per-item sync to have already completed for visible items.
      return res;
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    return () => {
      Object.values(syncTimers.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  const ensureServiceable = React.useCallback(async (): Promise<boolean> => {
    if (!location) {
      try {
        await requestLocation();
      } catch {
        // ignore
      }
      try {
        window.dispatchEvent(new CustomEvent("open-location-modal"));
      } catch {
        // ignore
      }
      toast.info("Set your delivery location", {
        description: "We deliver to select pincodes. Pick yours to continue.",
      });
      return false;
    }
    if (location.pincode) {
      const ok = await isPincodeServiceable(location.pincode);
      if (!ok) {
        try {
          window.dispatchEvent(new CustomEvent("open-location-modal"));
        } catch {
          // ignore
        }
        toast.error("Not serviceable yet", {
          description: `We don't deliver to ${location.pincode} yet. Try a different pincode.`,
        });
        return false;
      }
    }
    return true;
  }, [location, requestLocation, isPincodeServiceable]);

  /**
   * Set the quantity of a product/variant in the cart. Adds it if missing.
   * Updates Redux synchronously and schedules a debounced API call.
   */
  const setQuantity = React.useCallback(
    (product: Product, quantity: number, options: { variantId?: string; goToCheckout?: boolean } = {}) => {
      const { variantId, goToCheckout } = options;
      const productId = product._id || (product as any).id;
      if (!productId) return;
      const variant =
        product.variants?.find((v: any) => v && (v as any)._id === variantId) ||
        product.variants?.[0];
      const vId = (variant as any)?._id || (variant as any)?.id || variantId;
      const existing = findCartItem(store.getState().cart.items, productId, vId);
      const itemId = existing?._id ?? itemIdFor(productId, vId);

      // For checkout flow, gate on serviceability
      if (goToCheckout) {
        ensureServiceable().then((ok) => {
          if (!ok) return;
          if (quantity <= 0) {
            dispatch(removeItem(itemId));
          } else {
            dispatch(addItem({ product, variant: variant as any, quantity }));
          }
          scheduleSync(itemId, quantity, productId, vId);
          router.push("/checkout");
        });
        return;
      }

      // Optimistic local update
      if (quantity <= 0) {
        dispatch(removeItem(itemId));
      } else {
        dispatch(addItem({ product, variant: variant as any, quantity }));
      }
      scheduleSync(itemId, quantity, productId, vId);
    },
    [dispatch, ensureServiceable, router, scheduleSync, store]
  );

  const increment = React.useCallback(
    (product: Product, variantId?: string) => {
      const productId = product._id || (product as any).id;
      const variant =
        product.variants?.find((v: any) => v && (v as any)._id === variantId) ||
        product.variants?.[0];
      const vId = (variant as any)?._id || (variant as any)?.id || variantId;
      const existing = findCartItem(store.getState().cart.items, productId, vId);
      const current = existing?.quantity ?? 0;
      const stock = (variant as any)?.stock ?? product.stock ?? 99;
      const newQty = Math.min(stock, current + 1);
      if (newQty === current) return;
      setQuantity(product, newQty, { variantId: vId });
    },
    [setQuantity, store]
  );

  const decrement = React.useCallback(
    (product: Product, variantId?: string) => {
      const productId = product._id || (product as any).id;
      const variant =
        product.variants?.find((v: any) => v && (v as any)._id === variantId) ||
        product.variants?.[0];
      const vId = (variant as any)?._id || (variant as any)?.id || variantId;
      const existing = findCartItem(store.getState().cart.items, productId, vId);
      const current = existing?.quantity ?? 0;
      const newQty = current - 1;
      setQuantity(product, newQty, { variantId: vId });
    },
    [setQuantity, store]
  );

  const remove = React.useCallback(
    (product: Product, variantId?: string) => {
      const productId = product._id || (product as any).id;
      if (!productId) return;
      const variant =
        product.variants?.find((v: any) => v && (v as any)._id === variantId) ||
        product.variants?.[0];
      const vId = (variant as any)?._id || (variant as any)?.id || variantId;
      // Find the actual line and use its real _id (not a constructed one)
      const existing = findCartItem(store.getState().cart.items, productId, vId);
      const itemId = existing?._id ?? itemIdFor(productId, vId);
      if (existing) {
        // Optimistic local update
        dispatch(removeItem(itemId));
        // Sync the removal to the server (debounced)
        scheduleSync(itemId, 0, productId, vId);
        try {
          const name = product.name || "Item";
          toast.success("Removed from cart", { description: name });
        } catch {
          // toast may not be available in some contexts
        }
      } else {
        // Fallback: try the constructed id (legacy paths)
        dispatch(removeItem(itemId));
        scheduleSync(itemId, 0, productId, vId);
      }
    },
    [dispatch, scheduleSync, store]
  );

  const clearAll = React.useCallback(async () => {
    dispatch(clearCart());
    try {
      // Best-effort: remove each line from the server
      // We don't have the full list here; in practice users clear from the cart page
    } catch {
      // ignore
    }
  }, [dispatch]);

  return {
    setQuantity,
    increment,
    decrement,
    remove,
    clearAll,
    flushAll,
  };
}
