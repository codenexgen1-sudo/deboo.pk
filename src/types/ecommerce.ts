export type RoleName =
  | 'Customer'
  | 'Customer Support'
  | 'Marketing Manager'
  | 'Inventory Manager'
  | 'Order Manager'
  | 'Store Manager'
  | 'Admin'
  | 'Super Admin';

export type PermissionKey =
  | 'products.write'
  | 'orders.manage'
  | 'inventory.adjust'
  | 'marketing.manage'
  | 'analytics.view'
  | 'reviews.moderate'
  | 'customers.view'
  | 'settings.manage'
  | 'roles.manage'
  | 'audit.view';

export type ProductStatus = 'Draft' | 'Active' | 'Out of Stock' | 'Archived';

export type OrderStatus =
  | 'Order Placed'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Dispatched'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned'
  | 'Refunded';

export type PaymentMethod =
  | 'Cash on Delivery'
  | 'Bank Transfer'
  | 'Easypaisa'
  | 'JazzCash'
  | 'Online Card';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export type InventoryMovementType =
  | 'Purchase'
  | 'Sale'
  | 'Return'
  | 'Damage'
  | 'Adjustment'
  | 'Reservation'
  | 'Release';

export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductVariant {
  sku: string;
  color: string;
  size: string;
  stock: number;
  priceOverride?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  collectionId?: string;
  collectionName?: string;
  brand: string;
  shortDescription: string;
  description: string;
  price: number;
  salePrice?: number;
  costPrice: number;
  images: string[];
  videoUrl?: string;
  fabricDetails: string;
  productType: 'Unstitched' | 'Stitched' | 'Formal' | 'Accessories';
  colors: ProductColor[];
  sizes: string[];
  variants: ProductVariant[];
  stockQuantity: number;
  trackInventory: boolean;
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  onSale: boolean;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  metaKeywords?: string;
  weightGrams: number;
  shippingInfo: string;
  status: ProductStatus;
  viewCount: number;
  wishlistCount: number;
  salesCount: number;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
  active: boolean;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  season: string;
  description: string;
  image: string;
  featured: boolean;
  active: boolean;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  originalPrice: number;
  quantity: number;
  image: string;
  maxStock: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image: string;
}

export interface OrderStatusStep {
  status: OrderStatus;
  note: string;
  timestamp: string;
  actor?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  city: string;
  area?: string;
  completeAddress: string;
  postalCode?: string;
  shippingMethod: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  trackingNumber?: string;
  courierName?: string;
  orderNotes?: string;
  statusHistory: OrderStatusStep[];
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderTrackingRecord {
  orderNumber: string;
  orderStatus: OrderStatus;
  courierName?: string;
  trackingNumber?: string;
  destinationCity: string;
  statusHistory: OrderStatusStep[];
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'Percentage' | 'Fixed' | 'Free Shipping' | 'BOGO';
  value: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  active: boolean;
  description: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  ctaPrimaryText: string;
  ctaPrimaryLink: string;
  ctaSecondaryText: string;
  ctaSecondaryLink: string;
  desktopImage: string;
  mobileImage?: string;
  active: boolean;
  sortOrder: number;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  photoUrl?: string;
  verifiedPurchase: boolean;
  status: 'Pending' | 'Approved' | 'Rejected';
  featured: boolean;
  adminReply?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  role: RoleName;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRecord {
  uid: string;
  email: string;
  fullName: string;
  role: Exclude<RoleName, 'Customer'>;
  permissions: PermissionKey[];
  active: boolean;
  assignedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  city: string;
  area: string;
  completeAddress: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  userId: string;
  productId: string;
  productName: string;
  productSlug: string;
  price: number;
  image: string;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  variantSku?: string;
  type: InventoryMovementType;
  quantityDelta: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  supplier?: string;
  performedBy: string;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  eventType:
    | 'page_view'
    | 'product_view'
    | 'category_view'
    | 'search'
    | 'wishlist_add'
    | 'add_to_cart'
    | 'remove_from_cart'
    | 'checkout_start'
    | 'purchase'
    | 'banner_click'
    | 'coupon_use';
  productId?: string;
  productName?: string;
  categoryName?: string;
  searchQuery?: string;
  city?: string;
  color?: string;
  size?: string;
  source?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  audience: 'admin' | 'customer';
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actorUid: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string;
  details: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  currency: 'PKR';
  country: 'Pakistan';
  warehouseCity: string;
  freeShippingThreshold: number;
  defaultShippingFee: number;
  karachiShippingFee: number;
  taxRatePercent: number;
  codEnabled: boolean;
  guestCheckoutEnabled: boolean;
  whatsappNumber: string;
  supportEmail: string;
  updatedAt: string;
}
