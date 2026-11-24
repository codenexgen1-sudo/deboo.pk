import type {
  AnalyticsEvent,
  CartItem,
  Coupon,
  Order,
  PermissionKey,
  Product,
  RoleName,
  StoreSettings,
} from '../types/ecommerce';

export const PAKISTAN_CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Hyderabad',
  'Sialkot',
  'Gujranwala',
  'Bahawalpur',
  'Abbottabad',
  'Sukkur',
] as const;

export const ROLE_DEFAULT_PERMISSIONS: Record<RoleName, PermissionKey[]> = {
  Customer: [],
  'Customer Support': ['orders.manage', 'reviews.moderate', 'customers.view'],
  'Marketing Manager': ['marketing.manage', 'analytics.view', 'reviews.moderate'],
  'Inventory Manager': ['inventory.adjust', 'products.write'],
  'Order Manager': ['orders.manage', 'customers.view'],
  'Store Manager': [
    'products.write',
    'orders.manage',
    'inventory.adjust',
    'customers.view',
    'analytics.view',
    'reviews.moderate',
  ],
  Admin: [
    'products.write',
    'orders.manage',
    'inventory.adjust',
    'marketing.manage',
    'analytics.view',
    'reviews.moderate',
    'customers.view',
    'settings.manage',
    'audit.view',
  ],
  'Super Admin': [
    'products.write',
    'orders.manage',
    'inventory.adjust',
    'marketing.manage',
    'analytics.view',
    'reviews.moderate',
    'customers.view',
    'settings.manage',
    'roles.manage',
    'audit.view',
  ],
};

export function hasRbacPermission(
  role: RoleName | undefined,
  customPermissions: PermissionKey[] | undefined,
  requiredPermission: PermissionKey
): boolean {
  if (!role || role === 'Customer') return false;
  if (role === 'Super Admin') return true;
  if (customPermissions && customPermissions.length > 0) {
    return customPermissions.includes(requiredPermission);
  }
  return ROLE_DEFAULT_PERMISSIONS[role]?.includes(requiredPermission) ?? false;
}

export function formatPKR(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `PKR ${safe.toLocaleString('en-PK')}`;
}

export function getEffectivePrice(product: Pick<Product, 'price' | 'salePrice' | 'onSale'>): number {
  if (product.onSale && typeof product.salePrice === 'number' && product.salePrice > 0 && product.salePrice < product.price) {
    return product.salePrice;
  }
  return product.price;
}

