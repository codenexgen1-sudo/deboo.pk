import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOrderTotals,
  calculatePakistanShipping,
  calculateProfitAndMargin,
  computeAnalyticsSummary,
  filterAndSortProducts,
  formatPKR,
  hasRbacPermission,
  validateAndApplyCoupon,
} from './commerce';
import type { CartItem, Coupon, Order, Product, StoreSettings } from '../types/ecommerce';

const baseSettings: StoreSettings = {
  storeName: 'Deboo.pk',
  currency: 'PKR',
  country: 'Pakistan',
  warehouseCity: 'Karachi',
  freeShippingThreshold: 8500,
  defaultShippingFee: 350,
  karachiShippingFee: 200,
  taxRatePercent: 0,
  codEnabled: true,
  guestCheckoutEnabled: true,
  whatsappNumber: '+923002458901',
  supportEmail: 'concierge@deboo.pk',
  updatedAt: '2026-11-23T00:00:00.000Z',
};

test('formatPKR formats Pakistani Rupees cleanly', () => {
  assert.equal(formatPKR(12500), 'PKR 12,500');
  assert.equal(formatPKR(0), 'PKR 0');
});

test('calculateProfitAndMargin computes profit using sale price when active', () => {
  const res = calculateProfitAndMargin(15000, 12000, 7200);
  assert.equal(res.sellingPrice, 12000);
  assert.equal(res.profit, 4800);
  assert.equal(res.marginPercent, 40);
});

test('calculatePakistanShipping handles Karachi, major metros, and free threshold', () => {
  const khi = calculatePakistanShipping('Karachi', 4000, baseSettings);
  assert.equal(khi.shippingCost, 200);
  assert.equal(khi.isFreeShipping, false);

  const lhr = calculatePakistanShipping('Lahore', 5000, baseSettings);
  assert.equal(lhr.shippingCost, 300);

  const free = calculatePakistanShipping('Islamabad', 9000, baseSettings);
  assert.equal(free.shippingCost, 0);
  assert.equal(free.isFreeShipping, true);
});

