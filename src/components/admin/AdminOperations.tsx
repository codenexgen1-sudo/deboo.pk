import React, { useState } from 'react';
import { Check, Download, RefreshCw, Shield, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { IMG_ASSETS } from '../../data/seedCatalog';
import type { Coupon, PermissionKey, RoleName, StoreSettings } from '../../types/ecommerce';
import { formatPKR, ROLE_DEFAULT_PERMISSIONS } from '../../utils/commerce';

interface AdminOperationsProps {
  section: 'marketing' | 'reviews' | 'staff' | 'settings' | 'audit';
}

const ALL_PERMISSIONS: PermissionKey[] = [
  'products.write',
  'orders.manage',
  'inventory.adjust',
  'marketing.manage',
  'analytics.view',
  'reviews.moderate',
  'customers.view',
  'settings.manage',
  'roles.manage',
  'audit.view',
];

const STAFF_ROLES: Exclude<RoleName, 'Customer'>[] = [
  'Admin',
  'Store Manager',
  'Order Manager',
  'Inventory Manager',
  'Marketing Manager',
  'Customer Support',
  'Super Admin',
];

export const AdminOperations: React.FC<AdminOperationsProps> = ({ section }) => {
  const { can } = useAuth();
  const {
    adminCoupons,
    banners,
    newsletterSubscribers,
    adminReviews,
    staffRecords,
    customersList,
    auditLogs,
    settings,
    upsertCoupon,
    deleteCoupon,
    upsertBanner,
    deleteBanner,
    moderateReview,
    upsertStaffRole,
    removeStaffRole,
    updateStoreSettings,
    syncDemoDataToFirestore,
    clearDemoDataFromFirestore,
  } = useStore();

  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<Coupon['type']>('Percentage');
  const [couponVal, setCouponVal] = useState(10);
  const [couponMin, setCouponMin] = useState(5000);

  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerImage, setBannerImage] = useState<string>(IMG_ASSETS.heroSilk);

  const [staffUid, setStaffUid] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState<Exclude<RoleName, 'Customer'>>('Store Manager');
  const [staffPerms, setStaffPerms] = useState<PermissionKey[]>(ROLE_DEFAULT_PERMISSIONS['Store Manager']);

  const [localSettings, setLocalSettings] = useState<StoreSettings>(settings);
  const [actionFeedback, setActionFeedback] = useState('');

  if (section === 'marketing') {
    const exportNewsletter = () => {
      const csv = ['Email,Source,Date', ...newsletterSubscribers.map((n) => `${n.email},${n.source},${n.createdAt}`)].join(
        '\n'
      );
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'deboo-newsletter-subscribers.csv';
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="space-y-6">
        {/* Coupons */}
        <div className="bg-white border border-neutral-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-900">Promotional Coupons</h2>
          {can('marketing.manage') && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!couponCode.trim()) return;
                await upsertCoupon({
                  code: couponCode.trim().toUpperCase(),
                  type: couponType,
                  value: couponVal,
                  minOrderAmount: couponMin,
                  description: `${couponType} promotion`,
                  active: true,
                });
                setCouponCode('');
              }}
              className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs"
            >
              <input
                required
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="CODE (e.g. EID20)"
                className="border border-neutral-300 px-3 py-2 font-mono uppercase"
              />
              <select
                value={couponType}
                onChange={(e) => setCouponType(e.target.value as Coupon['type'])}
                className="border border-neutral-300 px-3 py-2 bg-white"
              >
                <option value="Percentage">Percentage (%)</option>
                <option value="Fixed">Fixed (PKR)</option>
                <option value="Free Shipping">Free Shipping</option>
                <option value="BOGO">BOGO</option>
              </select>
              <input
                type="number"
                value={couponVal}
                onChange={(e) => setCouponVal(Number(e.target.value))}
                placeholder="Value"
                className="border border-neutral-300 px-3 py-2 font-mono"
              />
              <input
                type="number"
                value={couponMin}
                onChange={(e) => setCouponMin(Number(e.target.value))}
                placeholder="Min Order PKR"
                className="border border-neutral-300 px-3 py-2 font-mono"
              />
              <button type="submit" className="px-4 py-2 bg-[#222222] text-white font-medium">
                Create Coupon
              </button>
            </form>
          )}
          <div className="divide-y divide-neutral-100 text-xs">
            {adminCoupons.map((c) => (
              <div key={c.id} className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <span className="font-mono font-semibold text-neutral-900">{c.code}</span>
                  <span className="ml-2 text-neutral-600">
                    {c.type} ({c.type === 'Percentage' ? `${c.value}%` : formatPKR(c.value)}) · Min{' '}
                    {formatPKR(c.minOrderAmount)}
                  </span>
                </div>
                {can('marketing.manage') && (
                  <button
                    type="button"
                    aria-label={`Delete coupon ${c.code}`}
                    onClick={() => deleteCoupon(c.id)}
                    className="text-[#DC2626] hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hero Banners */}
        <div className="bg-white border border-neutral-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-900">Homepage Hero Banners</h2>
          {can('marketing.manage') && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!bannerTitle.trim()) return;
                await upsertBanner({
                  title: bannerTitle.trim(),
                  subtitle: bannerSubtitle.trim(),
                  desktopImage: bannerImage,
                  active: true,
                });
                setBannerTitle('');
                setBannerSubtitle('');
              }}
              className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs"
            >
              <input
                required
                value={bannerTitle}
                onChange={(e) => setBannerTitle(e.target.value)}
                placeholder="Campaign headline"
                className="border border-neutral-300 px-3 py-2"
              />
              <input
                required
                value={bannerSubtitle}
                onChange={(e) => setBannerSubtitle(e.target.value)}
                placeholder="Campaign subtitle"
                className="border border-neutral-300 px-3 py-2"
              />
              <input
                required
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                placeholder="Banner image URL"
                className="border border-neutral-300 px-3 py-2"
              />
              <button type="submit" className="px-4 py-2 bg-[#222222] text-white font-medium">
                Publish Banner
              </button>
            </form>
          )}
          <div className="divide-y divide-neutral-100 text-xs">
            {banners.map((b) => (
              <div key={b.id} className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-neutral-900">{b.title}</p>
                  <p className="text-neutral-500">{b.subtitle}</p>
                </div>
                {can('marketing.manage') && (
                  <button
                    type="button"
                    onClick={() => deleteBanner(b.id)}
                    className="text-[#DC2626] hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div className="bg-white border border-neutral-200 p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">
              Newsletter Subscribers ({newsletterSubscribers.length})
            </h2>
            <button
              type="button"
              onClick={exportNewsletter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
          {newsletterSubscribers.length === 0 ? (
            <p className="text-neutral-500">Subscribers will appear here as visitors sign up.</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {newsletterSubscribers.map((sub) => (
                <div key={sub.id} className="py-2 flex justify-between">
                  <span className="font-medium text-neutral-800">{sub.email}</span>
                  <span className="text-neutral-500">{sub.source}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (section === 'reviews') {
    return (
      <div className="bg-white border border-neutral-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-neutral-900">Customer Review Moderation</h2>
        <div className="divide-y divide-neutral-200">
          {adminReviews.map((rev) => (
            <div key={rev.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1 max-w-2xl">
                <p className="font-medium text-neutral-900">
                  {rev.title} · <span className="text-[#9D7B38]">{rev.rating}/5</span>
                </p>
                <p className="text-neutral-600">{rev.comment}</p>
                <p className="text-[11px] text-neutral-500">
                  {rev.authorName} on {rev.productName} · Status: <strong>{rev.status}</strong>
                </p>
              </div>
              {can('reviews.moderate') && !rev.isDemo && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => moderateReview(rev.id, { status: 'Approved', featured: rev.featured })}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[#16A34A] text-[#16A34A]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => moderateReview(rev.id, { status: 'Rejected' })}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[#DC2626] text-[#DC2626]"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'staff') {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-neutral-200 p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#9D7B38]" />
            <h2 className="text-sm font-semibold text-neutral-900">Staff &amp; Role-Based Access Control</h2>
          </div>

          {can('roles.manage') && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!staffUid.trim() || !staffEmail.trim()) return;
                await upsertStaffRole({
                  uid: staffUid.trim(),
                  email: staffEmail.trim(),
                  fullName: staffName.trim() || staffEmail.trim(),
                  role: staffRole,
                  permissions: staffPerms,
                  active: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                setStaffUid('');
                setStaffEmail('');
                setStaffName('');
              }}
              className="bg-neutral-50 border border-neutral-200 p-4 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  required
                  value={staffUid}
                  onChange={(e) => setStaffUid(e.target.value)}
                  placeholder="User Firebase UID"
                  className="border border-neutral-300 bg-white px-3 py-2 font-mono"
                />
                <input
                  required
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="Staff Email"
                  className="border border-neutral-300 bg-white px-3 py-2"
                />
                <input
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Full Name"
                  className="border border-neutral-300 bg-white px-3 py-2"
                />
                <select
                  value={staffRole}
                  onChange={(e) => {
                    const r = e.target.value as Exclude<RoleName, 'Customer'>;
                    setStaffRole(r);
                    setStaffPerms(ROLE_DEFAULT_PERMISSIONS[r]);
                  }}
                  className="border border-neutral-300 bg-white px-3 py-2"
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-3">
                {ALL_PERMISSIONS.map((perm) => (
                  <label key={perm} className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={staffPerms.includes(perm)}
                      onChange={(e) => {
                        setStaffPerms((prev) =>
                          e.target.checked ? [...prev, perm] : prev.filter((p) => p !== perm)
                        );
                      }}
                      className="accent-[#9D7B38]"
                    />
                    <span className="font-mono text-[11px]">{perm}</span>
                  </label>
                ))}
              </div>
              <button type="submit" className="px-4 py-2 bg-[#222222] text-white font-medium">
                Assign Staff Role
              </button>
            </form>
          )}

          <div className="divide-y divide-neutral-100">
            {staffRecords.map((st) => (
              <div key={st.uid} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-neutral-900">
                    {st.fullName} · <span className="text-[#9D7B38]">{st.role}</span>
                  </p>
                  <p className="text-neutral-500 font-mono text-[11px]">
                    {st.email} · UID: {st.uid}
                  </p>
                </div>
                {can('roles.manage') && (
                  <button
                    type="button"
                    onClick={() => removeStaffRole(st.uid)}
                    className="p-1.5 text-[#DC2626] hover:bg-red-50"
                    aria-label={`Remove ${st.email}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Registered Customers */}
        <div className="bg-white border border-neutral-200 p-5 text-xs">
          <h2 className="text-sm font-semibold text-neutral-900 mb-3">
            Registered Customers ({customersList.length})
          </h2>
          {customersList.length === 0 ? (
            <p className="text-neutral-500">Verified client profiles will appear here.</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {customersList.map((u) => (
                <div key={u.uid} className="py-2.5 flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-medium text-neutral-900">{u.fullName}</p>
                    <p className="text-neutral-500">{u.email}</p>
                  </div>
                  <div className="text-right font-mono text-[11px] text-neutral-500">
                    <p>UID: {u.uid}</p>
                    <p>{u.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (section === 'audit') {
    return (
      <div className="bg-white border border-neutral-200 p-5 text-xs space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">Security &amp; Operations Audit Trail</h2>
        {auditLogs.length === 0 ? (
          <p className="text-neutral-500">Administrative actions are recorded chronologically here.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="py-2">Timestamp</th>
                <th className="py-2">Actor</th>
                <th className="py-2">Action</th>
                <th className="py-2">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="py-2 tabular-nums text-neutral-500">
                    {new Date(log.createdAt).toLocaleString('en-PK')}
                  </td>
                  <td className="py-2">
                    <span className="font-medium text-neutral-900">{log.actorEmail}</span>{' '}
                    <span className="text-neutral-500">({log.actorRole})</span>
                  </td>
                  <td className="py-2 font-mono text-[#9D7B38]">{log.action}</td>
                  <td className="py-2 text-neutral-700">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  // Settings & Demo Data Sync / Clean
  return (
    <div className="space-y-6 text-xs">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await updateStoreSettings(localSettings);
          setActionFeedback('Store settings saved to Firestore.');
        }}
        className="bg-white border border-neutral-200 p-5 space-y-4"
      >
        <h2 className="text-sm font-semibold text-neutral-900">Pakistan Storefront &amp; Logistics Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-neutral-600 mb-1">Free Shipping Threshold (PKR)</label>
            <input
              type="number"
              value={localSettings.freeShippingThreshold}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, freeShippingThreshold: Number(e.target.value) })
              }
              className="w-full border border-neutral-300 px-3 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block text-neutral-600 mb-1">Karachi Shipping Fee (PKR)</label>
            <input
              type="number"
              value={localSettings.karachiShippingFee}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, karachiShippingFee: Number(e.target.value) })
              }
              className="w-full border border-neutral-300 px-3 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block text-neutral-600 mb-1">Nationwide Default Fee (PKR)</label>
            <input
              type="number"
              value={localSettings.defaultShippingFee}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, defaultShippingFee: Number(e.target.value) })
              }
              className="w-full border border-neutral-300 px-3 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block text-neutral-600 mb-1">Tax Rate (%)</label>
            <input
              type="number"
              value={localSettings.taxRatePercent}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, taxRatePercent: Number(e.target.value) })
              }
              className="w-full border border-neutral-300 px-3 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block text-neutral-600 mb-1">WhatsApp Concierge</label>
            <input
              value={localSettings.whatsappNumber}
              onChange={(e) => setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })}
              className="w-full border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-neutral-600 mb-1">Support Email</label>
            <input
              value={localSettings.supportEmail}
              onChange={(e) => setLocalSettings({ ...localSettings, supportEmail: e.target.value })}
              className="w-full border border-neutral-300 px-3 py-2"
            />
          </div>
        </div>

        <div className="flex gap-6">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.codEnabled}
              onChange={(e) => setLocalSettings({ ...localSettings, codEnabled: e.target.checked })}
              className="accent-[#9D7B38]"
            />
            <span>Enable Cash on Delivery (COD)</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.guestCheckoutEnabled}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, guestCheckoutEnabled: e.target.checked })
              }
              className="accent-[#9D7B38]"
            />
            <span>Enable Guest Checkout</span>
          </label>
        </div>

        {can('settings.manage') && (
          <button type="submit" className="px-5 py-2 bg-[#222222] text-white font-medium">
            Save Configuration
          </button>
        )}
      </form>

      {/* Catalog Database Initialization & Demo Cleanup */}
      <div className="bg-white border border-neutral-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">Firestore Catalog &amp; Demo Data Controls</h2>
        <p className="text-neutral-600">
          Sync the curated initial Deboo.pk catalog into Firestore so all orders perform transactional inventory deduction, or clear demo-tagged records before production launch.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={async () => {
              await syncDemoDataToFirestore();
              setActionFeedback('Initial catalog and settings synced to Firestore.');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#222222] text-white font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Initial Demo Catalog to Firestore</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              await clearDemoDataFromFirestore();
              setActionFeedback('All demo-tagged records removed from Firestore.');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#DC2626] text-[#DC2626] font-medium hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Demo Data</span>
          </button>
        </div>
        {actionFeedback && <p className="text-[#16A34A] font-medium pt-1">{actionFeedback}</p>}
      </div>
    </div>
  );
};