export function getDiscountPercentage(price: number, salePrice?: number): number {
  if (!salePrice || salePrice <= 0 || salePrice >= price || price <= 0) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

export function calculateProfitAndMargin(price: number, salePrice: number | undefined, costPrice: number): {
  sellingPrice: number;
  profit: number;
  marginPercent: number;
} {
  const sellingPrice = salePrice && salePrice > 0 && salePrice < price ? salePrice : price;
  const profit = sellingPrice - costPrice;
  const marginPercent = sellingPrice > 0 ? Math.round((profit / sellingPrice) * 1000) / 10 : 0;
  return { sellingPrice, profit, marginPercent };
}

export function calculatePakistanShipping(
  city: string,
  subtotal: number,
  settings: Pick<StoreSettings, 'freeShippingThreshold' | 'karachiShippingFee' | 'defaultShippingFee'>,
  shippingMethod: 'Standard Tracked' | 'Express Air' = 'Standard Tracked'
): {
  shippingCost: number;
  isFreeShipping: boolean;
  estimateDays: string;
  courierLabel: string;
} {
  const cleanCity = city.trim().toLowerCase();
  const isKarachi = cleanCity === 'karachi';
  const isMajorMetro = ['lahore', 'islamabad', 'rawalpindi', 'hyderabad', 'faisalabad', 'multan'].includes(cleanCity);

  const baseFee = isKarachi
    ? settings.karachiShippingFee
    : isMajorMetro
      ? Math.max(settings.karachiShippingFee, settings.defaultShippingFee - 50)
      : settings.defaultShippingFee;

  const isFree = subtotal >= settings.freeShippingThreshold && shippingMethod === 'Standard Tracked';
  const expressSurcharge = shippingMethod === 'Express Air' ? 250 : 0;
  const shippingCost = isFree ? 0 : baseFee + expressSurcharge;

  const estimateDays = isKarachi
    ? shippingMethod === 'Express Air'
      ? 'Same-day / Next-day dispatch'
      : '1–2 business days'
    : isMajorMetro
      ? shippingMethod === 'Express Air'
        ? '1–2 business days'
        : '2–4 business days'
      : shippingMethod === 'Express Air'
        ? '2–3 business days'
        : '3–5 business days';

  const courierLabel = isKarachi
    ? 'Deboo Karachi Fleet / TCS Tracked'
    : 'TCS / Leopards Tracked Courier';

  return {
    shippingCost,
    isFreeShipping: isFree,
    estimateDays,
    courierLabel,
  };
}

export function validateAndApplyCoupon(
  coupon: Coupon | null | undefined,
  items: CartItem[],
  subtotal: number,
  shippingCost: number,
  nowIso: string = new Date().toISOString()
): {
  valid: boolean;
  discountAmount: number;
  waivesShipping: boolean;
  reason?: string;
} {
  if (!coupon || !coupon.active) {
    return { valid: false, discountAmount: 0, waivesShipping: false, reason: 'Coupon code is invalid or inactive.' };
  }
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, discountAmount: 0, waivesShipping: false, reason: 'Coupon usage limit has been reached.' };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < new Date(nowIso).getTime()) {
    return { valid: false, discountAmount: 0, waivesShipping: false, reason: 'This coupon has expired.' };
  }
  if (subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      discountAmount: 0,
      waivesShipping: false,
      reason: `Minimum order of ${formatPKR(coupon.minOrderAmount)} required.`,
    };
  }

  if (coupon.type === 'Percentage') {
    const discountAmount = Math.min(subtotal, Math.round((subtotal * coupon.value) / 100));
    return { valid: true, discountAmount, waivesShipping: false };
  }
  if (coupon.type === 'Fixed') {
    const discountAmount = Math.min(subtotal, Math.round(coupon.value));
    return { valid: true, discountAmount, waivesShipping: false };
  }
  if (coupon.type === 'Free Shipping') {
    return { valid: true, discountAmount: shippingCost, waivesShipping: true };
  }
  if (coupon.type === 'BOGO') {
    const totalQty = items.reduce((acc, it) => acc + it.quantity, 0);
    if (totalQty < 2) {
      return { valid: false, discountAmount: 0, waivesShipping: false, reason: 'Add at least 2 items for BOGO offer.' };
    }
    const sortedUnitPrices = items
      .flatMap((it) => Array.from({ length: it.quantity }, () => it.price))
      .sort((a, b) => a - b);
    const freeCount = Math.floor(sortedUnitPrices.length / 2);
    const discountAmount = sortedUnitPrices.slice(0, freeCount).reduce((sum, p) => sum + p, 0);
    return { valid: true, discountAmount, waivesShipping: false };
  }

  return { valid: false, discountAmount: 0, waivesShipping: false, reason: 'Unsupported coupon type.' };
}

export function calculateOrderTotals(params: {
  items: CartItem[];
  city: string;
  shippingMethod: 'Standard Tracked' | 'Express Air';
  settings: StoreSettings;
  coupon?: Coupon | null;
}): {
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  estimateDays: string;
  courierLabel: string;
  couponError?: string;
} {
  const subtotal = params.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingInfo = calculatePakistanShipping(
    params.city,
    subtotal,
    params.settings,
    params.shippingMethod
  );

  let discountAmount = 0;
  let shippingCost = shippingInfo.shippingCost;
  let couponError: string | undefined;

  if (params.coupon) {
    const res = validateAndApplyCoupon(params.coupon, params.items, subtotal, shippingCost);
    if (res.valid) {
      if (res.waivesShipping) {
        shippingCost = 0;
      } else {
        discountAmount = res.discountAmount;
      }
    } else {
      couponError = res.reason;
    }
  }

  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round((taxableBase * (params.settings.taxRatePercent || 0)) / 100);
  const totalAmount = Math.max(0, taxableBase + shippingCost + taxAmount);

  return {
    subtotal,
    shippingCost,
    discountAmount,
    taxAmount,
    totalAmount,
    estimateDays: shippingInfo.estimateDays,
    courierLabel: shippingInfo.courierLabel,
    couponError,
  };
}

