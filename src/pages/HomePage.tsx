import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { SafeImage } from '../components/SafeImage';
import { PageContentSkeleton } from '../components/SkeletonLoader';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { IMG_ASSETS } from '../data/seedCatalog';
import { useSeoMetadata } from '../hooks/useSeoMetadata';
import { filterAndSortProducts } from '../utils/commerce';

const LUXURY_EASE = [0.16, 1, 0.3, 1] as const;

export const HomePage: React.FC = () => {
  const { navigate } = useRouter();
  const { banners, categories, collections, products, reviews, catalogLoading, trackEvent } = useStore();

  const [bannerIndex, setBannerIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'new' | 'best' | 'trending' | 'sale'>('new');

  useSeoMetadata({
    title: "Deboo.pk — Everything, But Better. | Luxury Pakistani Women's Fashion",
    description:
      "Everything, But Better. Discover timeless Pakistani women's fashion at Deboo.pk — unstitched lawn, stitched 3-piece suits, festive formals, and accessories dispatched from Karachi.",
    image: banners[0]?.desktopImage || IMG_ASSETS.heroSilk,
    pathname: '/',
  });

  useEffect(() => {
    trackEvent({ eventType: 'page_view', source: 'home' });
  }, [trackEvent]);

  const activeBanners = useMemo(() => banners.filter((b) => b.active), [banners]);
  const currentBanner = activeBanners[bannerIndex % Math.max(1, activeBanners.length)] || banners[0];

  const showcasedProducts = useMemo(() => {
    switch (activeTab) {
      case 'best':
        return filterAndSortProducts(products, { onlyBestSellers: true, sortBy: 'bestselling' }).slice(0, 6);
      case 'trending':
        return [...products]
          .filter((p) => p.status === 'Active')
          .sort((a, b) => b.viewCount + b.wishlistCount * 2 - (a.viewCount + a.wishlistCount * 2))
          .slice(0, 6);
      case 'sale':
        return filterAndSortProducts(products, { onlySale: true }).slice(0, 6);
      case 'new':
      default:
        return filterAndSortProducts(products, { onlyNewArrivals: true, sortBy: 'newest' }).slice(0, 6);
    }
  }, [products, activeTab]);

  const featuredReviews = useMemo(
    () => reviews.filter((r) => r.status === 'Approved').slice(0, 3),
    [reviews]
  );

  if (catalogLoading) {
    return <PageContentSkeleton variant="home" label="Loading Deboo.pk atelier showcase" />;
  }

  return (
    <main>
      {/* 1. Primary Hero Campaign Showcase */}
      {currentBanner && (
        <section className="relative bg-[#222222] overflow-hidden">
          <div className="relative h-[540px] sm:h-[620px] lg:h-[680px] w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBanner.id}
                initial={{ opacity: 0.4, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.35 }}
                transition={{ duration: 0.65, ease: LUXURY_EASE }}
                className="absolute inset-0"
              >
                <picture>
                  <source
                    media="(max-width: 640px)"
                    srcSet={currentBanner.mobileImage || currentBanner.desktopImage}
                  />
                  <SafeImage
                    src={currentBanner.desktopImage}
                    alt={currentBanner.title}
                    loading="eager"
                    className="w-full h-full object-cover object-top"
                  />
                </picture>
              </motion.div>
            </AnimatePresence>

            {/* Measured scrim for WCAG AA contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/20 sm:bg-gradient-to-r sm:from-black/75 sm:via-black/40 sm:to-transparent" />

            <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`copy-${currentBanner.id}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: LUXURY_EASE }}
                  className="max-w-xl text-white"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-[#E8DCC3] mb-3">
                    Deboo.pk · Everything, But Better.
                  </p>
                  <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.08] tracking-tight">
                    {currentBanner.title}
                  </h1>
                  <p className="mt-4 text-sm sm:text-base text-[#FAF8F3]/90 leading-relaxed max-w-md">
                    {currentBanner.subtitle}
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <motion.a
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      href={currentBanner.ctaPrimaryLink}
                      onClick={(e) => {
                        e.preventDefault();
                        trackEvent({ eventType: 'banner_click', source: currentBanner.id });
                        navigate(currentBanner.ctaPrimaryLink);
                      }}
                      className="px-7 py-3.5 bg-[#C8A45D] text-[#222222] font-semibold text-xs uppercase tracking-[0.18em] hover:bg-[#E8DCC3] transition-colors inline-flex items-center gap-2 whitespace-nowrap"
                    >
                      <span>{currentBanner.ctaPrimaryText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.a>
                    <motion.a
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      href={currentBanner.ctaSecondaryLink}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(currentBanner.ctaSecondaryLink);
                      }}
                      className="px-7 py-3.5 border border-white/75 text-white text-xs uppercase tracking-[0.18em] hover:bg-white hover:text-[#222222] transition-colors whitespace-nowrap"
                    >
                      {currentBanner.ctaSecondaryText}
                    </motion.a>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {activeBanners.length > 1 && (
              <div className="absolute bottom-6 right-6 flex items-center gap-2 z-10">
                <button
                  type="button"
                  aria-label="Previous campaign banner"
                  onClick={() =>
                    setBannerIndex((i) => (i - 1 + activeBanners.length) % activeBanners.length)
                  }
                  className="w-10 h-10 bg-black/50 text-white hover:bg-black/80 flex items-center justify-center border border-white/25 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next campaign banner"
                  onClick={() => setBannerIndex((i) => (i + 1) % activeBanners.length)}
                  className="w-10 h-10 bg-black/50 text-white hover:bg-black/80 flex items-center justify-center border border-white/25 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 2. Shop by Category */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, ease: LUXURY_EASE }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#9D7B38]">Curated Wardrobes</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#222222] mt-1">
              Shop by Category
            </h2>
          </div>
          <a
            href="/shop"
            onClick={(e) => {
              e.preventDefault();
              navigate('/shop');
            }}
            className="text-xs uppercase tracking-[0.16em] text-[#222222] hover:text-[#9D7B38] inline-flex items-center gap-1.5 border-b border-[#222222] pb-0.5 self-start sm:self-auto"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.slice(0, 4).map((cat, idx) => (
            <motion.a
              key={cat.id}
              href={`/categories/${cat.slug}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.35, delay: idx * 0.06, ease: LUXURY_EASE }}
              onClick={(e) => {
                e.preventDefault();
                trackEvent({ eventType: 'category_view', categoryName: cat.name });
                navigate(`/categories/${cat.slug}`);
              }}
              className="group block bg-white border border-[#E8DCC3]/70 overflow-hidden hover:shadow-sm transition-shadow"
            >
              <div className="aspect-[4/3] bg-[#F3EFE6] overflow-hidden">
                <SafeImage
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                />
              </div>
              <div className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl text-[#222222] group-hover:text-[#9D7B38] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[#777777] mt-0.5 line-clamp-1">{cat.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#9D7B38] shrink-0 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </motion.a>
          ))}
        </div>
      </section>

      {/* 3. Signature Edit (New Arrivals / Best Sellers / Trending / Special Offers) */}
      <section className="bg-white border-y border-[#E8DCC3]/70 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#9D7B38]">
                Seasonal Selections
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#222222] mt-1">
                The Deboo Edit
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-[#FAF8F3] p-1 border border-[#E8DCC3]">
              {[
                { key: 'new', label: 'New Arrivals' },
                { key: 'best', label: 'Best Sellers' },
                { key: 'trending', label: 'Trending' },
                { key: 'sale', label: 'Special Offers' },
              ].map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`relative px-4 py-2 text-xs uppercase tracking-[0.14em] transition-colors whitespace-nowrap shrink-0 ${
                      isActive ? 'text-white' : 'text-[#777777] hover:text-[#222222]'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="debooEditTab"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className="absolute inset-0 bg-[#222222]"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: LUXURY_EASE }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7"
            >
              {showcasedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 text-center">
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                navigate(
                  activeTab === 'new'
                    ? '/new-arrivals'
                    : activeTab === 'best'
                      ? '/best-sellers'
                      : activeTab === 'sale'
                        ? '/sale'
                        : '/shop'
                )
              }
              className="px-8 py-3.5 border border-[#222222] text-[#222222] text-xs uppercase tracking-[0.18em] hover:bg-[#222222] hover:text-white transition-colors"
            >
              Explore Full Collection
            </motion.button>
          </div>
        </div>
      </section>

      {/* 4. Featured Collections & Karachi Brand Story Split */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, ease: LUXURY_EASE }}
            className="lg:col-span-6 relative bg-[#F3EFE6] min-h-[380px] overflow-hidden"
          >
            <SafeImage
              src={collections[1]?.image || IMG_ASSETS.prodVelvet}
              alt="Winter Velvet & Festive Couture"
              className="w-full h-full object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, ease: LUXURY_EASE }}
            className="lg:col-span-6 bg-white border border-[#E8DCC3] p-8 sm:p-12 flex flex-col justify-center"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[#9D7B38]">
              Karachi Atelier · Nationwide Delivery
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#222222] mt-2 leading-tight">
              Crafted for Modern Heirloom Wardrobes
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#777777] leading-relaxed">
              Every Deboo.pk silhouette begins in our Karachi design studio — pairing breathable Swiss lawn, lustrous raw silk, and winter micro-velvet with hand-finished zardozi and chikankari. Each parcel undergoes multi-point inspection before tracked courier dispatch across Pakistan.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-6 pt-6 border-t border-[#E8DCC3]">
              <div>
                <p className="font-serif text-2xl text-[#222222] tabular-nums">1–2 Days</p>
                <p className="text-xs text-[#777777] mt-1">Karachi Warehouse Dispatch</p>
              </div>
              <div>
                <p className="font-serif text-2xl text-[#222222] tabular-nums">100+ Cities</p>
                <p className="text-xs text-[#777777] mt-1">Tracked Courier Network</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => navigate('/collections')}
                className="px-6 py-3 bg-[#222222] text-white text-xs uppercase tracking-[0.16em] hover:bg-[#3A3A3A] transition-colors"
              >
                Browse Collections
              </button>
              <button
                type="button"
                onClick={() => navigate('/about')}
                className="px-6 py-3 border border-[#E8DCC3] text-[#222222] text-xs uppercase tracking-[0.16em] hover:border-[#222222] transition-colors"
              >
                Our Story
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. Verified Client Reviews */}
      <section className="bg-[#F3EFE6]/60 border-t border-[#E8DCC3] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[#9D7B38]">Client Impressions</p>
            <h2 className="font-serif text-3xl text-[#222222] mt-1">
              Trusted Across Pakistan
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredReviews.map((rev, idx) => (
              <motion.blockquote
                key={rev.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: idx * 0.08, ease: LUXURY_EASE }}
                className="bg-white border border-[#E8DCC3] p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-[#C8A45D] mb-3">
                    {Array.from({ length: rev.rating }).map((_, starIdx) => (
                      <Star key={starIdx} className="w-3.5 h-3.5 fill-[#C8A45D]" />
                    ))}
                  </div>
                  <p className="font-serif text-lg text-[#222222] mb-2">{rev.title}</p>
                  <p className="text-sm text-[#777777] leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>
                </div>
                <footer className="mt-5 pt-4 border-t border-[#E8DCC3]/60 text-xs text-[#222222] flex items-center justify-between">
                  <span className="font-medium">{rev.authorName}</span>
                  {rev.verifiedPurchase && (
                    <span className="text-[#9D7B38]">Verified Client</span>
                  )}
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};
