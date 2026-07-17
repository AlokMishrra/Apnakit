export interface User {
  _id?: string;
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin' | 'seller' | 'delivery' | 'CUSTOMER' | 'ADMIN' | 'SELLER' | 'DELIVERY';
  isVerified?: boolean;
  isActive?: boolean;
  addresses?: Address[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  id: string;
  _id?: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  type?: "HOME" | "WORK" | "OTHER";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stock: number;
  images: ProductImage[];
  category: Category;
  brand: Brand;
  variants: ProductVariant[];
  tags: string[];
  specifications: Specification[];
  ratings: {
    average: number;
    count: number;
  };
  isActive: boolean;
  isFeatured: boolean;
  isVeg: boolean | null;
  isTrending: boolean;
  isBestSeller: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface ProductVariant {
  _id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  attributes: Record<string, string>;
  image?: string;
}

export interface Specification {
  key: string;
  value: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string;
  children?: Category[];
  productCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  productCount: number;
  isActive: boolean;
}

export interface CartItem {
  _id: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface Cart {
  _id: string;
  items: CartItem[];
  coupon: Coupon | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  itemCount: number;
}

export interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  expiresAt: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: User;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  tax: number;
  shippingCharge: number;
  discount: number;
  total: number;
  coupon?: Coupon;
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  _id: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface CreateOrderData {
  shippingAddressId: string;
  billingAddressId: string;
  paymentMethod: string;
  couponCode?: string;
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
}

export interface PaymentVerification {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface Wishlist {
  _id: string;
  products: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  user: User;
  product: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  isHelpful: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface OtpData {
  identifier: string;
  type: 'email' | 'phone';
}

export interface VerifyOtpData {
  identifier: string;
  code: string;
  type: 'email' | 'phone';
}

export interface TrackOrder {
  orderNumber: string;
  status: string;
  events: OrderEvent[];
}

export interface OrderEvent {
  status: string;
  timestamp: string;
  location?: string;
  description: string;
}

export interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  position: 'hero' | 'sidebar' | 'promo' | 'footer';
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Seller {
  _id: string;
  name: string;
  email: string;
  phone: string;
  shopName: string;
  shopDescription?: string;
  logo?: string;
  banner?: string;
  gstNumber?: string;
  panNumber?: string;
  rating: number;
  totalSales: number;
  commission: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  _id: string;
  user: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  _id: string;
  wallet: string;
  type: 'credit' | 'debit' | 'refund' | 'cashback' | 'withdrawal';
  amount: number;
  balanceAfter: number;
  reference?: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'promotion' | 'system' | 'delivery';
  isRead: boolean;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicket {
  _id: string;
  user: string;
  orderId?: string;
  subject: string;
  message: string;
  category: 'order' | 'payment' | 'delivery' | 'product' | 'account' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  responses: SupportTicketResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketResponse {
  _id: string;
  sender: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface DeliveryAssignment {
  _id: string;
  order: string;
  deliveryPartner?: string;
  status: 'pending' | 'assigned' | 'picked-up' | 'in-transit' | 'delivered' | 'failed';
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  trackingUrl?: string;
  otp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyPoint {
  _id: string;
  user: string;
  points: number;
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  reference?: string;
  description: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltySummary {
  totalEarned: number;
  totalRedeemed: number;
  totalExpired: number;
  currentBalance: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  nextTierPoints: number;
}
