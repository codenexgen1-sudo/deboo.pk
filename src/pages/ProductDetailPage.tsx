import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  Heart,
  Minus,
  Plus,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  X,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { SafeImage } from '../components/SafeImage';
import { PageContentSkeleton } from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { useSeoMetadata } from '../hooks/useSeoMetadata';
import { formatPKR, getDiscountPercentage, getEffectivePrice } from '../utils/commerce';

export const ProductDetailPage: React.FC<{ slug: string }> = ({ slug }) => {
  const { navigate } = useRouter();
  const { firebaseUser } = useAuth();
  const {
    products,
    reviews,
    recentlyViewedIds,
    markProductViewed,
    addToCart,
    toggleWishlist,
    wishlistIds,
    submitReview,
    catalogLoading,
  } = useStore();

  const product = useMemo(
    () => products.find((p) => p.slug === slug) || products.find((p) => p.id === slug),
    [products, slug]
  );

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  // Review form state
  const [revRating, setRevRating] = useState(5);
  const [revTitle, setRevTitle] = useState('');
  const [revComment, setRevComment] = useState('');
  const [revPhoto, setRevPhoto] = useState('');
  const [revSubmitting, setRevSubmitting] = useState(false);
  const [revFeedback, setRevFeedback] = useState('');

  useSeoMetadata(
    product
      ? { product }
      : catalogLoading
      ? {
          title: 'Loading Garment | Deboo.pk',
          description: 'Loading handcrafted garment details from the Deboo.pk atelier.',
        }
      : {
          title: 'Piece Not Found | Deboo.pk',
          description: 'This Deboo.pk silhouette may have sold out or moved to a seasonal archive.',
          noIndex: true,
        }
  );

  useEffect(() => {
    if (!product) return;
    setActiveImageIdx(0);
    setSelectedColor(product.colors[0]?.name || 'Ivory');
    setSelectedSize(product.sizes[0] || 'M');
    setQuantity(1);
    markProductViewed(product);
  }, [product, markProductViewed]);

  if (catalogLoading && !product) {
    return <PageContentSkeleton variant="product-detail" label="Loading garment details" />;
  }

  if (!product) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-serif text-3xl text-[#222222]">Piece Not Found</h1>
        <p className="text-sm text-[#777777] mt-2 mb-6">
          This silhouette may have sold out or moved to a seasonal archive.
        </p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="px-6 py-3 bg-[#222222] text-white text-xs uppercase tracking-[0.16em]"
        >
          Return to Shop
        </button>
      </main>
    );
  }

  const effectivePrice = getEffectivePrice(product);
  const discountPct = getDiscountPercentage(product.price, product.onSale ? product.salePrice : undefined);
  const isWishlisted = wishlistIds.includes(product.id);

  const matchedVariant = product.variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );
  const availableStock = matchedVariant ? matchedVariant.stock : product.stockQuantity;
  const isOutOfStock = availableStock <= 0 || product.status === 'Out of Stock';

  const productReviews = reviews.filter((r) => r.productId === product.id && r.status === 'Approved');
  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.status === 'Active' && p.categoryName === product.categoryName)
    .slice(0, 3);
  const recentlyViewed = products
    .filter((p) => recentlyViewedIds.includes(p.id) && p.id !== product.id)
    .slice(0, 3);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevSubmitting(true);
    setRevFeedback('');
    try {
      await submitReview({
        productId: product.id,
        productName: product.name,
        rating: revRating,
        title: revTitle,
        comment: revComment,
        photoUrl: revPhoto,
      });
      setRevTitle('');
      setRevComment('');
      setRevPhoto('');
      setRevFeedback('Thank you. Your review has been submitted for editorial approval.');
    } catch (err) {
      setRevFeedback(err instanceof Error ? err.message : 'Unable to submit review.');
    } finally {
      setRevSubmitting(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Product JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            sku: product.sku,
            brand: { '@type': 'Brand', name: 'Deboo.pk' },
            description: product.shortDescription,
            offers: {
              '@type': 'Offer',
              priceCurrency: 'PKR',
              price: effectivePrice,
              availability: isOutOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
            },
          }),
        }}
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-xs text-[#777777] mb-6 flex items-center gap-2">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          className="hover:text-[#222222]"
        >
          Home
        </a>
        <span>/</span>
        <a
          href="/shop"
          onClick={(e) => {
            e.preventDefault();
            navigate('/shop');
          }}
          className="hover:text-[#222222]"
        >
          {product.categoryName}
        </a>
        <span>/</span>
        <span className="text-[#222222] truncate">{product.name}</span>
      </nav>

      {/* Main Split Gallery + Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Sticky Gallery with Interactive Zoom */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className="relative aspect-[3/4] bg-[#F3EFE6] overflow-hidden border border-[#E8DCC3]/70 cursor-zoom-in"
            onMouseEnter={() => setZoomActive(true)}
            onMouseLeave={() => setZoomActive(false)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setZoomOrigin(`${x}% ${y}%`);
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImageIdx}
                initial={{ opacity: 0.35 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.35 }}
                transition={{ duration: 0.22 }}
                className="w-full h-full"
              >
                <SafeImage
                  src={product.images[activeImageIdx] || product.images[0]}
                  alt={`${product.name} view ${activeImageIdx + 1}`}
                  loading="eager"
                  className={`w-full h-full object-cover transition-transform duration-200 ${
                    zoomActive ? 'scale-150' : 'scale-100'
                  }`}
                />
              </motion.div>
            </AnimatePresence>
            {zoomActive && (
              <style>{`.cursor-zoom-in img { transform-origin: ${zoomOrigin}; }`}</style>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`aspect-[3/4] bg-[#F3EFE6] overflow-hidden border ${
                    activeImageIdx === idx ? 'border-[#222222]' : 'border-[#E8DCC3]'
                  }`}
                >
                  <SafeImage
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {product.videoUrl && (
            <div className="bg-white border border-[#E8DCC3] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#777777] mb-2">
                Runway &amp; Drape Preview
              </p>
              <video controls className="w-full max-h-80 bg-black" src={product.videoUrl} />
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 bg-white border border-[#E8DCC3] p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#9D7B38]">
              <span>{product.categoryName}</span>
              {product.collectionName && (
                <>
                  <span>·</span>
                  <span>{product.collectionName}</span>
                </>
              )}
              <span>·</span>
              <span className="font-mono text-[#777777]">{matchedVariant?.sku || product.sku}</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#222222] mt-2 leading-tight">
              {product.name}
            </h1>
            <div className="mt-3 flex items-baseline gap-3 tabular-nums">
              <span className="text-2xl font-semibold text-[#222222]">
                {formatPKR(effectivePrice)}
              </span>
              {discountPct > 0 && (
                <>
                  <span className="text-base text-[#777777] line-through">
                    {formatPKR(product.price)}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-[#9D7B38] font-medium">
                    Save {discountPct}%
                  </span>
                </>
              )}
            </div>
            <p className="mt-2 text-xs text-[#777777]">
              {isOutOfStock
                ? 'Currently Out of Stock'
                : availableStock <= 5
                  ? `Limited availability — only ${availableStock} left`
                  : `In Stock (${availableStock} available at Karachi warehouse)`}
            </p>
          </div>

          <p className="text-sm text-[#222222]/85 leading-relaxed">{product.shortDescription}</p>

          {/* Color Selector */}
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#777777] mb-2.5">
              Color: <span className="text-[#222222] font-medium">{selectedColor}</span>
            </p>
            <div className="flex flex-wrap gap-2.5">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedColor(c.name)}
                  aria-label={`Select color ${c.name}`}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 border text-xs ${
                    selectedColor === c.name
                      ? 'border-[#222222] bg-[#FAF8F3] font-medium'
                      : 'border-[#E8DCC3] hover:border-[#222222]'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/15"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-xs uppercase tracking-[0.14em] text-[#777777]">
                Size: <span className="text-[#222222] font-medium">{selectedSize}</span>
              </p>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(true)}
                className="inline-flex items-center gap-1 text-xs text-[#9D7B38] hover:underline"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Size Guide</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-[48px] px-3.5 py-2 border text-xs font-medium transition-colors ${
                    selectedSize === size
                      ? 'bg-[#222222] text-white border-[#222222]'
                      : 'bg-white text-[#222222] border-[#E8DCC3] hover:border-[#222222]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center border border-[#E8DCC3] h-11">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-full flex items-center justify-center hover:bg-[#FAF8F3]"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-sm tabular-nums font-medium">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, availableStock), q + 1))}
                  className="w-10 h-full flex items-center justify-center hover:bg-[#FAF8F3]"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => addToCart(product, selectedColor, selectedSize, quantity)}
                className="flex-1 h-11 bg-[#222222] text-white text-xs uppercase tracking-[0.16em] hover:bg-[#3A3A3A] disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-[#C8A45D]" />
                <span>{isOutOfStock ? 'Out of Stock' : 'Add to Bag'}</span>
              </button>

              <button
                type="button"
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                onClick={() => toggleWishlist(product)}
                className="w-11 h-11 border border-[#E8DCC3] flex items-center justify-center hover:border-[#222222]"
              >
                <Heart
                  className={`w-4 h-4 ${isWishlisted ? 'fill-[#C8A45D] text-[#C8A45D]' : 'text-[#222222]'}`}
                />
              </button>
            </div>

            {!isOutOfStock && (
              <button
                type="button"
                onClick={() => {
                  addToCart(product, selectedColor, selectedSize, quantity, false);
                  navigate('/checkout');
                }}
                className="w-full h-11 border border-[#C8A45D] text-[#222222] bg-[#FAF8F3] text-xs uppercase tracking-[0.16em] font-semibold hover:bg-[#E8DCC3]/60 transition-colors"
              >
                Buy Now — Express Checkout
              </button>
            )}
          </div>

          {/* Craft, Fabric, Delivery & Returns */}
          <div className="pt-4 border-t border-[#E8DCC3] space-y-4 text-sm">
            <div>
              <h2 className="text-xs uppercase tracking-[0.14em] text-[#777777] mb-1">
                Fabric &amp; Craftsmanship
              </h2>
              <p className="text-[#222222] leading-relaxed">{product.fabricDetails}</p>
              <p className="text-[#777777] mt-2 leading-relaxed">{product.description}</p>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-[#777777]">
              <Truck className="w-4 h-4 text-[#9D7B38] shrink-0 mt-0.5" />
              <span>
                Dispatched from Karachi Main Warehouse: 1–2 days in Karachi, 2–4 days to Lahore/Islamabad, 3–5 days nationwide via TCS / Leopards.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-[#777777]">
              <ShieldCheck className="w-4 h-4 text-[#9D7B38] shrink-0 mt-0.5" />
              <span>
                7-day effortless exchange on unworn garments with original tags intact.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="mt-16 pt-12 border-t border-[#E8DCC3] grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[#9D7B38]">Client Feedback</p>
          <h2 className="font-serif text-3xl text-[#222222] mt-1">
            Reviews ({productReviews.length})
          </h2>

          <form onSubmit={handleReviewSubmit} className="mt-6 bg-white border border-[#E8DCC3] p-6 space-y-4">
            <h3 className="font-serif text-xl text-[#222222]">Share Your Impression</h3>
            {!firebaseUser?.emailVerified && (
              <p className="text-xs text-[#777777]">
                Please{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-[#9D7B38] underline"
                >
                  sign in
                </button>{' '}
                with a verified email to post a review. Verified purchasers receive an authentic badge.
              </p>
            )}
            <div>
              <label className="block text-xs uppercase tracking-[0.12em] text-[#777777] mb-1">
                Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`Rate ${n} stars`}
                    onClick={() => setRevRating(n)}
                    className="p-1"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        n <= revRating ? 'fill-[#C8A45D] text-[#C8A45D]' : 'text-[#E8DCC3]'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="rev-title" className="block text-xs uppercase tracking-[0.12em] text-[#777777] mb-1">
                Review Title
              </label>
              <input
                id="rev-title"
                required
                value={revTitle}
                onChange={(e) => setRevTitle(e.target.value)}
                placeholder="e.g. Exquisite zardozi finish"
                className="w-full border border-[#E8DCC3] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="rev-comment" className="block text-xs uppercase tracking-[0.12em] text-[#777777] mb-1">
                Your Review
              </label>
              <textarea
                id="rev-comment"
                required
                rows={3}
                value={revComment}
                onChange={(e) => setRevComment(e.target.value)}
                placeholder="Tell us about fabric drape, embroidery, and sizing..."
                className="w-full border border-[#E8DCC3] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="rev-photo" className="block text-xs uppercase tracking-[0.12em] text-[#777777] mb-1">
                Photo URL (optional)
              </label>
              <input
                id="rev-photo"
                type="url"
                value={revPhoto}
                onChange={(e) => setRevPhoto(e.target.value)}
                placeholder="https://..."
                className="w-full border border-[#E8DCC3] px-3 py-2 text-sm"
              />
            </div>
            {revFeedback && <p className="text-xs text-[#9D7B38]">{revFeedback}</p>}
            <button
              type="submit"
              disabled={revSubmitting || !firebaseUser?.emailVerified}
              className="px-6 py-2.5 bg-[#222222] text-white text-xs uppercase tracking-[0.15em] disabled:opacity-50"
            >
              {revSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-4">
          {productReviews.length === 0 ? (
            <div className="bg-white border border-[#E8DCC3] p-8 text-center text-sm text-[#777777]">
              No approved reviews yet for this piece. Be the first to share your experience.
            </div>
          ) : (
            productReviews.map((r) => (
              <div key={r.id} className="bg-white border border-[#E8DCC3] p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[#C8A45D]">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#C8A45D]" />
                    ))}
                  </div>
                  {r.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-xs text-[#9D7B38]">
                      <Check className="w-3.5 h-3.5" /> Verified Purchase
                    </span>
                  )}
                </div>
                <h4 className="font-serif text-lg text-[#222222] mt-2">{r.title}</h4>
                <p className="text-sm text-[#777777] mt-1 leading-relaxed">{r.comment}</p>
                {r.adminReply && (
                  <div className="mt-3 p-3 bg-[#FAF8F3] border border-[#E8DCC3] text-xs text-[#222222]">
                    <span className="font-semibold text-[#9D7B38]">Deboo.pk Concierge: </span>
                    {r.adminReply}
                  </div>
                )}
                <p className="text-xs text-[#777777] mt-3">
                  {r.authorName} · {r.createdAt.slice(0, 10)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Related & Recently Viewed */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 pt-12 border-t border-[#E8DCC3]">
          <h2 className="font-serif text-3xl text-[#222222] mb-6">Complementary Silhouettes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {recentlyViewed.length > 0 && (
        <section className="mt-14 pt-10 border-t border-[#E8DCC3]">
          <h2 className="font-serif text-2xl text-[#222222] mb-6">Recently Viewed</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentlyViewed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Size Guide Modal */}
      <AnimatePresence>
        {sizeGuideOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSizeGuideOpen(false)}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-[#E8DCC3] max-w-lg w-full p-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E8DCC3]">
                <h3 className="font-serif text-2xl text-[#222222]">Deboo.pk Size Chart (Inches)</h3>
                <button type="button" aria-label="Close size guide" onClick={() => setSizeGuideOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <table className="w-full text-sm mt-4 tabular-nums">
                <thead>
                  <tr className="border-b border-[#E8DCC3] text-left text-xs uppercase text-[#777777]">
                    <th className="py-2">Size</th>
                    <th className="py-2">Chest</th>
                    <th className="py-2">Waist</th>
                    <th className="py-2">Hip</th>
                    <th className="py-2">Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DCC3]/60">
                  {[
                    ['XS', '17.5"', '16.5"', '19.5"', '41"'],
                    ['S', '18.5"', '17.5"', '20.5"', '42"'],
                    ['M', '20"', '19"', '22"', '43"'],
                    ['L', '21.5"', '20.5"', '23.5"', '44"'],
                    ['XL', '23"', '22"', '25"', '45"'],
                  ].map((row) => (
                    <tr key={row[0]}>
                      <td className="py-2 font-medium">{row[0]}</td>
                      <td className="py-2">{row[1]}</td>
                      <td className="py-2">{row[2]}</td>
                      <td className="py-2">{row[3]}</td>
                      <td className="py-2">{row[4]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};
