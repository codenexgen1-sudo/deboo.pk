/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { AnimatePresence, motion, MotionConfig, type Variants } from 'motion/react';
import { CartDrawer } from './components/CartDrawer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
import { RouterProvider, useRouter } from './context/RouterContext';
import { StoreProvider } from './context/StoreContext';
import { AccountPage } from './pages/AccountPage';
import { AdminPanel } from './pages/AdminPanel';
import { AuthPages } from './pages/AuthPages';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ShopPage } from './pages/ShopPage';
import { AboutPage, ContactPage, FaqPage, PolicyPage } from './pages/StaticPages';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { WishlistPage } from './pages/WishlistPage';
import { useSeoMetadata } from './hooks/useSeoMetadata';
import { normalizeRoutePath } from './utils/routeTransitions';

const NotFoundPage: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
  useSeoMetadata({
    title: 'Page Not Found | Deboo.pk',
    description: 'The Deboo.pk collection or page you requested could not be found.',
    noIndex: true,
  });

  return (
    <main className="max-w-3xl mx-auto px-4 py-20 text-center space-y-5">
      <p className="text-xs uppercase tracking-[0.2em] text-[#9D7B38]">Deboo.pk</p>
      <h1 className="font-serif text-4xl text-[#222222]">Page Not Found</h1>
      <p className="text-sm text-[#777777]">
        The collection or page you requested could not be found.
      </p>
      <button
        type="button"
        onClick={onGoHome}
        className="px-6 py-3 bg-[#222222] text-white text-xs uppercase tracking-[0.16em]"
      >
        Return Home
      </button>
    </main>
  );
};

const LUXURY_FADE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const LUXURY_EXIT_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

const luxuryFadeInVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
    scale: 0.996,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.42,
      ease: LUXURY_FADE_EASE,
      opacity: { duration: 0.38, ease: LUXURY_FADE_EASE },
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.998,
    transition: {
      duration: 0.18,
      ease: LUXURY_EXIT_EASE,
    },
  },
};

const AppRoutes: React.FC = () => {
  const { pathname, navigate } = useRouter();
  const cleanPath = normalizeRoutePath(pathname);

  const renderPage = () => {
    if (cleanPath === '/' || cleanPath === '') return <HomePage />;
    if (cleanPath === '/shop') return <ShopPage mode="all" />;
    if (cleanPath === '/new-arrivals') return <ShopPage mode="new" />;
    if (cleanPath === '/best-sellers') return <ShopPage mode="best" />;
    if (cleanPath === '/sale') return <ShopPage mode="sale" />;
    if (cleanPath === '/collections') return <ShopPage mode="collections" />;
    if (cleanPath === '/search') return <ShopPage mode="search" />;

    if (cleanPath.startsWith('/categories/')) {
      const slug = decodeURIComponent(cleanPath.slice('/categories/'.length));
      return <ShopPage mode="category" categorySlug={slug} />;
    }
    if (cleanPath === '/categories') return <ShopPage mode="all" />;

    if (cleanPath.startsWith('/product/')) {
      const slug = decodeURIComponent(cleanPath.slice('/product/'.length));
      return <ProductDetailPage slug={slug} />;
    }

    if (cleanPath === '/wishlist') return <WishlistPage />;
    if (cleanPath === '/cart') return <CartPage />;
    if (cleanPath === '/checkout') return <CheckoutPage />;

    if (cleanPath === '/login') return <AuthPages mode="login" />;
    if (cleanPath === '/register') return <AuthPages mode="register" />;
    if (cleanPath === '/verify-email') return <AuthPages mode="verify-email" />;
    if (cleanPath === '/forgot-password') return <AuthPages mode="forgot-password" />;

    if (cleanPath === '/account') return <AccountPage initialTab="overview" />;
    if (cleanPath === '/orders') return <AccountPage initialTab="orders" />;
    if (cleanPath === '/track-order') return <TrackOrderPage />;

    if (cleanPath === '/about') return <AboutPage />;
    if (cleanPath === '/contact') return <ContactPage />;
    if (cleanPath === '/faq') return <FaqPage />;
    if (cleanPath === '/shipping-policy') return <PolicyPage type="shipping" />;
    if (cleanPath === '/return-policy') return <PolicyPage type="return" />;
    if (cleanPath === '/privacy-policy') return <PolicyPage type="privacy" />;
    if (cleanPath === '/terms') return <PolicyPage type="terms" />;

    if (cleanPath.startsWith('/admin')) return <AdminPanel />;

    return <NotFoundPage onGoHome={() => navigate('/')} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F3] text-[#222222]">
      <Navbar />
      <CartDrawer />
      <div className="flex-1 overflow-x-clip">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={cleanPath}
            variants={luxuryFadeInVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="will-change-transform"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <RouterProvider>
          <AuthProvider>
            <StoreProvider>
              <AppRoutes />
            </StoreProvider>
          </AuthProvider>
        </RouterProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
