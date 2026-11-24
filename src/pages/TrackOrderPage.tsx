import React, { useEffect, useState } from 'react';
import { CheckCircle2, Package, Search, Truck } from 'lucide-react';
import { PageContentSkeleton } from '../components/SkeletonLoader';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { useSeoMetadata } from '../hooks/useSeoMetadata';
import type { OrderStatus, OrderTrackingRecord } from '../types/ecommerce';

const TIMELINE_STEPS: OrderStatus[] = [
  'Order Placed',
  'Confirmed',
  'Processing',
  'Packed',
  'Dispatched',
  'Out for Delivery',
  'Delivered',
];

export const TrackOrderPage: React.FC = () => {
  const { searchParams } = useRouter();
  const { lookupOrderTracking } = useStore();

  const [orderInput, setOrderInput] = useState(searchParams.get('order') || 'DEB-10042');
  const [tracking, setTracking] = useState<OrderTrackingRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useSeoMetadata({
    title: tracking ? `Order ${tracking.orderNumber} (${tracking.orderStatus}) | Deboo.pk` : 'Track Order | Deboo.pk',
    description: 'Track your Deboo.pk shipment dispatched from our Karachi warehouse across Pakistan.',
  });

  const performLookup = async (code: string) => {
    setLoading(true);
    setNotFound(false);
    const res = await lookupOrderTracking(code);
    setTracking(res);
    if (!res) setNotFound(true);
    setLoading(false);
  };

  useEffect(() => {
    const initial = searchParams.get('order');
    if (initial) {
      setOrderInput(initial);
      performLookup(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderInput.trim()) return;
    performLookup(orderInput);
  };

  const activeIdx = tracking ? TIMELINE_STEPS.indexOf(tracking.orderStatus) : -1;
  const isException =
    tracking && ['Cancelled', 'Returned', 'Refunded'].includes(tracking.orderStatus);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
      <div className="text-center max-w-xl mx-auto mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9D7B38]">
          Karachi Warehouse · Pakistan Courier Network
        </p>
        <h1 className="font-serif text-4xl text-[#222222] mt-1">Track Your Shipment</h1>
        <p className="text-sm text-[#777777] mt-2">
          Enter your Deboo.pk order number (e.g. <span className="font-mono">DEB-10042</span>) to view live dispatch milestones.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto flex gap-2 mb-10">
        <label htmlFor="track-order-input" className="sr-only">
          Order Number
        </label>
        <input
          id="track-order-input"
          value={orderInput}
          onChange={(e) => setOrderInput(e.target.value.toUpperCase())}
          placeholder="DEB-10042"
          className="flex-1 bg-white border border-[#E8DCC3] px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:border-[#C8A45D]"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-[#222222] text-white text-xs uppercase tracking-[0.16em] inline-flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          <span>{loading ? 'Checking...' : 'Track'}</span>
        </button>
      </form>

      {loading ? (
        <PageContentSkeleton variant="tracking" label="Checking shipment milestones" />
      ) : (
        <>
          {notFound && (
            <div className="bg-white border border-[#E8DCC3] p-8 text-center">
              <Package className="w-8 h-8 text-[#C8A45D] mx-auto mb-2" />
              <p className="font-serif text-xl text-[#222222]">Order Not Found</p>
              <p className="text-sm text-[#777777] mt-1">
                Please verify your order number from your confirmation receipt.
              </p>
            </div>
          )}

          {tracking && (
        <div className="bg-white border border-[#E8DCC3] p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-[#E8DCC3] text-sm">
            <div>
              <p className="text-xs text-[#777777]">Order Number</p>
              <p className="font-mono font-semibold text-[#222222] mt-0.5">{tracking.orderNumber}</p>
            </div>
            <div>
              <p className="text-xs text-[#777777]">Current Status</p>
              <p className="font-semibold text-[#9D7B38] mt-0.5">{tracking.orderStatus}</p>
            </div>
            <div>
              <p className="text-xs text-[#777777]">Destination</p>
              <p className="font-medium text-[#222222] mt-0.5">{tracking.destinationCity}, Pakistan</p>
            </div>
            <div>
              <p className="text-xs text-[#777777]">Courier &amp; AWB</p>
              <p className="font-mono text-xs text-[#222222] mt-0.5">
                {tracking.courierName || 'TCS Express'} {tracking.trackingNumber ? `· ${tracking.trackingNumber}` : ''}
              </p>
            </div>
          </div>

          {/* Visual 7-Step Tracking Timeline */}
          {!isException ? (
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
              {TIMELINE_STEPS.map((stepName, idx) => {
                const completed = activeIdx >= idx;
                return (
                  <div
                    key={stepName}
                    className={`p-3 border text-center flex sm:flex-col items-center sm:justify-center gap-2 ${
                      completed
                        ? 'border-[#C8A45D] bg-[#FAF8F3]'
                        : 'border-[#E8DCC3]/60 opacity-50'
                    }`}
                  >
                    {completed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#9D7B38] shrink-0" />
                    ) : (
                      <Truck className="w-4 h-4 text-[#777777] shrink-0" />
                    )}
                    <span className="text-[11px] font-medium text-[#222222] leading-tight">
                      {stepName}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 bg-[#FAF8F3] border border-[#C8A45D] text-sm text-[#222222]">
              Shipment status: <strong>{tracking.orderStatus}</strong>
            </div>
          )}

          {/* Chronological Milestones */}
          {tracking.statusHistory.length > 0 && (
            <div className="space-y-3 pt-2">
              <h2 className="font-serif text-xl text-[#222222]">Dispatch Log</h2>
              <div className="divide-y divide-[#E8DCC3]/60 text-sm">
                {tracking.statusHistory.map((h, idx) => (
                  <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:justify-between gap-1">
                    <div>
                      <span className="font-medium text-[#222222]">{h.status}</span>
                      <span className="text-[#777777]"> — {h.note}</span>
                    </div>
                    <span className="text-xs font-mono text-[#777777]">
                      {h.timestamp.slice(0, 16).replace('T', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
          )}
        </>
      )}
    </main>
  );
};
