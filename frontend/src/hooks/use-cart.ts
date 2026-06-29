import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import {
  setCart,
  addItem,
  removeItem,
  updateQuantity,
  applyCoupon,
  removeCoupon,
  clearCart,
} from '../store/slices/cartSlice';
import { cartService } from '../services/cart.service';
import toast from 'react-hot-toast';

export const useCart = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const {
    data: cart,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await cartService.getCart();
      dispatch(setCart(response.data));
      return response.data;
    },
    retry: false,
  });

  const addToCartMutation = useMutation({
    mutationFn: ({
      productId,
      variantId,
      quantity,
    }: {
      productId: string;
      variantId?: string;
      quantity: number;
    }) => cartService.addToCart(productId, variantId, quantity),
    onSuccess: (response) => {
      dispatch(setCart(response.data));
      toast.success('Added to cart!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add to cart');
    },
  });

  const updateCartItemMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartService.updateCartItem(itemId, quantity),
    onSuccess: (response) => {
      dispatch(setCart(response.data));
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update cart');
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: (itemId: string) => cartService.removeFromCart(itemId),
    onSuccess: (response) => {
      dispatch(setCart(response.data));
      toast.success('Removed from cart');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove from cart');
    },
  });

  const applyCouponMutation = useMutation({
    mutationFn: (code: string) => cartService.applyCoupon(code),
    onSuccess: (response) => {
      dispatch(setCart(response.data.cart));
      dispatch(applyCoupon(response.data.coupon));
      toast.success('Coupon applied!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Invalid coupon code');
    },
  });

  const removeCouponMutation = useMutation({
    mutationFn: () => cartService.removeCoupon(),
    onSuccess: (response) => {
      dispatch(setCart(response.data));
      dispatch(removeCoupon());
      toast.success('Coupon removed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove coupon');
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (cart?.items) {
        for (const item of cart.items) {
          await cartService.removeFromCart(item._id);
        }
      }
    },
    onSettled: () => {
      dispatch(clearCart());
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Cart cleared');
    },
  });

  return {
    cart,
    isLoading,
    error,
    itemCount: cart?.itemCount || 0,
    subtotal: cart?.subtotal || 0,
    tax: cart?.tax || 0,
    discount: cart?.discount || 0,
    total: cart?.total || 0,
    addToCart: addToCartMutation,
    updateCartItem: updateCartItemMutation,
    removeFromCart: removeFromCartMutation,
    applyCoupon: applyCouponMutation,
    removeCoupon: removeCouponMutation,
    clearCart: clearCartMutation,
  };
};
