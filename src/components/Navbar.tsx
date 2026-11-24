import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Heart,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { BRAND_LOGO_URL } from '../data/seedCatalog';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../utils/commerce';

export const Navbar: React.FC = () => {
  const { pathname, navigate } = useRouter();
  const { firebaseUser, isStaff } = useAuth();
  const { cart, setCartOpen, wishlistIds, settings, trackEvent } = useStore();

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    trackEvent({ eventType: 'search', searchQuery: trimmed });
    setSearchOpen(false);
    setMobileMenuOpen(false);
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const navLinks = [
    { label: 'Shop', href: '/shop' },
    { label: 'New Arrivals', href: '/new-arrivals' },
    { label: 'Collections', href: '/collections' },
    { label: 'Best Sellers', href: '/best-sellers' },
    { label: 'Sale', href: '/sale' },
  ];

  const isAdminRoute = pathname.startsWith('/admin');
  if (isAdminRoute) return null;

  return (
    <>
      {!bannerDismissed && (
        <div className="bg-[#222222] text-[#FAF8F3] text-xs py-1.5 px-4 flex items-center justify-between border-b border-[#C8A45D]/25 no-print">
          <span className="hidden sm:inline text-[#E8DCC3]">Karachi Atelier &amp; Warehouse</span>
          <p className="mx-auto text-center tracking-wide truncate">
            Complimentary tracked delivery across Pakistan on orders above{' '}
            <span className="text-[#C8A45D] font-medium tabular-nums">
              {formatPKR(settings.freeShippingThreshold)}
            </span>
          </p>
          <button
            type="button"
            aria-label="Dismiss shipping announcement"
            onClick={() => setBannerDismissed(true)}
            className="text-[#E8DCC3] hover:text-white p-0.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8DCC3] transition-colors no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Mark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-[#222222] hover:text-[#9D7B38]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              aria-label="Deboo.pk Home"
              className="flex items-center shrink-0 focus-visible:outline-2 focus-visible:outline-[#C8A45D]"
            >
              <img
                src={BRAND_LOGO_URL}
                alt="Deboo.pk — Everything, But Better."
                className="h-10 sm:h-11 w-auto object-contain"
              />
            </a>
          </div>

          {/* Zone 2: Primary Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#222222]"
          >
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(link.href);
                  }}
                  className={`whitespace-nowrap shrink-0 py-1 border-b transition-colors ${
                    active
                      ? 'border-[#C8A45D] text-[#9D7B38]'
                      : 'border-transparent hover:border-[#C8A45D]/60 hover:text-[#9D7B38]'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: Storefront Utility Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              aria-label="Toggle product search"
              onClick={() => setSearchOpen((v) => !v)}
              className="p-2 text-[#222222] hover:text-[#9D7B38] transition-colors"
            >
              <Search className="w-5 h-5" strokeWidth={1.6} />
            </button>

            <a
              href="/wishlist"
              onClick={(e) => {
                e.preventDefault();
                navigate('/wishlist');
              }}
              aria-label={`Wishlist (${wishlistIds.length} items)`}
              className="relative p-2 text-[#222222] hover:text-[#9D7B38] transition-colors"
            >
              <Heart className="w-5 h-5" strokeWidth={1.6} />
              {wishlistIds.length > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-[#222222] text-white text-[10px] leading-4 text-center rounded-full tabular-nums">
                  {wishlistIds.length}
                </span>
              )}
            </a>

            {isStaff && (
              <a
                href="/admin"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/admin');
                }}
                aria-label="Admin Dashboard"
                title="Admin Dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#9D7B38] border border-[#C8A45D] hover:bg-[#FAF8F3] transition-colors whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </a>
            )}

            <a
              href={firebaseUser ? '/account' : '/login'}
              onClick={(e) => {
                e.preventDefault();
                navigate(firebaseUser ? '/account' : '/login');
              }}
              aria-label={firebaseUser ? 'Customer Account' : 'Sign In'}
              className="p-2 text-[#222222] hover:text-[#9D7B38] transition-colors"
            >
              <User className="w-5 h-5" strokeWidth={1.6} />
            </a>

            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              aria-label={`Open shopping bag (${cartCount} items)`}
              onClick={() => setCartOpen(true)}
              className="relative inline-flex items-center gap-2 pl-2.5 pr-3 py-2 bg-[#222222] text-white text-xs font-medium hover:bg-[#3A3A3A] transition-colors whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4 text-[#C8A45D]" strokeWidth={1.75} />
              <span className="hidden sm:inline">Bag</span>
              <motion.span
                key={cartCount}
                initial={{ scale: 0.85, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.18 }}
                className="tabular-nums text-[#E8DCC3]"
              >
                ({cartCount})
              </motion.span>
            </motion.button>
          </div>
        </div>

        {/* Expandable Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="border-t border-[#E8DCC3] bg-[#FAF8F3] px-4 py-3"
            >
              <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex items-center gap-3">
                <label htmlFor="global-search-input" className="sr-only">
                  Search Deboo.pk collection
                </label>
                <input
                  id="global-search-input"
                  type="search"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search raw silk, unstitched lawn, zardozi, velvet, SKU..."
                  className="flex-1 bg-white border border-[#E8DCC3] px-4 py-2.5 text-sm text-[#222222] placeholder:text-[#777777] focus:outline-none focus:border-[#C8A45D]"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#222222] text-white text-xs uppercase tracking-[0.15em] hover:bg-[#333333] transition-colors whitespace-nowrap shrink-0"
                >
                  Search
                </button>
                <button
                  type="button"
                  aria-label="Close search"
                  onClick={() => setSearchOpen(false)}
                  className="p-2 text-[#777777] hover:text-[#222222]"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-80 max-w-[85vw] bg-[#FAF8F3] h-full flex flex-col justify-between p-6 overflow-y-auto"
            >
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-[#E8DCC3]">
                <img
                  src={BRAND_LOGO_URL}
                  alt="Deboo.pk — Everything, But Better."
                  className="h-9 w-auto object-contain"
                />
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-[#222222]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSearchSubmit} className="mt-5 flex gap-2">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search suits, fabrics..."
                  className="flex-1 bg-white border border-[#E8DCC3] px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-[#222222] text-white text-xs"
                >
                  Go
                </button>
              </form>

              <nav className="mt-6 flex flex-col gap-3">
                {[
                  ...navLinks,
                  { label: 'Track Order', href: '/track-order' },
                  { label: 'About Deboo.pk', href: '/about' },
                  { label: 'Contact Us', href: '/contact' },
                  { label: 'My Account', href: firebaseUser ? '/account' : '/login' },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileMenuOpen(false);
                      navigate(item.href);
                    }}
                    className="py-2 text-base font-medium text-[#222222] border-b border-[#E8DCC3]/60 hover:text-[#9D7B38]"
                  >
                    {item.label}
                  </a>
                ))}
                {isStaff && (
                  <a
                    href="/admin"
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileMenuOpen(false);
                      navigate('/admin');
                    }}
                    className="py-2 text-base font-medium text-[#9D7B38]"
                  >
                    Admin Console
                  </a>
                )}
              </nav>
            </div>

            <div className="pt-6 text-xs text-[#777777]">
              <p>Main Warehouse: Karachi, Pakistan</p>
              <p className="mt-1">Nationwide Tracked Delivery</p>
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
