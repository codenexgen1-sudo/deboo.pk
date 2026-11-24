import React from 'react';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { useSeoMetadata } from '../hooks/useSeoMetadata';
import { formatPKR } from '../utils/commerce';

export const CartPage: React.FC = () => {
  const { navigate } = useRouter();
  const { cart, updateCartQty, removeFromCart, settings } = useStore();

  useSeoMetadata({
    title: 'Shopping Bag | Deboo.pk',
    description: 'Review your selected luxury fashion pieces before tracked Pakistan checkout.',
    noIndex: true,
  });

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const remaining = Math.max(0, settings.freeShippingThreshold - subtotal);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-serif text-4xl text-[#222222] mb-2">Shopping Bag</h1>
      <p className="text-sm text-[#777777] mb-8">
        {remaining === 0
          ? 'Your order qualifies for complimentary tracked shipping across Pakistan.'
          : `Add ${formatPKR(remaining)} more to enjoy complimentary tracked nationwide shipping.`}
      </p>

      {cart.length === 0 ? (
        <div className="bg-white border border-[#E8DCC3] p-12 text-center">
          <ShoppingBag className="w-10 h-10 text-[#C8A45D] mx-auto mb-3" strokeWidth={1.3} />
          <h2 className="font-serif text-2xl text-[#222222]">Your bag is empty</h2>
          <p className="text-sm text-[#777777] mt-1 mb-6">
            Explore our Karachi atelier&apos;s unstitched lawn, stitched silk, and festive formals.
          </p>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="px-7 py-3 bg-[#222222] text-white text-xs uppercase tracking-[0.16em]"
          >
            Explore Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white border border-[#E8DCC3] divide-y divide-[#E8DCC3]">
            {cart.map((item) => (
              <div
                key={`${item.productId}-${item.color}-${item.size}`}
                className="p-5 flex gap-5 items-center"
              >
                <div className="w-24 h-32 bg-[#F3EFE6] shrink-0 overflow-hidden">
                  <SafeImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={`/product/${item.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/product/${item.slug}`);
                    }}
                    className="font-serif text-xl text-[#222222] hover:text-[#9D7B38]"
                  >
                    {item.name}
                  </a>
                  <p className="text-xs text-[#777777] mt-1">
                    Color: {item.color} · Size: {item.size} · SKU: {item.sku}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="inline-flex items-center border border-[#E8DCC3]">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => updateCartQty(item.productId, item.color, item.size, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-[#FAF8F3]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => updateCartQty(item.productId, item.color, item.size, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-[#FAF8F3]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-[#222222] tabular-nums">
                        {formatPKR(item.price * item.quantity)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeFromCart(item.productId, item.color, item.size)}
                        className="text-[#777777] hover:text-[#222222]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="lg:col-span-4 bg-white border border-[#E8DCC3] p-6 h-fit space-y-5">
            <h2 className="font-serif text-2xl text-[#222222] pb-3 border-b border-[#E8DCC3]">
              Order Summary
            </h2>
            <div className="flex justify-between text-sm">
              <span className="text-[#777777]">Subtotal</span>
              <span className="font-medium tabular-nums">{formatPKR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#777777]">Shipping</span>
              <span className="text-[#777777]">
                {remaining === 0 ? 'Complimentary' : 'Calculated at checkout'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 bg-[#222222] text-white text-xs uppercase tracking-[0.16em] hover:bg-[#3A3A3A]"
            >
              Proceed to Checkout
            </button>
          </aside>
        </div>
      )}
    </main>
  );
};
