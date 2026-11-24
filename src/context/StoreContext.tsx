import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  DEFAULT_STORE_SETTINGS,
  SEED_BANNERS,
  SEED_CATEGORIES,
  SEED_COLLECTIONS,
  SEED_COUPONS,
  SEED_DEMO_ORDERS,
  SEED_PRODUCTS,
  SEED_REVIEWS,
} from '../data/seedCatalog';
import type {
  Address,
  AdminRecord,
  AnalyticsEvent,
  AuditLogItem,
  Banner,
  CartItem,
  Category,
  Collection,
  Coupon,
  InventoryMovement,
  InventoryMovementType,
  NotificationItem,
  Order,
  OrderStatus,
  OrderTrackingRecord,
  PaymentMethod,
  PaymentStatus,
  Product,
  Review,
  StoreSettings,
  UserProfile,
  WishlistItem,
} from '../types/ecommerce';
import { getEffectivePrice } from '../utils/commerce';
import { useAuth } from './AuthContext';

interface StoreContextValue {
  // Public catalog
  products: Product[];
  categories: Category[];
  collections: Collection[];
  banners: Banner[];
  reviews: Review[];
  settings: StoreSettings;
  catalogLoading: boolean;
  customerDataLoading: boolean;
  isCatalogFromFirestore: boolean;

