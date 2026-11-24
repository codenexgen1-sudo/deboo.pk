import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Eye, Heart, ShoppingBag, TrendingUp } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  calculateProfitAndMargin,
  computeAnalyticsSummary,
  formatPKR,
  type DateRangePreset,
} from '../../utils/commerce';

export const AdminOverview: React.FC = () => {
  const {
    adminOrders,
    adminProducts,
    analyticsEvents,
    customersList,
    newsletterSubscribers,
  } = useStore();

  const [dateRange, setDateRange] = useState<DateRangePreset>('30d');
  const [includeDemo, setIncludeDemo] = useState(true);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [subView, setSubView] = useState<'executive' | 'interest'>('executive');

  const summary = useMemo(
    () =>
      computeAnalyticsSummary({
        orders: adminOrders,
        products: adminProducts,
        events: analyticsEvents,
        totalCustomers: customersList.length,
        dateRange,
        includeDemo,
        customStart,
        customEnd,
      }),
    [adminOrders, adminProducts, analyticsEvents, customersList.length, dateRange, includeDemo, customStart, customEnd]
  );

  const scopedProducts = useMemo(
    () => (includeDemo ? adminProducts : adminProducts.filter((p) => !p.isDemo)),
    [adminProducts, includeDemo]
  );

  const topByRevenue = useMemo(
    () =>
      [...scopedProducts]
        .map((p) => {
          const { sellingPrice, profit, marginPercent } = calculateProfitAndMargin(
            p.price,
            p.onSale ? p.salePrice : undefined,
            p.costPrice
          );
          return {
            ...p,
            sellingPrice,
            estRevenue: p.salesCount * sellingPrice,
            estProfit: p.salesCount * profit,
            marginPercent,
          };
        })
        .sort((a, b) => b.estRevenue - a.estRevenue)
        .slice(0, 6),
    [scopedProducts]
  );

  const topByViews = useMemo(
    () => [...scopedProducts].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5),
    [scopedProducts]
  );

  const topByWishlist = useMemo(
    () => [...scopedProducts].sort((a, b) => b.wishlistCount - a.wishlistCount).slice(0, 5),
    [scopedProducts]
  );

  const kpiCards = [
    { label: 'Total Revenue', value: formatPKR(summary.totalRevenue), sub: `Today: ${formatPKR(summary.todayRevenue)}` },
    { label: 'Total Orders', value: String(summary.totalOrders), sub: `Today: ${summary.todayOrders} · Pending: ${summary.pendingOrders}` },
    { label: 'Avg. Order Value', value: formatPKR(summary.averageOrderValue), sub: `Conversion: ${summary.conversionRate}%` },
    { label: 'Active Catalog', value: String(summary.activeProducts), sub: `Low Stock: ${summary.lowStockProducts} · Out: ${summary.outOfStockProducts}` },
    { label: 'Client Profiles', value: String(summary.totalCustomers), sub: `Newsletter: ${newsletterSubscribers.length}` },
    { label: 'Wishlist Demand', value: String(summary.totalWishlistAdditions), sub: `Cancelled: ${summary.cancelledOrders} · Refunded: ${summary.refundedOrders}` },
  ];

  return (
    <div className="space-y-6">
      {/* Filter & Controls Toolbar */}
      <div className="bg-white border border-neutral-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubView('executive')}
            className={`px-3.5 py-2 text-xs font-medium border transition-colors ${
              subView === 'executive'
                ? 'bg-[#222222] text-white border-[#222222]'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            Executive Revenue &amp; Orders
          </button>
          <button
            type="button"
            onClick={() => setSubView('interest')}
            className={`px-3.5 py-2 text-xs font-medium border transition-colors ${
              subView === 'interest'
                ? 'bg-[#222222] text-white border-[#222222]'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            Public Interest &amp; Demand
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs text-neutral-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeDemo}
              onChange={(e) => setIncludeDemo(e.target.checked)}
              className="accent-[#9D7B38]"
            />
            <span>Include Demo Seed Data</span>
          </label>

          <select
            aria-label="Analytics date range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRangePreset)}
            className="border border-neutral-200 px-3 py-1.5 text-xs bg-white text-neutral-900"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
            <option value="all">All Time</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                aria-label="Custom start date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="border border-neutral-200 px-2 py-1 text-xs"
              />
              <span className="text-xs text-neutral-400">to</span>
              <input
                type="date"
                aria-label="Custom end date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="border border-neutral-200 px-2 py-1 text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="bg-white border border-neutral-200 p-4">
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">{kpi.label}</p>
            <p className="text-2xl font-semibold text-neutral-900 mt-1 tabular-nums">{kpi.value}</p>
            <p className="text-xs text-neutral-500 mt-1 tabular-nums">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {subView === 'executive' ? (
        <>
          {/* Revenue Trend & City/Payment Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 bg-white border border-neutral-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900">Revenue Over Time</h2>
                  <p className="text-xs text-neutral-500">Completed &amp; active order volume (PKR)</p>
                </div>
                <TrendingUp className="w-4 h-4 text-[#9D7B38]" />
              </div>
              {summary.revenueSeries.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-neutral-500 border border-dashed border-neutral-200">
                  No orders recorded for the selected period and data filter.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={summary.revenueSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#666' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#666' }} />
                      <Tooltip formatter={(val) => formatPKR(Number(val ?? 0))} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#9D7B38"
                        fill="#E8DCC3"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-white border border-neutral-200 p-5">
              <h2 className="text-sm font-semibold text-neutral-900">Sales by City (Pakistan)</h2>
              <p className="text-xs text-neutral-500 mb-4">Karachi Main Warehouse dispatch destinations</p>
              {summary.salesByCity.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-neutral-500 border border-dashed border-neutral-200">
                  No city breakdown available yet.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.salesByCity} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#666' }} />
                      <YAxis type="category" dataKey="name" width={85} tick={{ fontSize: 11, fill: '#333' }} />
                      <Tooltip formatter={(val) => formatPKR(Number(val ?? 0))} />
                      <Bar dataKey="value" fill="#222222" radius={[0, 2, 2, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods & Top Revenue Products */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 bg-white border border-neutral-200 p-5">
              <h2 className="text-sm font-semibold text-neutral-900 mb-3">Payment Method Split</h2>
              {summary.salesByPayment.length === 0 ? (
                <p className="text-xs text-neutral-500 py-8 text-center">No payment data in scope.</p>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {summary.salesByPayment.map((pm) => (
                    <div key={pm.name} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="text-neutral-700 font-medium">{pm.name}</span>
                      <span className="font-mono tabular-nums text-neutral-900">{formatPKR(pm.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-8 bg-white border border-neutral-200 p-5 overflow-x-auto">
              <h2 className="text-sm font-semibold text-neutral-900 mb-3">
                Top Products by Revenue &amp; Profit Margin
              </h2>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 text-left">
                    <th className="py-2 font-medium">Product</th>
                    <th className="py-2 font-medium text-right">Sold</th>
                    <th className="py-2 font-medium text-right">Est. Revenue</th>
                    <th className="py-2 font-medium text-right">Est. Profit</th>
                    <th className="py-2 font-medium text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {topByRevenue.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50">
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-neutral-900">{p.name}</p>
                        <p className="text-[11px] text-neutral-500 font-mono">{p.sku}</p>
                      </td>
                      <td className="py-2.5 text-right tabular-nums">{p.salesCount}</td>
                      <td className="py-2.5 text-right tabular-nums font-medium">{formatPKR(p.estRevenue)}</td>
                      <td className="py-2.5 text-right tabular-nums text-[#16A34A]">{formatPKR(p.estProfit)}</td>
                      <td className="py-2.5 text-right tabular-nums">{p.marginPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Public Interest Analytics */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-neutral-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-neutral-900">Most Viewed Outfits</h2>
              <Eye className="w-4 h-4 text-[#9D7B38]" />
            </div>
            <div className="divide-y divide-neutral-100">
              {topByViews.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-neutral-800 truncate pr-2">{p.name}</span>
                  <span className="font-mono tabular-nums text-neutral-600">{p.viewCount} views</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-neutral-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-neutral-900">Most Wishlisted Pieces</h2>
              <Heart className="w-4 h-4 text-[#9D7B38]" />
            </div>
            <div className="divide-y divide-neutral-100">
              {topByWishlist.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-neutral-800 truncate pr-2">{p.name}</span>
                  <span className="font-mono tabular-nums text-neutral-600">{p.wishlistCount} saves</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-neutral-200 p-5 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-neutral-900">Top Search Terms</h2>
                <ShoppingBag className="w-4 h-4 text-[#9D7B38]" />
              </div>
              {summary.topSearchTerms.length === 0 ? (
                <p className="text-xs text-neutral-500">Live search queries appear here as shoppers browse.</p>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {summary.topSearchTerms.map((item) => (
                    <div key={item.term} className="py-1.5 flex items-center justify-between text-xs">
                      <span className="text-neutral-800">&ldquo;{item.term}&rdquo;</span>
                      <span className="font-mono tabular-nums text-neutral-500">{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-200 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-medium text-neutral-900 mb-1">Popular Colors</p>
                {summary.popularColors.length === 0 ? (
                  <p className="text-neutral-500">Awaiting events</p>
                ) : (
                  summary.popularColors.map((c) => (
                    <p key={c.name} className="text-neutral-600 flex justify-between">
                      <span>{c.name}</span>
                      <span className="tabular-nums">{c.count}</span>
                    </p>
                  ))
                )}
              </div>
              <div>
                <p className="font-medium text-neutral-900 mb-1">Popular Sizes</p>
                {summary.popularSizes.length === 0 ? (
                  <p className="text-neutral-500">Awaiting events</p>
                ) : (
                  summary.popularSizes.map((s) => (
                    <p key={s.name} className="text-neutral-600 flex justify-between">
                      <span>{s.name}</span>
                      <span className="tabular-nums">{s.count}</span>
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
