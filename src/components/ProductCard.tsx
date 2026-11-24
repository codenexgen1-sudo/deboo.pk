import React from 'react';
import { motion } from 'motion/react';
import { Heart, ShoppingBag } from 'lucide-react';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import type { Product } from '../types/ecommerce';
import { formatPKR, getDiscountPercentage, getEffectivePrice } from '../utils/commerce';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { navigate } = useRouter();
  const { addToCart, toggleWishlist, wishlistIds } = useStore();

  const isWishlisted = wishlistIds.includes(product.id);
  const effectivePrice = getEffectivePrice(product);
  const discountPct = getDiscountPercentage(product.price, product.onSale ? product.salePrice : undefined);
  const isOutOfStock = product.stockQuantity <= 0 || product.status === 'Out of Stock';

  const defaultColor = product.colors[0]?.name || 'Ivory';
  const defaultSize = product.sizes[0] || 'M';

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col bg-white border border-[#E8DCC3]/70 hover:shadow-sm transition-shadow duration-200"
    >
      <div className="relative aspect-[3/4] bg-[#F3EFE6] overflow-hidden">
        <a
          href={`/product/${product.slug}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/product/${product.slug}`);
          }}
          className="block w-full h-full"
        >
          <SafeImage
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        </a>

        {/* Subtle status indicator — max 1 clean text label */}
        {isOutOfStock ? (
          <span className="absolute top-3 left-3 bg-[#222222]/90 text-white text-[11px] uppercase tracking-[0.14em] px-2.5 py-1">
            Sold Out
          </span>
        ) : discountPct > 0 ? (
          <span className="absolute top-3 left-3 bg-[#222222] text-[#E8DCC3] text-[11px] uppercase tracking-[0.14em] px-2.5 py-1 tabular-nums">
            -{discountPct}%
          </span>
        ) : product.newArrival ? (
          <span className="absolute top-3 left-3 bg-white/95 text-[#222222] text-[11px] uppercase tracking-[0.14em] px-2.5 py-1">
            New
          </span>
        ) : null}

        {/* Wishlist button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          onClick={() => toggleWishlist(product)}
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-white flex items-center justify-center text-[#222222] transition-colors"
        >
          <motion.span
            animate={isWishlisted ? { scale: [1, 1.25, 1] } : { scale: 1 }}
            transition={{ duration: 0.25 }}
            className="inline-flex"
          >
            <Heart
              className={`w-4 h-4 ${isWishlisted ? 'fill-[#C8A45D] text-[#C8A45D]' : 'text-[#222222]'}`}
              strokeWidth={1.6}
            />
          </motion.span>
        </motion.button>

        {/* Quick Add */}
        {!isOutOfStock && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => addToCart(product, defaultColor, defaultSize, 1)}
            className="absolute inset-x-3 bottom-3 py-2.5 bg-[#222222]/95 text-white text-xs uppercase tracking-[0.16em] flex items-center justify-center gap-2 opacity-95 sm:opacity-0 sm:translate-y-1 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all duration-200 hover:bg-[#111111]"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#C8A45D]" />
            <span>Quick Add · {defaultSize}</span>
          </motion.button>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-[#777777]">
            <span className="truncate">{product.categoryName}</span>
            {product.collectionName && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{product.collectionName}</span>
              </>
            )}
          </div>
          <a
            href={`/product/${product.slug}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/product/${product.slug}`);
            }}
            className="mt-1 block font-serif text-lg leading-snug font-medium text-[#222222] hover:text-[#9D7B38] transition-colors line-clamp-2"
          >
            {product.name}
          </a>
        </div>

        <div className="pt-1 flex items-baseline gap-2.5 tabular-nums">
          <span className="text-sm font-semibold text-[#222222]">
            {formatPKR(effectivePrice)}
          </span>
          {discountPct > 0 && (
            <span className="text-xs text-[#777777] line-through">
              {formatPKR(product.price)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
};
