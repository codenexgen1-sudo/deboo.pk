import React, { useMemo, useState } from 'react';
import { Download, FileText, Printer, Search, Truck, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { BRAND_LOGO_URL } from '../../data/seedCatalog';
import type { Order, OrderStatus, PaymentStatus } from '../../types/ecommerce';
import { formatPKR, PAKISTAN_CITIES } from '../../utils/commerce';

const ORDER_STATUSES: OrderStatus[] = [
  'Order Placed',
  'Confirmed',
  'Processing',
  'Packed',
  'Dispatched',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Returned',
  'Refunded',
];

export const AdminOrders: React.FC = () => {
  const { can } = useAuth();
  const { adminOrders, updateOrderStatus } = useStore();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printMode, setPrintMode] = useState<'invoice' | 'packing' | null>(null);

  const [nextStatus, setNextStatus] = useState<OrderStatus>('Confirmed');
  const [nextPayStatus, setNextPayStatus] = useState<PaymentStatus>('Pending');
  const [courierInput, setCourierInput] = useState('TCS Tracked Courier');
  const [trackingInput, setTrackingInput] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [saving, setSaving] = useState(false);

  const canManageOrders = can('orders.manage');

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return adminOrders.filter((o) => {
      if (statusFilter !== 'all' && o.orderStatus !== statusFilter) return false;
      if (cityFilter !== 'all' && o.city.toLowerCase() !== cityFilter.toLowerCase()) return false;
      if (paymentFilter !== 'all' && o.paymentMethod !== paymentFilter) return false;
      if (q) {
        const hay = `${o.orderNumber} ${o.customerName} ${o.customerEmail} ${o.customerPhone} ${o.city}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [adminOrders, query, statusFilter, cityFilter, paymentFilter]);

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setNextStatus(order.orderStatus);
    setNextPayStatus(order.paymentStatus);
    setCourierInput(order.courierName || 'TCS Tracked Courier');
    setTrackingInput(order.trackingNumber || '');
    setStatusNote('');
    setPrintMode(null);
  };

  const handleStatusSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !canManageOrders) return;
    setSaving(true);
    try {
      await updateOrderStatus({
        orderId: selectedOrder.id,
        isGuestOrder: selectedOrder.userId === 'guest',
        orderStatus: nextStatus,
        paymentStatus: nextPayStatus,
        courierName: courierInput,
        trackingNumber: trackingInput,
        note: statusNote || `Order updated to ${nextStatus}`,
      });
      setSelectedOrder(null);
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const headers = [
      'Order Number',
      'Date',
      'Customer',
      'Email',
      'Phone',
      'City',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Total PKR',
      'Tracking',
    ];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      o.createdAt.slice(0, 10),
      `"${o.customerName.replace(/"/g, '""')}"`,
      o.customerEmail,
      o.customerPhone,
      o.city,
      o.paymentMethod,
      o.paymentStatus,
      o.orderStatus,
      String(o.totalAmount),
      o.trackingNumber || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deboo-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusTone = (status: OrderStatus) => {
    if (status === 'Delivered') return 'text-[#16A34A] border-[#16A34A]/30 bg-green-50';
    if (['Cancelled', 'Refunded', 'Returned'].includes(status)) {
      return 'text-[#DC2626] border-[#DC2626]/30 bg-red-50';
    }
    return 'text-[#D97706] border-[#D97706]/30 bg-amber-50';
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white border border-neutral-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order #, customer, phone..."
              className="w-full pl-9 pr-3 py-2 border border-neutral-200 text-xs"
            />
          </div>

          <select
            aria-label="Filter by order status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-neutral-200 px-3 py-2 text-xs bg-white"
          >
            <option value="all">All Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by city"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="border border-neutral-200 px-3 py-2 text-xs bg-white"
          >
            <option value="all">All Cities</option>
            {PAKISTAN_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by payment method"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="border border-neutral-200 px-3 py-2 text-xs bg-white"
          >
            <option value="all">All Payments</option>
            <option value="Cash on Delivery">Cash on Delivery</option>
            <option value="Easypaisa">Easypaisa</option>
            <option value="JazzCash">JazzCash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Online Card">Online Card</option>
          </select>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-neutral-300 text-xs font-medium text-neutral-800 hover:bg-neutral-50 whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV ({filteredOrders.length})</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-neutral-200 overflow-x-auto">
        {filteredOrders.length === 0 ? (
          <div className="p-10 text-center text-xs text-neutral-500">
            No orders match the current search or filter criteria.
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 text-left">
                <th className="py-3 px-4 font-medium">Order #</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Customer</th>
                <th className="py-3 px-4 font-medium">City</th>
                <th className="py-3 px-4 font-medium">Payment</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Total</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50">
                  <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                    {order.orderNumber}
                    {order.isDemo && (
                      <span className="ml-1.5 text-[10px] text-neutral-400">(Demo)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 tabular-nums text-neutral-500">
                    {new Date(order.createdAt).toLocaleDateString('en-PK')}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-neutral-900">{order.customerName}</p>
                    <p className="text-[11px] text-neutral-500">{order.customerPhone}</p>
                  </td>
                  <td className="py-3 px-4 text-neutral-700">{order.city}</td>
                  <td className="py-3 px-4">
                    <p className="text-neutral-800">{order.paymentMethod}</p>
                    <p className="text-[11px] text-neutral-500">{order.paymentStatus}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 border text-[11px] font-medium ${statusTone(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-neutral-900">
                    {formatPKR(order.totalAmount)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => openOrderModal(order)}
                      className="px-2.5 py-1 border border-neutral-300 text-neutral-800 hover:bg-neutral-100"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Detail / Workflow / Printable Invoice Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-neutral-200 max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4 no-print">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 font-mono">
                  {selectedOrder.orderNumber}
                </h2>
                <p className="text-xs text-neutral-500">
                  Placed {new Date(selectedOrder.createdAt).toLocaleString('en-PK')} · {selectedOrder.city}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPrintMode('invoice');
                    setTimeout(() => window.print(), 100);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 text-xs hover:bg-neutral-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrintMode('packing');
                    setTimeout(() => window.print(), 100);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 text-xs hover:bg-neutral-50"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Packing Slip</span>
                </button>
                <button
                  type="button"
                  aria-label="Close order details"
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 text-neutral-500 hover:text-neutral-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Header */}
            <div className="flex items-start justify-between border-b border-neutral-200 pb-4">
              <div>
                <img src={BRAND_LOGO_URL} alt="Deboo.pk — Everything, But Better." className="h-9 w-auto object-contain mb-2" />
                <p className="text-xs text-neutral-600">Karachi Main Warehouse · Deboo.pk</p>
                {printMode === 'packing' && (
                  <p className="text-xs font-semibold uppercase tracking-wider mt-1">
                    WAREHOUSE PACKING SLIP
                  </p>
                )}
              </div>
              <div className="text-right text-xs">
                <p className="font-semibold text-neutral-900">{selectedOrder.customerName}</p>
                <p className="text-neutral-600">{selectedOrder.customerPhone}</p>
                <p className="text-neutral-600">
                  {selectedOrder.completeAddress}, {selectedOrder.area ? `${selectedOrder.area}, ` : ''}
                  {selectedOrder.city}
                </p>
              </div>
            </div>

            {/* Line Items */}
            <table className="w-full text-xs border border-neutral-200">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-left">
                <tr>
                  <th className="py-2 px-3">Item &amp; Variant</th>
                  <th className="py-2 px-3">SKU</th>
                  <th className="py-2 px-3 text-right">Qty</th>
                  {printMode !== 'packing' && <th className="py-2 px-3 text-right">Total</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {selectedOrder.items.map((item, idx) => (
                  <tr key={`${item.sku}_${idx}`}>
                    <td className="py-2 px-3">
                      <p className="font-medium text-neutral-900">{item.name}</p>
                      <p className="text-neutral-500">
                        {item.color} · {item.size}
                      </p>
                    </td>
                    <td className="py-2 px-3 font-mono text-neutral-600">{item.sku}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{item.quantity}</td>
                    {printMode !== 'packing' && (
                      <td className="py-2 px-3 text-right font-mono tabular-nums">
                        {formatPKR(item.lineTotal)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {printMode !== 'packing' && (
              <div className="flex justify-end text-xs">
                <div className="w-64 space-y-1">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatPKR(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Shipping</span>
                    <span className="tabular-nums">{formatPKR(selectedOrder.shippingCost)}</span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-[#16A34A]">
                      <span>Discount</span>
                      <span className="tabular-nums">-{formatPKR(selectedOrder.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-neutral-900 pt-1.5 border-t border-neutral-200">
                    <span>Grand Total</span>
                    <span className="tabular-nums">{formatPKR(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Status Update Workflow (hidden on print) */}
            {canManageOrders && !selectedOrder.isDemo && (
              <form onSubmit={handleStatusSave} className="bg-neutral-50 border border-neutral-200 p-4 space-y-3 no-print">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900">
                  <Truck className="w-4 h-4 text-[#9D7B38]" />
                  <span>Fulfillment &amp; Courier Update</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-neutral-600 mb-1">Order Status</label>
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                      className="w-full border border-neutral-300 bg-white px-2.5 py-2"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-600 mb-1">Payment Status</label>
                    <select
                      value={nextPayStatus}
                      onChange={(e) => setNextPayStatus(e.target.value as PaymentStatus)}
                      className="w-full border border-neutral-300 bg-white px-2.5 py-2"
                    >
                      {(['Pending', 'Paid', 'Failed', 'Refunded'] as PaymentStatus[]).map((ps) => (
                        <option key={ps} value={ps}>
                          {ps}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-600 mb-1">Courier Service</label>
                    <input
                      value={courierInput}
                      onChange={(e) => setCourierInput(e.target.value)}
                      placeholder="TCS Tracked / Leopards"
                      className="w-full border border-neutral-300 bg-white px-2.5 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-600 mb-1">Tracking / AWB Number</label>
                    <input
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      placeholder="e.g., TCS-88492011"
                      className="w-full border border-neutral-300 bg-white px-2.5 py-2 font-mono"
                    />
                  </div>
                </div>

                <input
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Optional customer tracking note..."
                  className="w-full border border-neutral-300 bg-white px-2.5 py-2 text-xs"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-[#222222] text-white text-xs uppercase tracking-wider hover:bg-[#3A3A3A]"
                  >
                    {saving ? 'Updating...' : 'Save Order Update'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
