import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Lock,
  MapPin,
  PackageCheck,
  Tag,
  Truck,
} from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { useSeoMetadata } from '../hooks/useSeoMetadata';
import type { Coupon, Order, PaymentMethod } from '../types/ecommerce';
import {
  calculateOrderTotals,
  formatPKR,
  PAKISTAN_CITIES,
} from '../utils/commerce';

export const CheckoutPage: React.FC = () => {
  const { navigate } = useRouter();
  const { firebaseUser, profile } = useAuth();
  const {
    cart,
    addresses,
    settings,
    validateCouponCode,
    placeOrder,
    trackEvent,
  } = useStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customerName, setCustomerName] = useState(profile?.fullName || '');
  const [customerEmail, setCustomerEmail] = useState(profile?.email || '');
  const [customerPhone, setCustomerPhone] = useState(profile?.phone || '');
  const [city, setCity] = useState('Karachi');
  const [area, setArea] = useState('');
  const [completeAddress, setCompleteAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'Standard Tracked' | 'Express Air'>('Standard Tracked');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    settings.codEnabled ? 'Cash on Delivery' : 'Easypaisa'
  );
  const [orderNotes, setOrderNotes] = useState('');

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponMessage, setCouponMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useSeoMetadata({
    title: 'Secure Checkout | Deboo.pk',
    description:
      'Complete your Deboo.pk order with Cash on Delivery, Easypaisa, JazzCash, or Direct Bank Transfer.',
    noIndex: true,
  });

  useEffect(() => {
    trackEvent({ eventType: 'checkout_start' });
  }, [trackEvent]);

  useEffect(() => {
    if (profile) {
      if (!customerName) setCustomerName(profile.fullName);
      if (!customerEmail) setCustomerEmail(profile.email);
      if (!customerPhone && profile.phone) setCustomerPhone(profile.phone);
    }
  }, [profile, customerName, customerEmail, customerPhone]);

  useEffect(() => {
    const def = addresses.find((a) => a.isDefault) || addresses[0];
    if (def && !completeAddress) {
      setCustomerName(def.fullName);
      setCustomerPhone(def.phone);
      setCity(def.city);
      setArea(def.area);
      setCompleteAddress(def.completeAddress);
      setPostalCode(def.postalCode || '');
    }
  }, [addresses, completeAddress]);

  const totals = useMemo(
    () =>
      calculateOrderTotals({
        items: cart,
        city,
        shippingMethod,
        settings,
        coupon: appliedCoupon,
      }),
    [cart, city, shippingMethod, settings, appliedCoupon]
  );

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponMessage('');
    const found = await validateCouponCode(couponInput);
    if (!found) {
      setAppliedCoupon(null);
      setCouponMessage('Coupon code not recognized.');
      return;
    }
    setAppliedCoupon(found);
    setCouponMessage(`Coupon ${found.code} applied.`);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      setErrorMsg('Please complete your name, email, and WhatsApp/phone number.');
      return;
    }
    if (!city.trim() || !area.trim() || !completeAddress.trim()) {
      setErrorMsg('Please enter your complete delivery address in Pakistan.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await placeOrder({
        customerName,
        customerEmail,
        customerPhone,
        city,
        area,
        completeAddress,
        postalCode,
        shippingMethod,
        paymentMethod,
        couponCode: appliedCoupon && !totals.couponError ? appliedCoupon.code : '',
        discountAmount: totals.discountAmount,
        shippingCost: totals.shippingCost,
        taxAmount: totals.taxAmount,
        subtotal: totals.subtotal,
        totalAmount: totals.totalAmount,
        orderNotes,
      });
      setConfirmedOrder(order);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white border border-[#E8DCC3] p-8 sm:p-10 space-y-6">
          <div className="flex items-center gap-3 text-[#9D7B38]">
            <CheckCircle2 className="w-8 h-8" strokeWidth={1.5} />
            <div>
              <p className="text-xs uppercase tracking-[0.2em]">Order Confirmed</p>
              <h1 className="font-serif text-3xl text-[#222222]">
                Thank you, {confirmedOrder.customerName}
              </h1>
            </div>
          </div>

          <p className="text-sm text-[#777777] leading-relaxed">
            Your order <span className="font-mono font-semibold text-[#222222]">{confirmedOrder.orderNumber}</span> has been received and queued for quality inspection at our Karachi Main Warehouse.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#FAF8F3] border border-[#E8DCC3] p-4 text-sm">
            <div>
              <p className="text-xs text-[#777777]">Order Number</p>
              <p className="font-mono font-semibold text-[#222222] mt-0.5">{confirmedOrder.orderNumber}</p>
            </div>
            <div>
              <p className="text-xs text-[#777777]">Payment Method</p>
              <p className="font-medium text-[#222222] mt-0.5">{confirmedOrder.paymentMethod}</p>
            </div>
            <div>
              <p className="text-xs text-[#777777]">Total Payable</p>
              <p className="font-semibold text-[#222222] tabular-nums mt-0.5">
                {formatPKR(confirmedOrder.totalAmount)}
              </p>
            </div>
          </div>

          <div className="border-t border-[#E8DCC3] pt-4 space-y-2 text-sm">
            <p className="font-medium text-[#222222]">Delivery Destination</p>
            <p className="text-[#777777]">
              {confirmedOrder.completeAddress}, {confirmedOrder.area}, {confirmedOrder.city} ·{' '}
              {confirmedOrder.customerPhone}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(`/track-order?order=${encodeURIComponent(confirmedOrder.orderNumber)}`)}
              className="px-6 py-3 bg-[#222222] text-white text-xs uppercase tracking-[0.16em]"
            >
              Track Shipment
            </button>
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="px-6 py-3 border border-[#E8DCC3] text-[#222222] text-xs uppercase tracking-[0.16em]"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-serif text-3xl text-[#222222]">Your bag is empty</h1>
        <p className="text-sm text-[#777777] mt-2 mb-6">Add pieces to your bag before proceeding to checkout.</p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="px-7 py-3 bg-[#222222] text-white text-xs uppercase tracking-[0.16em]"
        >
          Shop Collection
        </button>
      </main>
    );
  }

  const isGuestBlocked = !firebaseUser?.emailVerified && !settings.guestCheckoutEnabled;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="border-b border-[#E8DCC3] pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9D7B38]">Karachi Dispatch · Nationwide Pakistan</p>
          <h1 className="font-serif text-4xl text-[#222222] mt-1">Checkout</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#777777]">
          <Lock className="w-3.5 h-3.5 text-[#9D7B38]" />
          <span>Encrypted &amp; Verified Order Processing</span>
        </div>
      </div>

      {isGuestBlocked ? (
        <div className="bg-white border border-[#E8DCC3] p-8 max-w-xl mx-auto text-center">
          <h2 className="font-serif text-2xl text-[#222222]">Sign In Required for Checkout</h2>
          <p className="text-sm text-[#777777] mt-2 mb-6">
            Store settings currently require a verified customer account to place an order.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-7 py-3 bg-[#222222] text-white text-xs uppercase tracking-[0.16em]"
          >
            Sign In or Register
          </button>
        </div>
      ) : (
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            {/* Step Navigation Indicators */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { num: 1, label: '1. Contact & Address' },
                { num: 2, label: '2. Shipping & Payment' },
                { num: 3, label: '3. Review & Confirm' },
              ].map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setStep(s.num as 1 | 2 | 3)}
                  className={`py-2.5 px-3 border text-left transition-colors ${
                    step === s.num
                      ? 'bg-[#222222] text-white border-[#222222]'
                      : 'bg-white text-[#777777] border-[#E8DCC3]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Section 1: Customer Information & Delivery Address */}
            <section className="bg-white border border-[#E8DCC3] p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[#E8DCC3] pb-3">
                <h2 className="font-serif text-2xl text-[#222222] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#9D7B38]" strokeWidth={1.5} />
                  <span>Customer &amp; Delivery Address</span>
                </h2>
                {!firebaseUser && (
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-xs text-[#9D7B38] underline"
                  >
                    Have an account? Sign In
                  </button>
                )}
              </div>

              {addresses.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-[#777777] mb-2">
                    Saved Addresses
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {addresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => {
                          setCustomerName(addr.fullName);
                          setCustomerPhone(addr.phone);
                          setCity(addr.city);
                          setArea(addr.area);
                          setCompleteAddress(addr.completeAddress);
                          setPostalCode(addr.postalCode || '');
                        }}
                        className="p-3 text-left border border-[#E8DCC3] hover:border-[#222222] text-xs"
                      >
                        <p className="font-medium text-[#222222]">{addr.fullName}</p>
                        <p className="text-[#777777] truncate">
                          {addr.completeAddress}, {addr.city}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="chk-name" className="block text-xs uppercase tracking-[0.12em] text-[#777777] mb-1">
                    Full Name *
                  </label>
                  <input
                    id="chk-name"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ayesha Khan"
                    className="w-full border border-[#E8DCC3] px-3.5 py-2.5 text-sm bg-[#FAF8F3] focus:bg-white focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>
                <div>
                  <label htmlFor="chk-email" className="block text-xs uppercase tracking-[0.12em] text-[#777777] mb-1">
                    Email Address *
                  </label>
                  <input
                    id="chk-email"
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="ayesha@example.pk"
                    className="w-full border border-[#E8DCC3] px-3.5 py-2.5 text-sm bg-[#FAF8F3] focus:bg-white focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>
                <div>
                  <label htmlFor="chk-phone" className="block text-xs uppercase tracking-[0.12em] text-[#777777] mb-1">
                    WhatsApp / Mobile Number *
                  </label>
                  <input
                    id="chk-phone"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full border border-[#E8DCC3] px-3.5 py-2.5 text-sm bg-[#FAF8F3] focus:bg-white focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>
                <div>
                  <label htmlFor="chk-city" className="block text-xs uppercase tracking-[0.12em] text-[#777777] mb-1">
                    City (Pakistan) *
                  </label>
                  <select
                    id="chk-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-[#E8DCC3] px-3.5 py-2.5 text-sm bg-[#FAF8F3] focus:bg-white focus:outline-none focus:border-[#C8A45D]"
                  >
                    {PAKISTAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="chk-area" className="block text-xs uppercase tracking-[0.12em] text-[#777777] mb-1">
                    Area / Phase / Sector *
                  </label>
                  <input
                    id="chk-area"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="DHA Phase 6 / Gulberg / F-7"
                    className="w-full border border-[#E8DCC3] px-3.5 py-2.5 text-sm bg-[#FAF8F3] focus:bg-white focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>
                <div>
                  <label htmlFor="chk-postal" className="block text-xs uppercase tracking-[0.12em] text-[#777777] mb-1">
                    Postal Code
                  </label>
                  <input
                    id="chk-postal"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="75500"
                    className="w-full border border-[#E8DCC3] px-3.5 py-2.5 text-sm bg-[#FAF8F3] focus:bg-white focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="chk-address" className="block text-xs uppercase tracking-[0.12em] text-[#777777] mb-1">
                  Complete Street Address *
                </label>
                <input
                  id="chk-address"
                  required
                  value={completeAddress}
                  onChange={(e) => setCompleteAddress(e.target.value)}
                  placeholder="House / Apartment No., Street, Landmark"
                  className="w-full border border-[#E8DCC3] px-3.5 py-2.5 text-sm bg-[#FAF8F3] focus:bg-white focus:outline-none focus:border-[#C8A45D]"
                />
              </div>

              {step === 1 && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-2.5 bg-[#222222] text-white text-xs uppercase tracking-[0.15em]"
                  >
                    Continue to Shipping &amp; Payment
                  </button>
                </div>
              )}
            </section>

            {/* Section 2: Shipping & Payment Method */}
            <section className="bg-white border border-[#E8DCC3] p-6 space-y-6">
              <div className="border-b border-[#E8DCC3] pb-3">
                <h2 className="font-serif text-2xl text-[#222222] flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#9D7B38]" strokeWidth={1.5} />
                  <span>Shipping Method</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['Standard Tracked', 'Express Air'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      setShippingMethod(method);
                      setStep(3);
                    }}
                    className={`p-4 border text-left transition-colors ${
                      shippingMethod === method
                        ? 'border-[#222222] bg-[#FAF8F3]'
                        : 'border-[#E8DCC3] hover:border-[#222222]'
                    }`}
                  >
                    <p className="font-medium text-sm text-[#222222]">{method}</p>
                    <p className="text-xs text-[#777777] mt-1">
                      {method === 'Standard Tracked'
                        ? `Dispatched from Karachi (${totals.courierLabel})`
                        : 'Priority Air Dispatch (+PKR 250)'}
                    </p>
                  </button>
                ))}
              </div>

              <div className="border-b border-[#E8DCC3] pb-3 pt-2">
                <h2 className="font-serif text-2xl text-[#222222] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#9D7B38]" strokeWidth={1.5} />
                  <span>Payment Method</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    { id: 'Cash on Delivery', desc: 'Pay in cash upon parcel arrival', enabled: settings.codEnabled },
                    { id: 'Easypaisa', desc: 'Instant mobile wallet confirmation', enabled: true },
                    { id: 'JazzCash', desc: 'Fast mobile account checkout', enabled: true },
                    { id: 'Bank Transfer', desc: 'Meezan / HBL IBFT transfer', enabled: true },
                    { id: 'Online Card', desc: 'Visa / Mastercard gateway ready', enabled: true },
                  ] as { id: PaymentMethod; desc: string; enabled: boolean }[]
                )
                  .filter((p) => p.enabled)
                  .map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(method.id);
                        setStep(3);
                      }}
                      className={`p-4 border text-left transition-colors ${
                        paymentMethod === method.id
                          ? 'border-[#222222] bg-[#FAF8F3]'
                          : 'border-[#E8DCC3] hover:border-[#222222]'
                      }`}
                    >
                      <p className="font-medium text-sm text-[#222222]">{method.id}</p>
                      <p className="text-xs text-[#777777] mt-1">{method.desc}</p>
                    </button>
                  ))}
              </div>

              <div>
                <label htmlFor="chk-notes" className="block text-xs uppercase tracking-[0.12em] text-[#777777] mb-1">
                  Order / Tailoring Notes (Optional)
                </label>
                <textarea
                  id="chk-notes"
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Delivery timing preference, gift wrapping note..."
                  className="w-full border border-[#E8DCC3] px-3.5 py-2 text-sm bg-[#FAF8F3]"
                />
              </div>
            </section>
          </div>

          {/* Right: Order Summary & Coupon */}
          <aside className="lg:col-span-5">
            <div className="bg-white border border-[#E8DCC3] p-6 space-y-5 lg:sticky lg:top-24">
              <h2 className="font-serif text-2xl text-[#222222] pb-3 border-b border-[#E8DCC3] flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-[#9D7B38]" strokeWidth={1.5} />
                <span>Order Review ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
              </h2>

              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={`${item.productId}-${item.color}-${item.size}`}
                    className="flex gap-3 items-center"
                  >
                    <div className="w-14 h-18 bg-[#F3EFE6] shrink-0 overflow-hidden">
                      <SafeImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#222222] truncate">{item.name}</p>
                      <p className="text-xs text-[#777777]">
                        {item.color} · {item.size} × {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-[#222222] tabular-nums">
                      {formatPKR(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon Form */}
              <div className="pt-3 border-t border-[#E8DCC3]">
                <label htmlFor="chk-coupon" className="block text-xs uppercase tracking-[0.12em] text-[#777777] mb-1.5">
                  Promotional Code (Try DEBOO10)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-[#777777] absolute left-3 top-3" />
                    <input
                      id="chk-coupon"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="DEBOO10"
                      className="w-full border border-[#E8DCC3] pl-8 pr-3 py-2 text-xs uppercase font-mono bg-[#FAF8F3]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 border border-[#222222] text-xs uppercase tracking-[0.12em] hover:bg-[#222222] hover:text-white transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {(couponMessage || totals.couponError) && (
                  <p className={`text-xs mt-1.5 ${totals.couponError ? 'text-red-700' : 'text-[#9D7B38]'}`}>
                    {totals.couponError || couponMessage}
                  </p>
                )}
              </div>

              {/* Totals Breakdown */}
              <div className="pt-4 border-t border-[#E8DCC3] space-y-2.5 text-sm tabular-nums">
                <div className="flex justify-between">
                  <span className="text-[#777777]">Subtotal</span>
                  <span>{formatPKR(totals.subtotal)}</span>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-[#9D7B38]">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span>-{formatPKR(totals.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#777777]">
                    Courier ({city} · {totals.estimateDays})
                  </span>
                  <span>
                    {totals.shippingCost === 0 ? 'Complimentary' : formatPKR(totals.shippingCost)}
                  </span>
                </div>
                {totals.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Tax ({settings.taxRatePercent}%)</span>
                    <span>{formatPKR(totals.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-[#E8DCC3] text-base font-semibold text-[#222222]">
                  <span>Total Payable</span>
                  <span>{formatPKR(totals.totalAmount)}</span>
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 p-3">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#222222] text-white text-xs uppercase tracking-[0.18em] font-semibold hover:bg-[#3A3A3A] disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Confirming Order...' : `Place Order · ${formatPKR(totals.totalAmount)}`}
              </button>
            </div>
          </aside>
        </form>
      )}
    </main>
  );
};
