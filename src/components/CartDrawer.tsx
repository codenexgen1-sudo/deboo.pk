import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../utils/commerce';
import { SafeImage } from './SafeImage';

export const CartDrawer: React.FC = () => {
  const { pathname, navigate } = useRouter();
  const { cart, cartOpen, setCartOpen, updateCartQty, removeFromCart, settings } = useStore();

  useEffect(() => {
    if (pathname === '/checkout' && cartOpen) {
      setCartOpen(false);
    }
  }, [pathname, cartOpen, setCartOpen]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const remainingForFree = Math.max(0, settings.freeShippingThreshold - subtotal);
  const progressPct = Math.min(100, Math.round((subtotal / settings.freeShippingThreshold) * 100));

  return (
    <AnimatePresence>
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40"
            onClick={() => setCartOpen(false)}
          />
          <motion.aside
            aria-label="Shopping Bag"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md bg-white h-full flex flex-col justify-between border-l border-[#E8DCC3]"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#E8DCC3]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-5 h-5 text-[#9D7B38]" strokeWidth={1.6} />
                  <h2 className="font-serif text-2xl text-[#222222]">Your Shopping Bag</h2>
                </div>
                <button
                  type="button"
                  aria-label="Close shopping bag"
                  onClick={() => setCartOpen(false)}
                  className="p-2 text-[#777777] hover:text-[#222222]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4">
                <p className="text-xs text-[#777777]">
                  {remainingForFree === 0
                    ? 'You have unlocked complimentary tracked shipping across Pakistan.'
                    : `Add ${formatPKR(remainingForFree)} more for complimentary nationwide shipping.`}
                </p>
                <div className="mt-2 h-1 w-full bg-[#FAF8F3] overflow-hidden">
                  <motion.div
                    className="h-full bg-[#C8A45D]"
                    initial={false}
                    animate={{ scaleX: progressPct / 100 }}
                    style={{ transformOrigin: 'left' }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <ShoppingBag className="w-10 h-10 text-[#C8A45D] mb-3" strokeWidth={1.25} />
                  <p className="font-serif text-xl text-[#222222]">Your bag is currently empty</p>
                  <p className="text-sm text-[#777777] mt-1 mb-6 max-w-xs">
                    Explore our signature unstitched fabrics, tailored stitched suits, and festive formals.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCartOpen(false);
                      navigate('/shop');
                    }}
                    className="px-6 py-2.5 bg-[#222222] text-white text-xs uppercase tracking-[0.16em] hover:bg-[#3A3A3A]"
                  >
                    Explore Collection
                  </button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {cart.map((item) => (
                    <motion.div
                      key={`${item.productId}-${item.color}-${item.size}`}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="flex gap-4 pb-5 border-b border-[#E8DCC3]/60"
                    >
                      <div className="w-20 h-26 bg-[#F3EFE6] shrink-0 overflow-hidden">
                        <SafeImage
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <a
                              href={`/product/${item.slug}`}
                              onClick={(e) => {
                                e.preventDefault();
                                setCartOpen(false);
                                navigate(`/product/${item.slug}`);
                              }}
                              className="font-serif text-base font-medium text-[#222222] hover:text-[#9D7B38] line-clamp-1"
                            >
                              {item.name}
                            </a>
                            <button
                              type="button"
                              aria-label={`Remove ${item.name}`}
                              onClick={() => removeFromCart(item.productId, item.color, item.size)}
                              className="text-[#777777] hover:text-[#222222] p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-[#777777] mt-0.5">
                            {item.color} · Size {item.size}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="inline-flex items-center border border-[#E8DCC3]">
                            <button
                              type="button"
                              aria-label={`Decrease quantity of ${item.name}`}
                              onClick={() =>
                                updateCartQty(item.productId, item.color, item.size, item.quantity - 1)
                              }
                              className="w-7 h-7 flex items-center justify-center text-[#222222] hover:bg-[#FAF8F3]"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-xs tabular-nums font-medium">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase quantity of ${item.name}`}
                              onClick={() =>
                                updateCartQty(item.productId, item.color, item.size, item.quantity + 1)
                              }
                              className="w-7 h-7 flex items-center justify-center text-[#222222] hover:bg-[#FAF8F3]"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-sm font-medium text-[#222222] tabular-nums">
                            {formatPKR(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 bg-[#FAF8F3] border-t border-[#E8DCC3]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#777777]">Subtotal</span>
                  <span className="text-lg font-semibold text-[#222222] tabular-nums">
                    {formatPKR(subtotal)}
                  </span>
                </div>
                <p className="text-xs text-[#777777] mb-5">
                  Shipping and coupon codes calculated at checkout. Dispatched from Karachi.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCartOpen(false);
                      navigate('/cart');
                    }}
                    className="py-3 border border-[#222222] text-[#222222] text-xs uppercase tracking-[0.15em] hover:bg-white transition-colors"
                  >
                    View Bag
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCartOpen(false);
                      navigate('/checkout');
                    }}
                    className="py-3 bg-[#222222] text-white text-xs uppercase tracking-[0.15em] hover:bg-[#3A3A3A] transition-colors"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