export interface ProductFilterOptions {
  categorySlug?: string;
  collectionSlug?: string;
  searchQuery?: string;
  color?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  onlyNewArrivals?: boolean;
  onlyBestSellers?: boolean;
  onlySale?: boolean;
  inStockOnly?: boolean;
  sortBy?: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'bestselling';
}

export function filterAndSortProducts(
  products: Product[],
  filters: ProductFilterOptions,
  includeNonActive = false
): Product[] {
  const q = filters.searchQuery?.trim().toLowerCase() || '';

  const filtered = products.filter((p) => {
    if (!includeNonActive && p.status !== 'Active') return false;
    if (filters.onlyNewArrivals && !p.newArrival) return false;
    if (filters.onlyBestSellers && !p.bestSeller) return false;
    if (filters.onlySale && !p.onSale) return false;
    if (filters.inStockOnly && p.stockQuantity <= 0) return false;
    if (filters.categorySlug && filters.categorySlug !== 'all') {
      const catSlug = p.categoryName.toLowerCase().replace(/\s+/g, '-');
      if (catSlug !== filters.categorySlug.toLowerCase() && p.categoryId !== filters.categorySlug) {
        return false;
      }
    }
    if (filters.collectionSlug && filters.collectionSlug !== 'all') {
      const colSlug = (p.collectionName || '').toLowerCase().replace(/\s+/g, '-');
      if (colSlug !== filters.collectionSlug.toLowerCase() && p.collectionId !== filters.collectionSlug) {
        return false;
      }
    }
    if (filters.color && filters.color !== 'all') {
      if (!p.colors.some((c) => c.name.toLowerCase() === filters.color!.toLowerCase())) return false;
    }
    if (filters.size && filters.size !== 'all') {
      if (!p.sizes.some((s) => s.toLowerCase() === filters.size!.toLowerCase())) return false;
    }
    const effective = getEffectivePrice(p);
    if (typeof filters.minPrice === 'number' && effective < filters.minPrice) return false;
    if (typeof filters.maxPrice === 'number' && effective > filters.maxPrice) return false;
    if (q) {
      const haystack = [
        p.name,
        p.sku,
        p.categoryName,
        p.collectionName || '',
        p.fabricDetails,
        p.shortDescription,
        ...p.tags,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  switch (filters.sortBy) {
    case 'price-asc':
      sorted.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
      break;
    case 'price-desc':
      sorted.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
      break;
    case 'bestselling':
      sorted.sort((a, b) => b.salesCount - a.salesCount);
      break;
    case 'newest':
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'featured':
    default:
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || b.salesCount - a.salesCount);
      break;
  }

  return sorted;
}

export type DateRangePreset = 'today' | 'yesterday' | '7d' | '30d' | 'this_month' | 'last_month' | 'this_year' | 'all' | 'custom';

export function filterByDateRange<T extends { createdAt: string; isDemo?: boolean }>(
  items: T[],
  preset: DateRangePreset,
  includeDemo: boolean,
  customStart?: string,
  customEnd?: string,
  now: Date = new Date()
): T[] {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let minTs = 0;
  let maxTs = Number.MAX_SAFE_INTEGER;

  switch (preset) {
    case 'today':
      minTs = startOfToday;
      break;
    case 'yesterday':
      minTs = startOfToday - 86400000;
      maxTs = startOfToday - 1;
      break;
    case '7d':
      minTs = now.getTime() - 7 * 86400000;
      break;
    case '30d':
      minTs = now.getTime() - 30 * 86400000;
      break;
    case 'this_month':
      minTs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      break;
    case 'last_month':
      minTs = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      maxTs = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
      break;
    case 'this_year':
      minTs = new Date(now.getFullYear(), 0, 1).getTime();
      break;
    case 'custom':
      if (customStart) minTs = new Date(customStart).getTime();
      if (customEnd) maxTs = new Date(customEnd).getTime() + 86399999;
      break;
    case 'all':
    default:
      break;
  }

  return items.filter((item) => {
    if (!includeDemo && item.isDemo) return false;
    const ts = new Date(item.createdAt).getTime();
    return ts >= minTs && ts <= maxTs;
  });
}

export function computeAnalyticsSummary(params: {
  orders: Order[];
  products: Product[];
  events: AnalyticsEvent[];
  totalCustomers: number;
  dateRange: DateRangePreset;
  includeDemo: boolean;
  customStart?: string;
  customEnd?: string;
}) {
  const scopedOrders = filterByDateRange(
    params.orders,
    params.dateRange,
    params.includeDemo,
    params.customStart,
    params.customEnd
  );
  const scopedProducts = params.includeDemo
    ? params.products
    : params.products.filter((p) => !p.isDemo);

  const validOrders = scopedOrders.filter((o) => !['Cancelled', 'Refunded'].includes(o.orderStatus));
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = scopedOrders.length;
  const averageOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;
  const pendingOrders = scopedOrders.filter((o) =>
    ['Order Placed', 'Confirmed', 'Processing', 'Packed'].includes(o.orderStatus)
  ).length;
  const cancelledOrders = scopedOrders.filter((o) => o.orderStatus === 'Cancelled').length;
  const refundedOrders = scopedOrders.filter((o) => o.orderStatus === 'Refunded').length;

  const todayOrders = filterByDateRange(params.orders, 'today', params.includeDemo);
  const todayRevenue = todayOrders
    .filter((o) => !['Cancelled', 'Refunded'].includes(o.orderStatus))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const activeProducts = scopedProducts.filter((p) => p.status === 'Active').length;
  const lowStockProducts = scopedProducts.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 5).length;
  const outOfStockProducts = scopedProducts.filter((p) => p.stockQuantity <= 0 || p.status === 'Out of Stock').length;
  const totalWishlistAdditions = scopedProducts.reduce((sum, p) => sum + p.wishlistCount, 0);

  // Revenue by day map
  const dayMap = new Map<string, { date: string; revenue: number; orders: number }>();
  for (const order of scopedOrders) {
    const day = order.createdAt.slice(0, 10);
    const cur = dayMap.get(day) || { date: day, revenue: 0, orders: 0 };
    if (!['Cancelled', 'Refunded'].includes(order.orderStatus)) {
      cur.revenue += order.totalAmount;
    }
    cur.orders += 1;
    dayMap.set(day, cur);
  }
  const revenueSeries = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Sales by City
  const cityMap = new Map<string, number>();
  const paymentMap = new Map<string, number>();
  for (const order of validOrders) {
    cityMap.set(order.city, (cityMap.get(order.city) || 0) + order.totalAmount);
    paymentMap.set(order.paymentMethod, (paymentMap.get(order.paymentMethod) || 0) + order.totalAmount);
  }
  const salesByCity = Array.from(cityMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  const salesByPayment = Array.from(paymentMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Event-based public interest metrics
  const searchCounts = new Map<string, number>();
  const colorCounts = new Map<string, number>();
  const sizeCounts = new Map<string, number>();
  let productViews = 0;
  let addToCartCount = 0;
  let purchaseEvents = 0;

  for (const ev of params.events) {
    if (ev.eventType === 'product_view') productViews += 1;
    if (ev.eventType === 'add_to_cart') addToCartCount += 1;
    if (ev.eventType === 'purchase') purchaseEvents += 1;
    if (ev.eventType === 'search' && ev.searchQuery) {
      const term = ev.searchQuery.trim().toLowerCase();
      if (term) searchCounts.set(term, (searchCounts.get(term) || 0) + 1);
    }
    if (ev.color) colorCounts.set(ev.color, (colorCounts.get(ev.color) || 0) + 1);
    if (ev.size) sizeCounts.set(ev.size, (sizeCounts.get(ev.size) || 0) + 1);
  }

  const conversionRate =
    productViews > 0
      ? Math.min(100, Math.round(((purchaseEvents || validOrders.length) / productViews) * 1000) / 10)
      : 0;

  const topSearchTerms = Array.from(searchCounts.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const popularColors = Array.from(colorCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const popularSizes = Array.from(sizeCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    totalRevenue,
    todayRevenue,
    totalOrders,
    todayOrders: todayOrders.length,
    averageOrderValue,
    pendingOrders,
    cancelledOrders,
    refundedOrders,
    totalCustomers: params.totalCustomers,
    conversionRate,
    activeProducts,
    lowStockProducts,
    outOfStockProducts,
    totalProducts: scopedProducts.length,
    totalWishlistAdditions,
    addToCartCount,
    productViews,
    revenueSeries,
    salesByCity,
    salesByPayment,
    topSearchTerms,
    popularColors,
    popularSizes,
  };
}
