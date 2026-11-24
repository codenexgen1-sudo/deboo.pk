import React, { useState } from 'react';
import { Heart, Share2, ShoppingBag, Trash2 } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { ProductGridSkeleton } from '../components/SkeletonLoader';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { useSeoMetadata } from '../hooks/useSeoMetadata';
import { formatPKR, getEffectivePrice } from '../utils/commerce';

export const WishlistPage: React.FC = () => {
  const { navigate } = useRouter();
  const { products, wishlistIds, toggleWishlist, addToCart, catalogLoading } = useStore();
  const [copied, setCopied] = useState(false);

  useSeoMetadata({
    title: `Saved Wishlist (${wishlistIds.length}) | Deboo.pk`,
    description: 'Your curated Deboo.pk fashion wishlist saved for effortless shopping.',
    noIndex: true,
  });

  const savedProducts = products.filter((p) => wishlistIds.includes(p.id));

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore clipboard restriction
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8DCC3] pb-6 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9D7B38]">Curated Saves</p>
          <h1 className="font-serif text-4xl text-[#222222] mt-1">
            My Wishlist ({savedProducts.length})
          </h1>
        </div>
        {savedProducts.length > 0 && (
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#E8DCC3] bg-white text-xs uppercase tracking-[0.14em] hover:border-[#222222]"
          >
            <Share2 className="w-3.5 h-3.5 text-[#9D7B38]" />
            <span>{copied ? 'Link Copied' : 'Share Wishlist'}</span>
          </button>
        )}
      </div>

      {catalogLoading ? (
        <ProductGridSkeleton count={3} columns={3} label="Loading saved wishlist" />
      ) : savedProducts.length === 0 ? (
        <div className="bg-white border border-[#E8DCC3] p-12 text-center">
          <Heart className="w-10 h-10 text-[#C8A45D] mx-auto mb-3" strokeWidth={1.3} />
          <h2 className="font-serif text-2xl text-[#222222]">No saved pieces yet</h2>
          <p className="text-sm text-[#777777] mt-1 mb-6">
            Save your favourite unstitched sets, stitched suits, and festive formals for later.
          </p>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="px-7 py-3 bg-[#222222] text-white text-xs uppercase tracking-[0.16em]"
          >
            Browse Storefront
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedProducts.map((product) => (
            <div key={product.id} className="bg-white border border-[#E8DCC3] flex flex-col">
              <div className="aspect-[3/4] bg-[#F3EFE6] overflow-hidden relative">
                <a
                  href={`/product/${product.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/product/${product.slug}`);
                  }}
                >
                  <SafeImage
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </a>
                <button
                  type="button"
                  aria-label={`Remove ${product.name} from wishlist`}
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-3 right-3 w-9 h-9 bg-white flex items-center justify-center text-[#777777] hover:text-[#222222]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#777777]">
                    {product.categoryName}
                  </p>
                  <h2 className="font-serif text-xl text-[#222222] mt-1">{product.name}</h2>
                  <p className="text-sm font-semibold text-[#222222] mt-2 tabular-nums">
                    {formatPKR(getEffectivePrice(product))}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    addToCart(product, product.colors[0]?.name || 'Ivory', product.sizes[0] || 'M', 1)
                  }
                  className="w-full py-2.5 bg-[#222222] text-white text-xs uppercase tracking-[0.15em] inline-flex items-center justify-center gap-2 hover:bg-[#3A3A3A]"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-[#C8A45D]" />
                  <span>Move to Bag</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};
