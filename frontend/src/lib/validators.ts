import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const productFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  brand: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "popular", "rating"]).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  inStock: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export type ProductFilterInput = z.infer<typeof productFilterSchema>;

export const addressSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z
    .string()
    .min(4, "Pincode must be at least 4 digits")
    .max(10, "Pincode is too long"),
  country: z.string().min(2, "Country is required").default("India"),
  isDefault: z.boolean().optional().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;

export const checkoutSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  paymentMethod: z.enum(["cod", "online", "upi", "card", "wallet"]),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const couponSchema = z.object({
  code: z.string().min(3, "Coupon code must be at least 3 characters").max(20),
  discountType: z.enum(["percentage", "flat"]),
  discountValue: z.number().positive("Discount must be positive"),
  minPurchase: z.number().min(0).optional(),
  maxDiscount: z.number().positive().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  usageLimit: z.number().positive().optional(),
});

export type CouponInput = z.infer<typeof couponSchema>;

export const profileSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional(),
  avatar: z.string().url("Invalid URL").optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const reviewSchema = z.object({
  rating: z.number().min(1, "Rating is required").max(5),
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  comment: z.string().min(10, "Review must be at least 10 characters").max(1000),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export const searchSchema = z.object({
  q: z.string().min(1, "Search query is required").max(200),
  category: z.string().optional(),
  sort: z.enum(["relevance", "price_asc", "price_desc", "newest"]).optional(),
});

export type SearchInput = z.infer<typeof searchSchema>;