  // Cart & Wishlist & History
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, color: string, size: string, quantity?: number, openDrawer?: boolean) => void;
  updateCartQty: (productId: string, color: string, size: string, quantity: number) => void;
  removeFromCart: (productId: string, color: string, size: string) => void;
  clearCart: () => void;
  wishlistIds: string[];
  wishlistItems: WishlistItem[];
  toggleWishlist: (product: Product) => Promise<void>;
  recentlyViewedIds: string[];
  markProductViewed: (product: Product) => void;

  // Customer data
  addresses: Address[];
  saveAddress: (addr: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  myOrders: Order[];
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => Promise<void>;

  // Public actions
  validateCouponCode: (code: string) => Promise<Coupon | null>;
  placeOrder: (params: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    city: string;
    area: string;
    completeAddress: string;
    postalCode?: string;
    shippingMethod: 'Standard Tracked' | 'Express Air';
    paymentMethod: PaymentMethod;
    couponCode?: string;
    discountAmount: number;
    shippingCost: number;
    taxAmount: number;
    subtotal: number;
    totalAmount: number;
    orderNotes?: string;
  }) => Promise<Order>;
  lookupOrderTracking: (orderNumber: string) => Promise<OrderTrackingRecord | null>;
  submitReview: (params: {
    productId: string;
    productName: string;
    rating: number;
    title: string;
    comment: string;
    photoUrl?: string;
  }) => Promise<void>;
  subscribeNewsletter: (email: string, source?: string) => Promise<void>;

  // Privacy & Analytics
  analyticsConsent: 'pending' | 'granted' | 'declined';
  setAnalyticsConsent: (status: 'granted' | 'declined') => void;
  trackEvent: (event: Omit<AnalyticsEvent, 'id' | 'createdAt'>) => void;

  // Admin state & actions
  adminProducts: Product[];
  adminOrders: Order[];
  adminCoupons: Coupon[];
  adminReviews: Review[];
  inventoryMovements: InventoryMovement[];
  analyticsEvents: AnalyticsEvent[];
  newsletterSubscribers: { id: string; email: string; source: string; createdAt: string }[];
  staffRecords: AdminRecord[];
  auditLogs: AuditLogItem[];
  customersList: UserProfile[];
  refreshAdminData: () => Promise<void>;
  upsertProduct: (product: Partial<Product> & { name: string; sku: string; categoryName: string; price: number }) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  adjustInventory: (params: {
    productId: string;
    variantSku?: string;
    type: InventoryMovementType;
    quantityDelta: number;
    reason: string;
    supplier?: string;
  }) => Promise<void>;
  updateOrderStatus: (params: {
    orderId: string;
    isGuestOrder: boolean;
    orderStatus: OrderStatus;
    paymentStatus?: PaymentStatus;
    trackingNumber?: string;
    courierName?: string;
    note?: string;
  }) => Promise<void>;
  upsertCategory: (cat: Partial<Category> & { name: string; slug: string }) => Promise<void>;
  upsertCollection: (col: Partial<Collection> & { name: string; slug: string }) => Promise<void>;
  upsertCoupon: (coupon: Partial<Coupon> & { code: string; type: Coupon['type']; value: number }) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  upsertBanner: (banner: Partial<Banner> & { title: string; subtitle: string; desktopImage: string }) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;
  moderateReview: (id: string, updates: { status: Review['status']; featured?: boolean; adminReply?: string }) => Promise<void>;
  upsertStaffRole: (staff: AdminRecord) => Promise<void>;
  removeStaffRole: (uid: string) => Promise<void>;
  updateStoreSettings: (next: StoreSettings) => Promise<void>;
  syncDemoDataToFirestore: () => Promise<void>;
  clearDemoDataFromFirestore: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function tsToIso(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser, profile, role, isStaff, isAuthReady } = useAuth();

  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(SEED_CATEGORIES);
  const [collections, setCollections] = useState<Collection[]>(SEED_COLLECTIONS);
  const [banners, setBanners] = useState<Banner[]>(SEED_BANNERS);
  const [reviews, setReviews] = useState<Review[]>(SEED_REVIEWS);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [isCatalogFromFirestore, setIsCatalogFromFirestore] = useState(false);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = sessionStorage.getItem('deboo_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);

  const [guestWishlistIds, setGuestWishlistIds] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem('deboo_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem('deboo_recent');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [customerDataLoading, setCustomerDataLoading] = useState(false);

  const [analyticsConsent, setAnalyticsConsentState] = useState<'pending' | 'granted' | 'declined'>(() => {
    try {
      const saved = sessionStorage.getItem('deboo_consent');
      if (saved === 'granted' || saved === 'declined') return saved;
      return 'pending';
    } catch {
      return 'pending';
    }
  });

  // Admin collections
  const [adminProducts, setAdminProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [adminOrders, setAdminOrders] = useState<Order[]>(SEED_DEMO_ORDERS);
  const [adminCoupons, setAdminCoupons] = useState<Coupon[]>(SEED_COUPONS);
  const [adminReviews, setAdminReviews] = useState<Review[]>(SEED_REVIEWS);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<
    { id: string; email: string; source: string; createdAt: string }[]
  >([]);
  const [staffRecords, setStaffRecords] = useState<AdminRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [customersList, setCustomersList] = useState<UserProfile[]>([]);

  useEffect(() => {
    try {
      sessionStorage.setItem('deboo_cart', JSON.stringify(cart));
    } catch {
      // ignore storage failure
    }
  }, [cart]);

  const setAnalyticsConsent = useCallback((status: 'granted' | 'declined') => {
    setAnalyticsConsentState(status);
    try {
      sessionStorage.setItem('deboo_consent', status);
    } catch {
      // ignore
    }
  }, []);

  const loadPublicCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const [prodSnap, catSnap, colSnap, banSnap, revSnap, setSnap] = await Promise.all([
        getDocs(query(collection(db, 'products'), where('status', '==', 'Active'))),
        getDocs(query(collection(db, 'categories'), where('active', '==', true))),
        getDocs(query(collection(db, 'collections'), where('active', '==', true))),
        getDocs(query(collection(db, 'banners'), where('active', '==', true))),
        getDocs(query(collection(db, 'reviews'), where('status', '==', 'Approved'))),
        getDoc(doc(db, 'settings', 'public')),
      ]);

      if (!prodSnap.empty) {
        setIsCatalogFromFirestore(true);
        const loadedProds = prodSnap.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            createdAt: tsToIso(data.createdAt),
            updatedAt: tsToIso(data.updatedAt),
          } as Product;
        });
        setProducts(loadedProds);
      } else {
        setIsCatalogFromFirestore(false);
        setProducts(SEED_PRODUCTS);
      }

      if (!catSnap.empty) {
        const loadedCats = catSnap.docs
          .map((d) => ({ ...d.data(), id: d.id, createdAt: tsToIso(d.data().createdAt), updatedAt: tsToIso(d.data().updatedAt) } as Category))
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        setCategories(loadedCats);
      }

      if (!colSnap.empty) {
        setCollections(
          colSnap.docs.map((d) => ({ ...d.data(), id: d.id, createdAt: tsToIso(d.data().createdAt), updatedAt: tsToIso(d.data().updatedAt) } as Collection))
        );
      }

      if (!banSnap.empty) {
        const loadedBanners = banSnap.docs
          .map((d) => ({ ...d.data(), id: d.id, createdAt: tsToIso(d.data().createdAt), updatedAt: tsToIso(d.data().updatedAt) } as Banner))
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        setBanners(loadedBanners);
      }

      if (!revSnap.empty) {
        setReviews(
          revSnap.docs.map((d) => ({ ...d.data(), id: d.id, createdAt: tsToIso(d.data().createdAt), updatedAt: tsToIso(d.data().updatedAt) } as Review))
        );
      }

      if (setSnap.exists()) {
        const s = setSnap.data();
        setSettings({
          ...DEFAULT_STORE_SETTINGS,
          ...s,
          updatedAt: tsToIso(s.updatedAt),
        } as StoreSettings);
      }
    } catch (err) {
      console.warn('Public catalog fetch notice:', err);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPublicCatalog();
  }, [loadPublicCatalog]);

  const loadCustomerData = useCallback(async () => {
    if (!firebaseUser || !firebaseUser.emailVerified) {
      setAddresses([]);
      setWishlistItems([]);
      setMyOrders([]);
      setNotifications([]);
      return;
    }

    setCustomerDataLoading(true);
    try {
      const [addrSnap, wishSnap, ordSnap, notifSnap] = await Promise.all([
        getDocs(query(collection(db, 'users', firebaseUser.uid, 'addresses'), where('userId', '==', firebaseUser.uid))),
        getDocs(query(collection(db, 'users', firebaseUser.uid, 'wishlists'), where('userId', '==', firebaseUser.uid))),
        getDocs(query(collection(db, 'orders'), where('userId', '==', firebaseUser.uid))),
        getDocs(query(collection(db, 'notifications'), where('recipientId', '==', firebaseUser.uid))),
      ]);

      setAddresses(
        addrSnap.docs.map((d) => ({ ...d.data(), id: d.id, createdAt: tsToIso(d.data().createdAt), updatedAt: tsToIso(d.data().updatedAt) } as Address))
      );
      setWishlistItems(
        wishSnap.docs.map((d) => ({ ...d.data(), productId: d.id, createdAt: tsToIso(d.data().createdAt) } as WishlistItem))
      );
      const loadedOrders = ordSnap.docs
        .map((d) => ({ ...d.data(), id: d.id, createdAt: tsToIso(d.data().createdAt), updatedAt: tsToIso(d.data().updatedAt) } as Order))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setMyOrders(loadedOrders);
      setNotifications(
        notifSnap.docs
          .map((d) => ({ ...d.data(), id: d.id, createdAt: tsToIso(d.data().createdAt) } as NotificationItem))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      );
    } catch (err) {
      console.warn('Customer data sync notice:', err);
    } finally {
      setCustomerDataLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (isAuthReady) {
      loadCustomerData();
    }
  }, [isAuthReady, loadCustomerData]);

  const refreshAdminData = useCallback(async () => {
    if (!isStaff || !firebaseUser?.emailVerified) return;

    try {
      const [
        allProdSnap,
        ordersSnap,
        guestOrdersSnap,
        couponsSnap,
        reviewsSnap,
        movSnap,
        evSnap,
        newsSnap,
        adminsSnap,
        auditSnap,
        usersSnap,
      ] = await Promise.all([
        getDocs(collection(db, 'products')).catch(() => null),
        getDocs(collection(db, 'orders')).catch(() => null),
        getDocs(collection(db, 'guestOrders')).catch(() => null),
        getDocs(collection(db, 'coupons')).catch(() => null),
        getDocs(collection(db, 'reviews')).catch(() => null),
        getDocs(query(collection(db, 'inventoryMovements'), orderBy('createdAt', 'desc'), limit(100))).catch(() => null),
        getDocs(query(collection(db, 'analyticsEvents'), orderBy('createdAt', 'desc'), limit(200))).catch(() => null),
        getDocs(collection(db, 'newsletter')).catch(() => null),
        getDocs(collection(db, 'admins')).catch(() => null),
        getDocs(query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(100))).catch(() => null),
        getDocs(collection(db, 'users')).catch(() => null),
      ]);

      if (allProdSnap && !allProdSnap.empty) {
        setAdminProducts(
          allProdSnap.docs.map((d) => ({ ...d.data(), id: d.id, createdAt: tsToIso(d.data().createdAt), updatedAt: tsToIso(d.data().updatedAt) } as Product))
        );
      } else {
        setAdminProducts(SEED_PRODUCTS);
      }

      const combinedOrders: Order[] = [];
      if (ordersSnap) {
        ordersSnap.docs.forEach((d) =>
          combinedOrders.push({ ...d.data(), id: d.id, createdAt: tsToIso(d.data().createdAt), updatedAt: tsToIso(d.data().updatedAt) } as Order)
        );
      }
      if (guestOrdersSnap) {
        guestOrdersSnap.docs.forEach((d) =>
          combinedOrders.push({ ...d.data(), id: d.id, createdAt: tsToIso(d.data().createdAt), updatedAt: tsToIso(d.data().updatedAt) } as Order)
        );
      }
      // If no real orders yet, keep demo orders flagged isDemo: true available for demo-view toggle
      const hasDemoInDb = combinedOrders.some((o) => o.isDemo);
      if (combinedOrders.length === 0 || (!hasDemoInDb && !isCatalogFromFirestore)) {
        setAdminOrders([...combinedOrders, ...SEED_DEMO_ORDERS]);
      } else {
        setAdminOrders(combinedOrders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      }

      if (couponsSnap && !couponsSnap.empty) {
        setAdminCoupons(
          couponsSnap.docs.map((d) => ({ ...d.data(), id: d.id, createdAt: tsToIso(d.data().createdAt), updatedAt: tsToIso(d.data().updatedAt) } as Coupon))
        );
      } else {
        setAdminCoupons(SEED_COUPONS);
      }

      if (reviewsSnap && !reviewsSnap.empty) {
        setAdminReviews(
          reviewsSnap.docs.map((d) => ({ ...d.data(), id: d.id, createdAt: tsToIso(d.data().createdAt), updatedAt: tsToIso(d.data().updatedAt) } as Review))
        );
      } else {
        setAdminReviews(SEED_REVIEWS);
      }

      if (movSnap) {
        setInventoryMovements(
          movSnap.docs.map((d) => ({ ...d.data(), id: d.id, createdAt: tsToIso(d.data().createdAt) } as InventoryMovement))
        );
      }
      if (evSnap && !evSnap.empty) {
        setAnalyticsEvents(
          evSnap.docs.map((d) => ({ ...d.data(), id: d.id, createdAt: tsToIso(d.data().createdAt) } as AnalyticsEvent))
        );
      }
      if (newsSnap) {
        setNewsletterSubscribers(
          newsSnap.docs.map((d) => ({
            id: d.id,
            email: String(d.data().email || ''),
            source: String(d.data().source || 'footer'),
            createdAt: tsToIso(d.data().createdAt),
          }))
        );
      }
      if (adminsSnap) {
        setStaffRecords(
          adminsSnap.docs.map((d) => ({ ...d.data(), uid: d.id, createdAt: tsToIso(d.data().createdAt), updatedAt: tsToIso(d.data().updatedAt) } as AdminRecord))
        );
      }
      if (auditSnap) {
        setAuditLogs(
          auditSnap.docs.map((d) => ({ ...d.data(), id: d.id, createdAt: tsToIso(d.data().createdAt) } as AuditLogItem))
        );
      }
      if (usersSnap) {
        setCustomersList(
          usersSnap.docs.map((d) => ({ ...d.data(), uid: d.id, createdAt: tsToIso(d.data().createdAt), updatedAt: tsToIso(d.data().updatedAt) } as UserProfile))
        );
      }
    } catch (err) {
      console.warn('Admin refresh notice:', err);
    }
  }, [isStaff, firebaseUser, isCatalogFromFirestore]);

  useEffect(() => {
    if (isStaff) {
      refreshAdminData();
    }
  }, [isStaff, refreshAdminData]);

  const trackEvent = useCallback(
    (event: Omit<AnalyticsEvent, 'id' | 'createdAt'>) => {
      if (analyticsConsent === 'declined') return;
      const id = makeId('ev');
      const localEv: AnalyticsEvent = {
        ...event,
        id,
        createdAt: new Date().toISOString(),
      };
      setAnalyticsEvents((prev) => [localEv, ...prev].slice(0, 200));

      const payload: Record<string, unknown> = {
        eventType: event.eventType,
        createdAt: serverTimestamp(),
      };
      if (event.productId) payload.productId = event.productId.slice(0, 128);
      if (event.productName) payload.productName = event.productName.slice(0, 180);
      if (event.categoryName) payload.categoryName = event.categoryName.slice(0, 100);
      if (event.searchQuery) payload.searchQuery = event.searchQuery.slice(0, 120);
      if (event.city) payload.city = event.city.slice(0, 80);
      if (event.color) payload.color = event.color.slice(0, 60);
      if (event.size) payload.size = event.size.slice(0, 40);
      if (event.source) payload.source = event.source.slice(0, 80);

      setDoc(doc(db, 'analyticsEvents', id), payload).catch(() => {
        // non-blocking analytics
      });
    },
    [analyticsConsent]
  );

  const writeAuditLog = useCallback(
    async (action: string, targetType: string, targetId: string, details: string) => {
      if (!firebaseUser) return;
      const id = makeId('aud');
      await setDoc(doc(db, 'auditLogs', id), {
        actorUid: firebaseUser.uid,
        actorEmail: firebaseUser.email || 'staff@deboo.pk',
        actorRole: role,
        action: action.slice(0, 120),
        targetType: targetType.slice(0, 60),
        targetId: targetId.slice(0, 128),
        details: details.slice(0, 500),
        createdAt: serverTimestamp(),
      }).catch(() => {});
    },
    [firebaseUser, role]
  );

  const addToCart = useCallback(
    (product: Product, color: string, size: string, quantity = 1, openDrawer = true) => {
      const variant = product.variants.find((v) => v.color === color && v.size === size);
      const maxStock = variant ? variant.stock : product.stockQuantity;
      const effective = getEffectivePrice(product);
      const sku = variant ? variant.sku : product.sku;

      setCart((prev) => {
        const idx = prev.findIndex(
          (i) => i.productId === product.id && i.color === color && i.size === size
        );
        if (idx >= 0) {
          const updated = [...prev];
          const nextQty = Math.min(maxStock > 0 ? maxStock : 99, updated[idx].quantity + quantity);
          updated[idx] = { ...updated[idx], quantity: nextQty };
          return updated;
        }
        return [
          ...prev,
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            sku,
            color,
            size,
            price: effective,
            originalPrice: product.price,
            quantity: Math.min(maxStock > 0 ? maxStock : 99, quantity),
            image: product.images[0] || '',
            maxStock: maxStock > 0 ? maxStock : 10,
          },
        ];
      });
      if (openDrawer) {
        setCartOpen(true);
      }
      trackEvent({
        eventType: 'add_to_cart',
        productId: product.id,
        productName: product.name,
        categoryName: product.categoryName,
        color,
        size,
      });
    },
    [trackEvent]
  );

  const updateCartQty = useCallback((productId: string, color: string, size: string, quantity: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId && item.color === color && item.size === size) {
            return { ...item, quantity: Math.max(0, Math.min(item.maxStock, quantity)) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback(
    (productId: string, color: string, size: string) => {
      setCart((prev) =>
        prev.filter((item) => !(item.productId === productId && item.color === color && item.size === size))
      );
      trackEvent({ eventType: 'remove_from_cart', productId });
    },
    [trackEvent]
  );

  const clearCart = useCallback(() => setCart([]), []);

  const wishlistIds = useMemo(() => {
    if (firebaseUser?.emailVerified) {
      return wishlistItems.map((w) => w.productId);
    }
    return guestWishlistIds;
  }, [firebaseUser, wishlistItems, guestWishlistIds]);

  const toggleWishlist = useCallback(
    async (product: Product) => {
      if (firebaseUser?.emailVerified) {
        const ref = doc(db, 'users', firebaseUser.uid, 'wishlists', product.id);
        const exists = wishlistItems.some((w) => w.productId === product.id);
        try {
          if (exists) {
            await deleteDoc(ref);
            setWishlistItems((prev) => prev.filter((w) => w.productId !== product.id));
          } else {
            const payload = {
              userId: firebaseUser.uid,
              productId: product.id,
              productName: product.name,
              productSlug: product.slug,
              price: getEffectivePrice(product),
              image: product.images[0] || '',
              createdAt: serverTimestamp(),
            };
            await setDoc(ref, payload);
            setWishlistItems((prev) => [
              ...prev,
              {
                userId: firebaseUser.uid,
                productId: product.id,
                productName: product.name,
                productSlug: product.slug,
                price: getEffectivePrice(product),
                image: product.images[0] || '',
                createdAt: new Date().toISOString(),
              },
            ]);
            trackEvent({
              eventType: 'wishlist_add',
              productId: product.id,
              productName: product.name,
              categoryName: product.categoryName,
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}/wishlists/${product.id}`);
        }
      } else {
        setGuestWishlistIds((prev) => {
          const next = prev.includes(product.id)
            ? prev.filter((id) => id !== product.id)
            : [...prev, product.id];
          try {
            sessionStorage.setItem('deboo_wishlist', JSON.stringify(next));
          } catch {
            // ignore
          }
          if (!prev.includes(product.id)) {
            trackEvent({
              eventType: 'wishlist_add',
              productId: product.id,
              productName: product.name,
              categoryName: product.categoryName,
            });
          }
          return next;
        });
      }
    },
    [firebaseUser, wishlistItems, trackEvent]
  );

  const markProductViewed = useCallback(
    (product: Product) => {
      setRecentlyViewedIds((prev) => {
        const next = [product.id, ...prev.filter((id) => id !== product.id)].slice(0, 8);
        try {
          sessionStorage.setItem('deboo_recent', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      trackEvent({
        eventType: 'product_view',
        productId: product.id,
        productName: product.name,
        categoryName: product.categoryName,
      });
    },
    [trackEvent]
  );

  const saveAddress = useCallback(
    async (addr: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      if (!firebaseUser?.emailVerified) throw new Error('Please sign in with a verified account.');
      const id = addr.id || makeId('addr');
      const ref = doc(db, 'users', firebaseUser.uid, 'addresses', id);
      try {
        if (addr.id) {
          await updateDoc(ref, {
            fullName: addr.fullName,
            phone: addr.phone,
            city: addr.city,
            area: addr.area,
            completeAddress: addr.completeAddress,
            postalCode: addr.postalCode || '',
            isDefault: addr.isDefault,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(ref, {
            userId: firebaseUser.uid,
            fullName: addr.fullName,
            phone: addr.phone,
            city: addr.city,
            area: addr.area,
            completeAddress: addr.completeAddress,
            postalCode: addr.postalCode || '',
            isDefault: addr.isDefault,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        await loadCustomerData();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}/addresses/${id}`);
      }
    },
    [firebaseUser, loadCustomerData]
  );

  const deleteAddress = useCallback(
    async (id: string) => {
      if (!firebaseUser?.emailVerified) return;
      try {
        await deleteDoc(doc(db, 'users', firebaseUser.uid, 'addresses', id));
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${firebaseUser.uid}/addresses/${id}`);
      }
    },
    [firebaseUser]
  );

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      // ignore
    }
  }, []);

  const validateCouponCode = useCallback(async (code: string): Promise<Coupon | null> => {
    const clean = code.trim().toUpperCase();
    if (!clean) return null;
    try {
      const snap = await getDoc(doc(db, 'coupons', clean));
      if (snap.exists()) {
        const d = snap.data();
        return {
          ...d,
          id: snap.id,
          createdAt: tsToIso(d.createdAt),
          updatedAt: tsToIso(d.updatedAt),
        } as Coupon;
      }
    } catch {
      // fallback to seeded coupons if DB not synced yet
    }
    return SEED_COUPONS.find((c) => c.code.toUpperCase() === clean) || null;
  }, []);

  const placeOrder = useCallback(
    async (params: {
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      city: string;
      area: string;
      completeAddress: string;
      postalCode?: string;
      shippingMethod: 'Standard Tracked' | 'Express Air';
      paymentMethod: PaymentMethod;
      couponCode?: string;
      discountAmount: number;
      shippingCost: number;
      taxAmount: number;
      subtotal: number;
      totalAmount: number;
      orderNotes?: string;
    }): Promise<Order> => {
      if (cart.length === 0) throw new Error('Your shopping bag is empty.');

      const isAuthed = Boolean(firebaseUser && firebaseUser.emailVerified);
      if (!isAuthed && !settings.guestCheckoutEnabled) {
        throw new Error('Guest checkout is currently disabled. Please sign in to complete your order.');
      }

      const orderNum = `DEB-${Math.floor(10000 + Math.random() * 89999)}`;
      const orderId = makeId('ord');
      const nowIso = new Date().toISOString();
      const paymentStatus: PaymentStatus =
        params.paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid';

      const orderItems = cart.map((item) => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.price,
        lineTotal: item.price * item.quantity,
        image: item.image,
      }));

      const initialHistory = [
        {
          status: 'Order Placed' as OrderStatus,
          note: `Order received via ${params.paymentMethod}. Preparing at Karachi Main Warehouse.`,
          timestamp: nowIso,
        },
      ];

      const orderPayload = {
        orderNumber: orderNum,
        userId: isAuthed ? firebaseUser!.uid : 'guest',
        customerName: params.customerName.trim(),
        customerEmail: params.customerEmail.trim(),
        customerPhone: params.customerPhone.trim(),
        city: params.city.trim(),
        area: params.area.trim(),
        completeAddress: params.completeAddress.trim(),
        postalCode: (params.postalCode || '').trim(),
        shippingMethod: params.shippingMethod,
        paymentMethod: params.paymentMethod,
        paymentStatus,
        orderStatus: 'Order Placed' as OrderStatus,
        items: orderItems,
        subtotal: params.subtotal,
        discountAmount: params.discountAmount,
        couponCode: (params.couponCode || '').trim(),
        shippingCost: params.shippingCost,
        taxAmount: params.taxAmount,
        totalAmount: params.totalAmount,
        courierName: params.city.toLowerCase() === 'karachi' ? 'Deboo Karachi Fleet' : 'TCS Tracked Courier',
        orderNotes: (params.orderNotes || '').trim(),
        statusHistory: initialHistory,
        isDemo: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const targetCollection = isAuthed ? 'orders' : 'guestOrders';

      try {
        // Transactional stock verification & deduction for products synced in Firestore
        if (isAuthed && isCatalogFromFirestore) {
          for (const item of cart) {
            const pRef = doc(db, 'products', item.productId);
            await runTransaction(db, async (tx) => {
              const pSnap = await tx.get(pRef);
              if (!pSnap.exists()) return;
              const pData = pSnap.data() as Product;
              if (pData.trackInventory && pData.stockQuantity < item.quantity) {
                throw new Error(`Insufficient stock for ${item.name}. Only ${pData.stockQuantity} remaining.`);
              }
              const nextStock = Math.max(0, pData.stockQuantity - item.quantity);
              const nextVariants = (pData.variants || []).map((v) =>
                v.color === item.color && v.size === item.size
                  ? { ...v, stock: Math.max(0, v.stock - item.quantity) }
                  : v
              );
              tx.update(pRef, {
                stockQuantity: nextStock,
                variants: nextVariants,
                salesCount: (pData.salesCount || 0) + item.quantity,
                status: nextStock === 0 ? 'Out of Stock' : pData.status,
                updatedAt: serverTimestamp(),
              });
            });
          }
        }

        await setDoc(doc(db, targetCollection, orderId), orderPayload);

        // Create non-PII public order tracking lookup record
        await setDoc(doc(db, 'orderTracking', orderNum), {
          orderNumber: orderNum,
          orderStatus: 'Order Placed',
          courierName: orderPayload.courierName,
          trackingNumber: '',
          destinationCity: params.city.trim(),
          statusHistory: initialHistory,
          updatedAt: serverTimestamp(),
        });

        if (isAuthed) {
          await setDoc(doc(db, 'notifications', makeId('notif')), {
            recipientId: firebaseUser!.uid,
            audience: 'customer',
            type: 'order_placed',
            title: `Order ${orderNum} Placed`,
            message: `Thank you for shopping with Deboo.pk. Your order (${params.city}) is being prepared at our Karachi warehouse.`,
            read: false,
            link: `/track-order?order=${orderNum}`,
            createdAt: serverTimestamp(),
          }).catch(() => {});
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `${targetCollection}/${orderId}`);
      }

      const createdOrder: Order = {
        ...orderPayload,
        id: orderId,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      // Update local state immediately
      setProducts((prev) =>
        prev.map((p) => {
          const ordered = cart.filter((c) => c.productId === p.id);
          if (ordered.length === 0) return p;
          const totalOrdered = ordered.reduce((s, c) => s + c.quantity, 0);
          return {
            ...p,
            stockQuantity: Math.max(0, p.stockQuantity - totalOrdered),
            salesCount: p.salesCount + totalOrdered,
          };
        })
      );

      if (isAuthed) {
        setMyOrders((prev) => [createdOrder, ...prev]);
      }

      trackEvent({
        eventType: 'purchase',
        city: params.city,
        source: params.paymentMethod,
      });
      if (params.couponCode) {
        trackEvent({ eventType: 'coupon_use', searchQuery: params.couponCode });
      }

      clearCart();
      return createdOrder;
    },
    [cart, firebaseUser, settings.guestCheckoutEnabled, isCatalogFromFirestore, trackEvent, clearCart]
  );

  const lookupOrderTracking = useCallback(
    async (orderNumber: string): Promise<OrderTrackingRecord | null> => {
      const clean = orderNumber.trim().toUpperCase();
      if (!clean) return null;

      try {
        const snap = await getDoc(doc(db, 'orderTracking', clean));
        if (snap.exists()) {
          const d = snap.data();
          return {
            orderNumber: d.orderNumber,
            orderStatus: d.orderStatus,
            courierName: d.courierName || '',
            trackingNumber: d.trackingNumber || '',
            destinationCity: d.destinationCity,
            statusHistory: d.statusHistory || [],
            updatedAt: tsToIso(d.updatedAt),
          };
        }
      } catch {
        // fallback check
      }

      const localMatch =
        myOrders.find((o) => o.orderNumber.toUpperCase() === clean) ||
        SEED_DEMO_ORDERS.find((o) => o.orderNumber.toUpperCase() === clean);
      if (localMatch) {
        return {
          orderNumber: localMatch.orderNumber,
          orderStatus: localMatch.orderStatus,
          courierName: localMatch.courierName,
          trackingNumber: localMatch.trackingNumber,
          destinationCity: localMatch.city,
          statusHistory: localMatch.statusHistory,
          updatedAt: localMatch.updatedAt,
        };
      }
      return null;
    },
    [myOrders]
  );

  const submitReview = useCallback(
    async (params: {
      productId: string;
      productName: string;
      rating: number;
      title: string;
      comment: string;
      photoUrl?: string;
    }) => {
      if (!firebaseUser?.emailVerified) {
        throw new Error('Please sign in with a verified email to submit a review.');
      }
      const alreadyReviewed = reviews.some(
        (r) => r.productId === params.productId && r.userId === firebaseUser.uid
      );
      if (alreadyReviewed) {
        throw new Error('You have already submitted a review for this product.');
      }

      const hasPurchased = myOrders.some(
        (o) =>
          o.orderStatus !== 'Cancelled' &&
          o.items.some((it) => it.productId === params.productId)
      );

      const id = makeId('rev');
      try {
        await setDoc(doc(db, 'reviews', id), {
          productId: params.productId,
          productName: params.productName,
          userId: firebaseUser.uid,
          authorName: profile?.fullName || firebaseUser.displayName || 'Deboo Client',
          rating: Math.max(1, Math.min(5, Math.round(params.rating))),
          title: params.title.trim(),
          comment: params.comment.trim(),
          photoUrl: (params.photoUrl || '').trim(),
          verifiedPurchase: hasPurchased,
          status: 'Pending',
          featured: false,
          isDemo: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `reviews/${id}`);
      }
    },
    [firebaseUser, profile, reviews, myOrders]
  );

  const subscribeNewsletter = useCallback(async (email: string, source = 'footer') => {
    const clean = email.trim().toLowerCase();
    if (!clean.includes('@')) throw new Error('Please enter a valid email address.');
    const id = clean.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
    try {
      await setDoc(doc(db, 'newsletter', id), {
        email: clean,
        source,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `newsletter/${id}`);
    }
  }, []);

  const stripForFirestore = useCallback(<T extends Record<string, unknown>>(obj: T): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    Object.entries(obj).forEach(([key, val]) => {
      if (key === 'id' || val === undefined) return;
      out[key] = val;
    });
    return out;
  }, []);

  const ensureSeedProductsInFirestore = useCallback(async () => {
    const snap = await getDocs(query(collection(db, 'products'), limit(1)));
    if (!snap.empty) return;
    const batch = writeBatch(db);
    SEED_PRODUCTS.forEach((p) => {
      batch.set(doc(db, 'products', p.id), {
        ...stripForFirestore(p as unknown as Record<string, unknown>),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }, [stripForFirestore]);

  // Admin Mutations
  const upsertProduct = useCallback(
    async (prod: Partial<Product> & { name: string; sku: string; categoryName: string; price: number }) => {
      const id = prod.id || makeId('prod');
      const generatedSlug = prod.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const slug = ((prod.slug || generatedSlug || id.toLowerCase()).trim() || id.toLowerCase()).slice(0, 180);
      const cleanImages = (prod.images || [])
        .map((img) => img.trim())
        .filter((img) => img.length > 0 && img.length <= 500)
        .slice(0, 12);
      const ref = doc(db, 'products', id);

      const payload: Record<string, unknown> = {
        name: (prod.name.trim() || 'Untitled Product').slice(0, 180),
        slug,
        sku: (prod.sku.trim() || id.toUpperCase()).slice(0, 64),
        categoryId: (prod.categoryId || 'cat_stitched').slice(0, 128),
        categoryName: (prod.categoryName || 'Stitched Suits').slice(0, 100),
        collectionId: (prod.collectionId || '').slice(0, 128),
        collectionName: (prod.collectionName || '').slice(0, 120),
        brand: (prod.brand || 'Deboo.pk').slice(0, 80),
        shortDescription: (prod.shortDescription || '').slice(0, 300),
        description: (prod.description || '').slice(0, 4000),
        price: Math.max(0, Number(prod.price || 0)),
        salePrice: prod.salePrice ? Math.max(0, Number(prod.salePrice)) : 0,
        costPrice: Math.max(0, Number(prod.costPrice || 0)),
        images: cleanImages.length > 0 ? cleanImages : [SEED_PRODUCTS[0].images[0]],
        videoUrl: (prod.videoUrl || '').slice(0, 500),
        fabricDetails: (prod.fabricDetails || 'Pure Luxury Pakistani Textile').slice(0, 400),
        productType: (prod.productType || 'Stitched').slice(0, 80),
        colors: prod.colors && prod.colors.length > 0 ? prod.colors.slice(0, 15) : [{ name: 'Ivory', hex: '#FAF8F3' }],
        sizes: prod.sizes && prod.sizes.length > 0 ? prod.sizes.slice(0, 15) : ['S', 'M', 'L'],
        variants: (prod.variants || []).slice(0, 60),
        stockQuantity: Math.max(0, Number(prod.stockQuantity ?? 10)),
        trackInventory: prod.trackInventory ?? true,
        featured: Boolean(prod.featured),
        newArrival: Boolean(prod.newArrival),
        bestSeller: Boolean(prod.bestSeller),
        onSale: Boolean(prod.onSale),
        tags: (prod.tags || []).slice(0, 20),
        seoTitle: (prod.seoTitle || `${prod.name} | Deboo.pk`).slice(0, 160),
        seoDescription: (prod.seoDescription || prod.shortDescription || '').slice(0, 300),
        metaKeywords: (prod.metaKeywords || '').slice(0, 300),
        weightGrams: Math.max(0, Number(prod.weightGrams || 650)),
        shippingInfo: (prod.shippingInfo || 'Dispatched from Karachi Main Warehouse.').slice(0, 300),
        status: prod.status || 'Active',
        isDemo: Boolean(prod.isDemo),
        updatedAt: serverTimestamp(),
      };

      let operationType = OperationType.UPDATE;
      try {
        if (prod.id && SEED_PRODUCTS.some((s) => s.id === prod.id)) {
          await ensureSeedProductsInFirestore();
        }
        const existingSnap = await getDoc(ref);
        const isCreate = !existingSnap.exists();
        operationType = isCreate ? OperationType.CREATE : OperationType.UPDATE;

        if (isCreate) {
          payload.viewCount = Math.max(0, Number(prod.viewCount ?? 0));
          payload.wishlistCount = Math.max(0, Number(prod.wishlistCount ?? 0));
          payload.salesCount = Math.max(0, Number(prod.salesCount ?? 0));
          payload.createdAt = serverTimestamp();
          await setDoc(ref, payload);
        } else {
          await updateDoc(ref, payload);
        }
        await writeAuditLog(
          isCreate ? 'CREATE_PRODUCT' : 'UPDATE_PRODUCT',
          'product',
          id,
          `${prod.name} (${prod.sku})`
        );
        await Promise.all([loadPublicCatalog(), refreshAdminData()]);
      } catch (err) {
        handleFirestoreError(err, operationType, `products/${id}`);
      }
    },
    [ensureSeedProductsInFirestore, writeAuditLog, loadPublicCatalog, refreshAdminData]
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      try {
        if (SEED_PRODUCTS.some((s) => s.id === productId)) {
          await ensureSeedProductsInFirestore();
        }
        await deleteDoc(doc(db, 'products', productId));
        await writeAuditLog('DELETE_PRODUCT', 'product', productId, `Deleted product ${productId}`);
        await Promise.all([loadPublicCatalog(), refreshAdminData()]);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
      }
    },
    [ensureSeedProductsInFirestore, writeAuditLog, loadPublicCatalog, refreshAdminData]
  );

  const adjustInventory = useCallback(
    async (params: {
      productId: string;
      variantSku?: string;
      type: InventoryMovementType;
      quantityDelta: number;
      reason: string;
      supplier?: string;
    }) => {
      if (!firebaseUser) return;
      const product = adminProducts.find((p) => p.id === params.productId);
      if (!product) throw new Error('Product not found');
      const prevStock = product.stockQuantity;
      const nextStock = Math.max(0, prevStock + params.quantityDelta);
      const nextVariants = (product.variants || []).map((v) =>
        params.variantSku && v.sku === params.variantSku
          ? { ...v, stock: Math.max(0, v.stock + params.quantityDelta) }
          : v
      );
      const nextStatus =
        nextStock === 0 ? 'Out of Stock' : product.status === 'Out of Stock' ? 'Active' : product.status;

      const prodRef = doc(db, 'products', params.productId);
      try {
        if (SEED_PRODUCTS.some((s) => s.id === params.productId)) {
          await ensureSeedProductsInFirestore();
        }
        const prodSnap = await getDoc(prodRef);
        if (!prodSnap.exists()) {
          await setDoc(prodRef, {
            ...stripForFirestore(product as unknown as Record<string, unknown>),
            stockQuantity: nextStock,
            variants: nextVariants,
            status: nextStatus,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(prodRef, {
            stockQuantity: nextStock,
            variants: nextVariants,
            status: nextStatus,
            updatedAt: serverTimestamp(),
          });
        }

        const movId = makeId('inv');
        await setDoc(doc(db, 'inventoryMovements', movId), {
          productId: params.productId,
          productName: product.name.slice(0, 180),
          variantSku: (params.variantSku || product.sku).slice(0, 80),
          type: params.type,
          quantityDelta: params.quantityDelta,
          previousStock: Math.max(0, prevStock),
          newStock: nextStock,
          reason: (params.reason || '').slice(0, 300),
          supplier: (params.supplier || '').slice(0, 120),
          performedBy: firebaseUser.uid,
          createdAt: serverTimestamp(),
        });
        await writeAuditLog(
          'ADJUST_INVENTORY',
          'product',
          params.productId,
          `${params.type} (${params.quantityDelta >= 0 ? '+' : ''}${params.quantityDelta}): ${prevStock} -> ${nextStock}`
        );
        await Promise.all([loadPublicCatalog(), refreshAdminData()]);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `products/${params.productId}`);
      }
    },
    [
      firebaseUser,
      adminProducts,
      ensureSeedProductsInFirestore,
      stripForFirestore,
      writeAuditLog,
      loadPublicCatalog,
      refreshAdminData,
    ]
  );

  const updateOrderStatus = useCallback(
    async (params: {
      orderId: string;
      isGuestOrder: boolean;
      orderStatus: OrderStatus;
      paymentStatus?: PaymentStatus;
      trackingNumber?: string;
      courierName?: string;
      note?: string;
    }) => {
      const targetOrder = adminOrders.find((o) => o.id === params.orderId);
      if (!targetOrder) return;
      const nextHistory = [
        ...(targetOrder.statusHistory || []),
        {
          status: params.orderStatus,
          note: params.note || `Order marked as ${params.orderStatus}`,
          timestamp: new Date().toISOString(),
          actor: firebaseUser?.email || 'Admin',
        },
      ];

      const colName = params.isGuestOrder ? 'guestOrders' : 'orders';
      try {
        await updateDoc(doc(db, colName, params.orderId), {
          orderStatus: params.orderStatus,
          paymentStatus: params.paymentStatus || targetOrder.paymentStatus,
          trackingNumber: params.trackingNumber ?? targetOrder.trackingNumber ?? '',
          courierName: params.courierName ?? targetOrder.courierName ?? '',
          statusHistory: nextHistory,
          updatedAt: serverTimestamp(),
        });

        await setDoc(
          doc(db, 'orderTracking', targetOrder.orderNumber),
          {
            orderNumber: targetOrder.orderNumber,
            orderStatus: params.orderStatus,
            courierName: params.courierName ?? targetOrder.courierName ?? 'TCS Express',
            trackingNumber: params.trackingNumber ?? targetOrder.trackingNumber ?? '',
            destinationCity: targetOrder.city,
            statusHistory: nextHistory,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        await writeAuditLog(
          'UPDATE_ORDER_STATUS',
          'order',
          params.orderId,
          `${targetOrder.orderNumber} -> ${params.orderStatus}`
        );
        await refreshAdminData();
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `${colName}/${params.orderId}`);
      }
    },
    [adminOrders, firebaseUser, writeAuditLog, refreshAdminData]
  );

  const upsertCategory = useCallback(
    async (cat: Partial<Category> & { name: string; slug: string }) => {
      const id = cat.id || `cat_${cat.slug.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const ref = doc(db, 'categories', id);
      const data: Record<string, unknown> = {
        name: cat.name.slice(0, 100),
        slug: cat.slug.slice(0, 120),
        description: (cat.description || '').slice(0, 500),
        image: (cat.image || SEED_CATEGORIES[0].image).slice(0, 500),
        sortOrder: Number(cat.sortOrder || 10),
        active: cat.active ?? true,
        isDemo: Boolean(cat.isDemo),
        updatedAt: serverTimestamp(),
      };

      try {
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          data.createdAt = serverTimestamp();
          await setDoc(ref, data);
        } else {
          await updateDoc(ref, data);
        }
        await loadPublicCatalog();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `categories/${id}`);
      }
    },
    [loadPublicCatalog]
  );

  const upsertCollection = useCallback(
    async (col: Partial<Collection> & { name: string; slug: string }) => {
      const id = col.id || `col_${col.slug.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const ref = doc(db, 'collections', id);
      const data: Record<string, unknown> = {
        name: col.name.slice(0, 120),
        slug: col.slug.slice(0, 120),
        season: (col.season || '2026 Edit').slice(0, 80),
        description: (col.description || '').slice(0, 500),
        image: (col.image || SEED_COLLECTIONS[0].image).slice(0, 500),
        featured: Boolean(col.featured),
        active: col.active ?? true,
        isDemo: Boolean(col.isDemo),
        updatedAt: serverTimestamp(),
      };

      try {
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          data.createdAt = serverTimestamp();
          await setDoc(ref, data);
        } else {
          await updateDoc(ref, data);
        }
        await loadPublicCatalog();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `collections/${id}`);
      }
    },
    [loadPublicCatalog]
  );

  const upsertCoupon = useCallback(
    async (coupon: Partial<Coupon> & { code: string; type: Coupon['type']; value: number }) => {
      const cleanCode = coupon.code.trim().toUpperCase().slice(0, 40);
      const id = cleanCode;
      const ref = doc(db, 'coupons', id);
      const data: Record<string, unknown> = {
        code: cleanCode,
        type: coupon.type,
        value: Math.max(0, Number(coupon.value)),
        minOrderAmount: Math.max(0, Number(coupon.minOrderAmount || 0)),
        maxUses: Math.max(0, Number(coupon.maxUses || 100)),
        usedCount: Math.max(0, Number(coupon.usedCount || 0)),
        expiresAt: (coupon.expiresAt || '').slice(0, 64),
        active: coupon.active ?? true,
        description: (coupon.description || '').slice(0, 240),
        isDemo: Boolean(coupon.isDemo),
        updatedAt: serverTimestamp(),
      };

      try {
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          data.createdAt = serverTimestamp();
          await setDoc(ref, data);
        } else {
          await updateDoc(ref, data);
        }
        await writeAuditLog('UPSERT_COUPON', 'coupon', id, `${cleanCode} (${coupon.type})`);
        await refreshAdminData();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `coupons/${id}`);
      }
    },
    [writeAuditLog, refreshAdminData]
  );

  const deleteCoupon = useCallback(
    async (id: string) => {
      try {
        await deleteDoc(doc(db, 'coupons', id));
        await refreshAdminData();
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `coupons/${id}`);
      }
    },
    [refreshAdminData]
  );

  const upsertBanner = useCallback(
    async (banner: Partial<Banner> & { title: string; subtitle: string; desktopImage: string }) => {
      const id = banner.id || makeId('ban');
      const ref = doc(db, 'banners', id);
      const data: Record<string, unknown> = {
        title: banner.title.slice(0, 160),
        subtitle: banner.subtitle.slice(0, 360),
        ctaPrimaryText: (banner.ctaPrimaryText || 'Shop Collection').slice(0, 60),
        ctaPrimaryLink: (banner.ctaPrimaryLink || '/shop').slice(0, 200),
        ctaSecondaryText: (banner.ctaSecondaryText || 'Explore New Arrivals').slice(0, 60),
        ctaSecondaryLink: (banner.ctaSecondaryLink || '/new-arrivals').slice(0, 200),
        desktopImage: banner.desktopImage.slice(0, 500),
        mobileImage: (banner.mobileImage || banner.desktopImage).slice(0, 500),
        active: banner.active ?? true,
        sortOrder: Number(banner.sortOrder || 1),
        isDemo: Boolean(banner.isDemo),
        updatedAt: serverTimestamp(),
      };

      try {
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          data.createdAt = serverTimestamp();
          await setDoc(ref, data);
        } else {
          await updateDoc(ref, data);
        }
        await loadPublicCatalog();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `banners/${id}`);
      }
    },
    [loadPublicCatalog]
  );

  const deleteBanner = useCallback(
    async (id: string) => {
      try {
        await deleteDoc(doc(db, 'banners', id));
        await loadPublicCatalog();
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `banners/${id}`);
      }
    },
    [loadPublicCatalog]
  );

  const moderateReview = useCallback(
    async (id: string, updates: { status: Review['status']; featured?: boolean; adminReply?: string }) => {
      try {
        await updateDoc(doc(db, 'reviews', id), {
          status: updates.status,
          featured: Boolean(updates.featured),
          adminReply: updates.adminReply || '',
          updatedAt: serverTimestamp(),
        });
        await Promise.all([loadPublicCatalog(), refreshAdminData()]);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `reviews/${id}`);
      }
    },
    [loadPublicCatalog, refreshAdminData]
  );

  const upsertStaffRole = useCallback(
    async (staff: AdminRecord) => {
      try {
        await setDoc(doc(db, 'admins', staff.uid), {
          uid: staff.uid,
          email: staff.email,
          fullName: staff.fullName,
          role: staff.role,
          permissions: staff.permissions,
          active: staff.active,
          assignedBy: firebaseUser?.uid || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await writeAuditLog('ASSIGN_ROLE', 'admin', staff.uid, `${staff.email} -> ${staff.role}`);
        await refreshAdminData();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `admins/${staff.uid}`);
      }
    },
    [firebaseUser, writeAuditLog, refreshAdminData]
  );

  const removeStaffRole = useCallback(
    async (uid: string) => {
      try {
        await deleteDoc(doc(db, 'admins', uid));
        await writeAuditLog('REMOVE_ROLE', 'admin', uid, `Removed staff access for ${uid}`);
        await refreshAdminData();
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `admins/${uid}`);
      }
    },
    [writeAuditLog, refreshAdminData]
  );

  const updateStoreSettings = useCallback(
    async (next: StoreSettings) => {
      try {
        await setDoc(doc(db, 'settings', 'public'), {
          ...next,
          updatedAt: serverTimestamp(),
        });
        setSettings(next);
        await writeAuditLog('UPDATE_SETTINGS', 'settings', 'public', 'Updated storefront configuration');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'settings/public');
      }
    },
    [writeAuditLog]
  );

  const syncDemoDataToFirestore = useCallback(async () => {
    const batch = writeBatch(db);
    SEED_CATEGORIES.forEach((c) => {
      batch.set(doc(db, 'categories', c.id), {
        ...stripForFirestore(c as unknown as Record<string, unknown>),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    SEED_COLLECTIONS.forEach((c) => {
      batch.set(doc(db, 'collections', c.id), {
        ...stripForFirestore(c as unknown as Record<string, unknown>),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    SEED_BANNERS.forEach((b) => {
      batch.set(doc(db, 'banners', b.id), {
        ...stripForFirestore(b as unknown as Record<string, unknown>),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    SEED_PRODUCTS.forEach((p) => {
      batch.set(doc(db, 'products', p.id), {
        ...stripForFirestore(p as unknown as Record<string, unknown>),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    SEED_COUPONS.forEach((c) => {
      batch.set(doc(db, 'coupons', c.id), {
        ...stripForFirestore(c as unknown as Record<string, unknown>),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    SEED_REVIEWS.forEach((r) => {
      batch.set(doc(db, 'reviews', r.id), {
        ...stripForFirestore(r as unknown as Record<string, unknown>),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    batch.set(doc(db, 'settings', 'public'), {
      ...DEFAULT_STORE_SETTINGS,
      updatedAt: serverTimestamp(),
    });
    try {
      await batch.commit();
      await writeAuditLog('SYNC_DEMO_CATALOG', 'system', 'catalog', 'Synced initial demo catalog to Firestore');
      await Promise.all([loadPublicCatalog(), refreshAdminData()]);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'batch/syncDemoData');
    }
  }, [stripForFirestore, writeAuditLog, loadPublicCatalog, refreshAdminData]);

  const clearDemoDataFromFirestore = useCallback(async () => {
    const collectionsToClean = ['products', 'categories', 'collections', 'banners', 'coupons', 'reviews', 'orders', 'guestOrders'];
    try {
      const batch = writeBatch(db);
      for (const colName of collectionsToClean) {
        const snap = await getDocs(query(collection(db, colName), where('isDemo', '==', true)));
        snap.docs.forEach((d) => batch.delete(d.ref));
      }
      await batch.commit();
      await writeAuditLog('CLEAR_DEMO_DATA', 'system', 'catalog', 'Removed all demo-tagged records from Firestore');
      await Promise.all([loadPublicCatalog(), refreshAdminData()]);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'batch/clearDemoData');
    }
  }, [writeAuditLog, loadPublicCatalog, refreshAdminData]);

  const value = useMemo(
    () => ({
      products,
      categories,
      collections,
      banners,
      reviews,
      settings,
      catalogLoading,
      customerDataLoading,
      isCatalogFromFirestore,
      cart,
      cartOpen,
      setCartOpen,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      wishlistIds,
      wishlistItems,
      toggleWishlist,
      recentlyViewedIds,
      markProductViewed,
      addresses,
      saveAddress,
      deleteAddress,
      myOrders,
      notifications,
      markNotificationRead,
      validateCouponCode,
      placeOrder,
      lookupOrderTracking,
      submitReview,
      subscribeNewsletter,
      analyticsConsent,
      setAnalyticsConsent,
      trackEvent,
      adminProducts,
      adminOrders,
      adminCoupons,
      adminReviews,
      inventoryMovements,
      analyticsEvents,
      newsletterSubscribers,
      staffRecords,
      auditLogs,
      customersList,
      refreshAdminData,
      upsertProduct,
      deleteProduct,
      adjustInventory,
      updateOrderStatus,
      upsertCategory,
      upsertCollection,
      upsertCoupon,
      deleteCoupon,
      upsertBanner,
      deleteBanner,
      moderateReview,
      upsertStaffRole,
      removeStaffRole,
      updateStoreSettings,
      syncDemoDataToFirestore,
      clearDemoDataFromFirestore,
    }),
    [
      products,
      categories,
      collections,
      banners,
      reviews,
      settings,
      catalogLoading,
      customerDataLoading,
      isCatalogFromFirestore,
      cart,
      cartOpen,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      wishlistIds,
      wishlistItems,
      toggleWishlist,
      recentlyViewedIds,
      markProductViewed,
      addresses,
      saveAddress,
      deleteAddress,
      myOrders,
      notifications,
      markNotificationRead,
      validateCouponCode,
      placeOrder,
      lookupOrderTracking,
      submitReview,
      subscribeNewsletter,
      analyticsConsent,
      setAnalyticsConsent,
      trackEvent,
      adminProducts,
      adminOrders,
      adminCoupons,
      adminReviews,
      inventoryMovements,
      analyticsEvents,
      newsletterSubscribers,
      staffRecords,
      auditLogs,
      customersList,
      refreshAdminData,
      upsertProduct,
      deleteProduct,
      adjustInventory,
      updateOrderStatus,
      upsertCategory,
      upsertCollection,
      upsertCoupon,
      deleteCoupon,
      upsertBanner,
      deleteBanner,
      moderateReview,
      upsertStaffRole,
      removeStaffRole,
      updateStoreSettings,
      syncDemoDataToFirestore,
      clearDemoDataFromFirestore,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