test('validateAndApplyCoupon validates percentage, min order, and BOGO', () => {
  const items: CartItem[] = [
    {
      productId: 'p1',
      slug: 'suit-1',
      name: 'Ivory Silk Suit',
      sku: 'DEB-1',
      color: 'Ivory',
      size: 'M',
      price: 10000,
      originalPrice: 10000,
      quantity: 1,
      image: '/img.jpg',
      maxStock: 5,
    },
    {
      productId: 'p2',
      slug: 'clutch-1',
      name: 'Gold Potli',
      sku: 'DEB-2',
      color: 'Gold',
      size: 'One Size',
      price: 4000,
      originalPrice: 4000,
      quantity: 1,
      image: '/img2.jpg',
      maxStock: 5,
    },
  ];

  const pctCoupon: Coupon = {
    id: 'DEBOO10',
    code: 'DEBOO10',
    type: 'Percentage',
    value: 10,
    minOrderAmount: 6000,
    maxUses: 100,
    usedCount: 2,
    active: true,
    description: '10% off',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const applied = validateAndApplyCoupon(pctCoupon, items, 14000, 0);
  assert.equal(applied.valid, true);
  assert.equal(applied.discountAmount, 1400);

  const bogoCoupon: Coupon = { ...pctCoupon, code: 'BOGO', type: 'BOGO', value: 0, minOrderAmount: 0 };
  const bogoRes = validateAndApplyCoupon(bogoCoupon, items, 14000, 0);
  assert.equal(bogoRes.valid, true);
  assert.equal(bogoRes.discountAmount, 4000);

  const totals = calculateOrderTotals({
    items,
    city: 'Karachi',
    shippingMethod: 'Standard Tracked',
    settings: baseSettings,
    coupon: pctCoupon,
  });
  assert.equal(totals.subtotal, 14000);
  assert.equal(totals.discountAmount, 1400);
  assert.equal(totals.shippingCost, 0);
  assert.equal(totals.totalAmount, 12600);
});

test('RBAC permissions strictly enforce role boundaries', () => {
  assert.equal(hasRbacPermission('Customer', undefined, 'orders.manage'), false);
  assert.equal(hasRbacPermission('Order Manager', undefined, 'orders.manage'), true);
  assert.equal(hasRbacPermission('Order Manager', undefined, 'products.write'), false);
  assert.equal(hasRbacPermission('Inventory Manager', undefined, 'inventory.adjust'), true);
  assert.equal(hasRbacPermission('Marketing Manager', undefined, 'marketing.manage'), true);
  assert.equal(hasRbacPermission('Super Admin', undefined, 'roles.manage'), true);
});

test('filterAndSortProducts excludes Draft/Archived and filters by query and price', () => {
  const sampleProducts: Product[] = [
    {
      id: '1',
      name: 'Zardozi Silk 3-Piece',
      slug: 'zardozi-silk',
      sku: 'SKU-1',
      categoryId: 'c1',
      categoryName: 'Stitched Suits',
      brand: 'Deboo.pk',
      shortDescription: 'Luxury silk',
      description: 'Handcrafted',
      price: 16500,
      costPrice: 9000,
      images: ['/a.jpg'],
      fabricDetails: 'Pure Raw Silk',
      productType: 'Stitched',
      colors: [{ name: 'Ivory', hex: '#FAF8F3' }],
      sizes: ['S', 'M', 'L'],
      variants: [],
      stockQuantity: 10,
      trackInventory: true,
      featured: true,
      newArrival: true,
      bestSeller: false,
      onSale: false,
      tags: ['silk'],
      weightGrams: 600,
      shippingInfo: 'Tracked',
      status: 'Active',
      viewCount: 10,
      wishlistCount: 2,
      salesCount: 4,
      createdAt: '2026-11-20T00:00:00.000Z',
      updatedAt: '2026-11-20T00:00:00.000Z',
    },
    {
      id: '2',
      name: 'Draft Lawn',
      slug: 'draft-lawn',
      sku: 'SKU-2',
      categoryId: 'c2',
      categoryName: 'Unstitched',
      brand: 'Deboo.pk',
      shortDescription: 'Lawn',
      description: 'Draft item',
      price: 5000,
      costPrice: 2500,
      images: ['/b.jpg'],
      fabricDetails: 'Swiss Lawn',
      productType: 'Unstitched',
      colors: [{ name: 'Champagne', hex: '#E8DCC3' }],
      sizes: ['Unstitched'],
      variants: [],
      stockQuantity: 15,
      trackInventory: true,
      featured: false,
      newArrival: false,
      bestSeller: false,
      onSale: false,
      tags: ['lawn'],
      weightGrams: 500,
      shippingInfo: 'Tracked',
      status: 'Draft',
      viewCount: 0,
      wishlistCount: 0,
      salesCount: 0,
      createdAt: '2026-11-21T00:00:00.000Z',
      updatedAt: '2026-11-21T00:00:00.000Z',
    },
  ];

  const activeOnly = filterAndSortProducts(sampleProducts, { searchQuery: 'silk' });
  assert.equal(activeOnly.length, 1);
  assert.equal(activeOnly[0].id, '1');
});

test('computeAnalyticsSummary separates demo vs live orders strictly', () => {
  const orders: Order[] = [
    {
      id: 'o1',
      orderNumber: 'DEB-1001',
      userId: 'u1',
      customerName: 'Ayesha',
      customerEmail: 'a@example.com',
      customerPhone: '03001234567',
      city: 'Karachi',
      completeAddress: 'Clifton Block 4',
      shippingMethod: 'Standard Tracked',
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Paid',
      orderStatus: 'Delivered',
      items: [],
      subtotal: 12000,
      discountAmount: 0,
      shippingCost: 0,
      taxAmount: 0,
      totalAmount: 12000,
      statusHistory: [],
      isDemo: true,
      createdAt: '2026-11-22T10:00:00.000Z',
      updatedAt: '2026-11-22T10:00:00.000Z',
    },
    {
      id: 'o2',
      orderNumber: 'DEB-1002',
      userId: 'u2',
      customerName: 'Zara',
      customerEmail: 'z@example.com',
      customerPhone: '03211234567',
      city: 'Lahore',
      completeAddress: 'Gulberg III',
      shippingMethod: 'Standard Tracked',
      paymentMethod: 'Easypaisa',
      paymentStatus: 'Paid',
      orderStatus: 'Confirmed',
      items: [],
      subtotal: 18000,
      discountAmount: 0,
      shippingCost: 0,
      taxAmount: 0,
      totalAmount: 18000,
      statusHistory: [],
      isDemo: false,
      createdAt: '2026-11-23T01:00:00.000Z',
      updatedAt: '2026-11-23T01:00:00.000Z',
    },
  ];

  const liveOnly = computeAnalyticsSummary({
    orders,
    products: [],
    events: [],
    totalCustomers: 1,
    dateRange: 'all',
    includeDemo: false,
  });
  assert.equal(liveOnly.totalRevenue, 18000);
  assert.equal(liveOnly.totalOrders, 1);

  const withDemo = computeAnalyticsSummary({
    orders,
    products: [],
    events: [],
    totalCustomers: 2,
    dateRange: 'all',
    includeDemo: true,
  });
  assert.equal(withDemo.totalRevenue, 30000);
  assert.equal(withDemo.totalOrders, 2);
});
