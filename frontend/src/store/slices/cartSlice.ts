import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, Coupon, Product, ProductVariant } from '../../types';

interface CartState {
  items: CartItem[];
  coupon: Coupon | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  itemCount: number;
}

const GST_RATE = 0.18;

const calculateTotals = (state: CartState) => {
  state.subtotal = state.items.reduce((sum, item) => sum + item.totalPrice, 0);

  if (state.coupon) {
    if (state.coupon.discountType === 'percentage') {
      const calculatedDiscount = (state.subtotal * state.coupon.discountValue) / 100;
      state.discount = state.coupon.maxDiscount
        ? Math.min(calculatedDiscount, state.coupon.maxDiscount)
        : calculatedDiscount;
    } else {
      state.discount = Math.min(state.coupon.discountValue, state.subtotal);
    }
  } else {
    state.discount = 0;
  }

  const taxableAmount = state.subtotal - state.discount;
  state.tax = taxableAmount * GST_RATE;
  state.total = taxableAmount + state.tax;
  state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
};

const initialState: CartState = {
  items: [],
  coupon: null,
  subtotal: 0,
  discount: 0,
  tax: 0,
  total: 0,
  itemCount: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (
      state,
      action: PayloadAction<{
        product: Product;
        variant?: ProductVariant;
        quantity: number;
      }>
    ) => {
      const { product, variant, quantity } = action.payload;
      const price = variant ? variant.price : product.price;
      const existingItem = state.items.find(
        (item) =>
          item.product._id === product._id &&
          item.variant?._id === variant?._id
      );

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.totalPrice = existingItem.quantity * existingItem.price;
      } else {
        state.items.push({
          _id: `${product._id}${variant ? `-${variant._id}` : ''}`,
          product,
          variant,
          quantity,
          price,
          totalPrice: quantity * price,
        });
      }
      calculateTotals(state);
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item._id !== action.payload);
      calculateTotals(state);
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ itemId: string; quantity: number }>
    ) => {
      const { itemId, quantity } = action.payload;
      const item = state.items.find((i) => i._id === itemId);
      if (item) {
        item.quantity = quantity;
        item.totalPrice = quantity * item.price;
      }
      calculateTotals(state);
    },
    applyCoupon: (state, action: PayloadAction<Coupon>) => {
      state.coupon = action.payload;
      calculateTotals(state);
    },
    removeCoupon: (state) => {
      state.coupon = null;
      calculateTotals(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.coupon = null;
      calculateTotals(state);
    },
    setCart: (state, action: PayloadAction<CartState>) => {
      return action.payload;
    },
  },
});

export const {
  addItem,
  removeItem,
  updateQuantity,
  applyCoupon,
  removeCoupon,
  clearCart,
  setCart,
} = cartSlice.actions;
export default cartSlice.reducer;
