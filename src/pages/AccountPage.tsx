import React, { useEffect, useState } from 'react';
import {
  Bell,
  Heart,
  LogOut,
  MapPin,
  Package,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { PageContentSkeleton } from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { useSeoMetadata } from '../hooks/useSeoMetadata';
import type { Order } from '../types/ecommerce';
import { formatPKR, PAKISTAN_CITIES } from '../utils/commerce';

export const AccountPage: React.FC<{ initialTab?: 'overview' | 'orders' }> = ({
  initialTab = 'overview',
}) => {
  const { navigate } = useRouter();
  const {
    firebaseUser,
    isAuthReady,
    profile,
    role,
    isStaff,
    updateUserProfile,
    changePassword,
    logout,
  } = useAuth();
  const {
    myOrders,
    addresses,
    saveAddress,
    deleteAddress,
    wishlistIds,
    products,
    recentlyViewedIds,
    notifications,
    markNotificationRead,
    addToCart,
    customerDataLoading,
  } = useStore();

  const [tab, setTab] = useState<'overview' | 'orders' | 'addresses' | 'profile' | 'notifications'>(
    initialTab === 'orders' ? 'orders' : 'overview'
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Profile edit
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [photoUrl, setPhotoUrl] = useState(profile?.photoUrl || '');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');

  // Address form
  const [addrFormOpen, setAddrFormOpen] = useState(false);
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrCity, setAddrCity] = useState('Karachi');
  const [addrArea, setAddrArea] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrPostal, setAddrPostal] = useState('');
  const [addrDefault, setAddrDefault] = useState(false);

  useSeoMetadata({
    title: tab === 'orders' ? 'My Orders | Deboo.pk' : 'My Account | Deboo.pk',
    description: 'Manage your Deboo.pk orders, saved addresses, and curated wishlist.',
    noIndex: true,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setPhone(profile.phone || '');
      setPhotoUrl(profile.photoUrl || '');
    }
  }, [profile]);

  if (!isAuthReady) {
    return <PageContentSkeleton variant="account" label="Loading client portal" />;
  }

  if (!firebaseUser) {
    return (
      <main className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="font-serif text-3xl text-[#222222]">Client Account</h1>
        <p className="text-sm text-[#777777] mt-2 mb-6">
          Sign in to access your order history, saved addresses, and curated wishlist.
        </p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="px-7 py-3 bg-[#222222] text-white text-xs uppercase tracking-[0.16em]"
        >
          Sign In
        </button>
      </main>
    );
  }

  if (customerDataLoading) {
    return <PageContentSkeleton variant="account" label="Syncing orders and saved addresses" />;
  }

  const pendingCount = myOrders.filter((o) =>
    ['Order Placed', 'Confirmed', 'Processing', 'Packed', 'Dispatched', 'Out for Delivery'].includes(
      o.orderStatus
    )
  ).length;
  const deliveredCount = myOrders.filter((o) => o.orderStatus === 'Delivered').length;
  const recentlyViewed = products.filter((p) => recentlyViewedIds.includes(p.id)).slice(0, 3);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      await updateUserProfile({ fullName, phone, photoUrl });
      if (newPassword.trim().length >= 6) {
        await changePassword(newPassword.trim());
        setNewPassword('');
      }
      setProfileMsg('Profile updated successfully.');
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : 'Unable to update profile.');
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveAddress({
      fullName: addrName,
      phone: addrPhone,
      city: addrCity,
      area: addrArea,
      completeAddress: addrStreet,
      postalCode: addrPostal,
      isDefault: addrDefault,
    });
    setAddrFormOpen(false);
    setAddrName('');
    setAddrPhone('');
    setAddrArea('');
    setAddrStreet('');
    setAddrPostal('');
  };

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        addToCart(prod, item.color, item.size, item.quantity);
      }
    });
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Account Header */}
      <div className="border-b border-[#E8DCC3] pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9D7B38]">
            {role} · {firebaseUser.emailVerified ? 'Verified Account' : 'Verification Pending'}
          </p>
          <h1 className="font-serif text-4xl text-[#222222] mt-1">
            Welcome, {profile?.fullName || firebaseUser.displayName || 'Client'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {isStaff && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-4 py-2 border border-[#C8A45D] text-[#9D7B38] text-xs uppercase tracking-[0.14em] inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Console</span>
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="px-4 py-2 border border-[#E8DCC3] text-[#222222] text-xs uppercase tracking-[0.14em] inline-flex items-center gap-1.5 hover:border-[#222222]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-[#E8DCC3] pb-4">
        {[
          { key: 'overview', label: 'Dashboard', icon: User },
          { key: 'orders', label: `My Orders (${myOrders.length})`, icon: Package },
          { key: 'addresses', label: `Address Book (${addresses.length})`, icon: MapPin },
          { key: 'notifications', label: `Notifications (${notifications.filter((n) => !n.read).length})`, icon: Bell },
          { key: 'profile', label: 'Profile & Security', icon: ShieldCheck },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key as typeof tab)}
              className={`px-4 py-2 text-xs uppercase tracking-[0.14em] inline-flex items-center gap-2 border transition-colors ${
                tab === item.key
                  ? 'bg-[#222222] text-white border-[#222222]'
                  : 'bg-white text-[#222222] border-[#E8DCC3] hover:border-[#222222]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="space-y-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Orders', value: myOrders.length },
              { label: 'Active / Pending', value: pendingCount },
              { label: 'Delivered', value: deliveredCount },
              { label: 'Saved Wishlist', value: wishlistIds.length },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white border border-[#E8DCC3] p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-[#777777]">{kpi.label}</p>
                <p className="font-serif text-3xl text-[#222222] mt-2 tabular-nums">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E8DCC3] p-6">
              <h2 className="font-serif text-2xl text-[#222222] mb-4">Account Summary</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#777777]">Full Name</dt>
                  <dd className="font-medium">{profile?.fullName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#777777]">Email</dt>
                  <dd className="font-medium">{profile?.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#777777]">Phone</dt>
                  <dd className="font-medium">{profile?.phone || 'Not added'}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white border border-[#E8DCC3] p-6 flex flex-col justify-between">
              <div>
                <h2 className="font-serif text-2xl text-[#222222] mb-2">Wishlist &amp; Quick Track</h2>
                <p className="text-sm text-[#777777]">
                  You have {wishlistIds.length} pieces saved in your wishlist.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/wishlist')}
                  className="px-4 py-2 bg-[#222222] text-white text-xs uppercase tracking-[0.14em] inline-flex items-center gap-1.5"
                >
                  <Heart className="w-3.5 h-3.5 text-[#C8A45D]" />
                  <span>View Wishlist</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/track-order')}
                  className="px-4 py-2 border border-[#E8DCC3] text-xs uppercase tracking-[0.14em]"
                >
                  Track Shipment
                </button>
              </div>
            </div>
          </div>

          {recentlyViewed.length > 0 && (
            <div>
              <h2 className="font-serif text-2xl text-[#222222] mb-5">Recently Viewed</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {recentlyViewed.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-4">
          {myOrders.length === 0 ? (
            <div className="bg-white border border-[#E8DCC3] p-12 text-center">
              <p className="font-serif text-2xl text-[#222222]">No orders yet</p>
              <p className="text-sm text-[#777777] mt-1 mb-6">
                Your confirmed orders and courier tracking details will appear here.
              </p>
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="px-6 py-2.5 bg-[#222222] text-white text-xs uppercase tracking-[0.15em]"
              >
                Explore Collection
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#E8DCC3] overflow-x-auto">
              <table className="w-full text-sm text-left tabular-nums">
                <thead className="bg-[#FAF8F3] border-b border-[#E8DCC3] text-xs uppercase text-[#777777]">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DCC3]/60">
                  {myOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#FAF8F3]/60">
                      <td className="py-3.5 px-4 font-mono font-medium">{ord.orderNumber}</td>
                      <td className="py-3.5 px-4 text-[#777777]">{ord.createdAt.slice(0, 10)}</td>
                      <td className="py-3.5 px-4">{ord.paymentMethod}</td>
                      <td className="py-3.5 px-4 text-[#9D7B38] font-medium">{ord.orderStatus}</td>
                      <td className="py-3.5 px-4 text-right font-semibold">
                        {formatPKR(ord.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(ord)}
                          className="text-xs underline text-[#222222]"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorder(ord)}
                          className="text-xs text-[#9D7B38] inline-flex items-center gap-1 hover:underline"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reorder</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedOrder && (
            <div className="bg-white border border-[#C8A45D] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8DCC3] pb-3">
                <h3 className="font-serif text-2xl">
                  Order {selectedOrder.orderNumber} · {selectedOrder.orderStatus}
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/track-order?order=${encodeURIComponent(selectedOrder.orderNumber)}`)
                  }
                  className="text-xs uppercase tracking-[0.14em] px-3 py-1.5 bg-[#222222] text-white"
                >
                  Live Timeline
                </button>
              </div>
              <div className="divide-y divide-[#E8DCC3]/60 text-sm">
                {selectedOrder.items.map((it, i) => (
                  <div key={i} className="py-2 flex justify-between">
                    <span>
                      {it.name} ({it.color}, {it.size}) × {it.quantity}
                    </span>
                    <span className="tabular-nums font-medium">{formatPKR(it.lineTotal)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-2xl text-[#222222]">Saved Pakistan Addresses</h2>
            <button
              type="button"
              onClick={() => setAddrFormOpen((v) => !v)}
              className="px-4 py-2 bg-[#222222] text-white text-xs uppercase tracking-[0.14em] inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Address</span>
            </button>
          </div>

          {addrFormOpen && (
            <form onSubmit={handleAddAddress} className="bg-white border border-[#E8DCC3] p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                required
                value={addrName}
                onChange={(e) => setAddrName(e.target.value)}
                placeholder="Recipient Full Name"
                className="border border-[#E8DCC3] px-3 py-2 text-sm"
              />
              <input
                required
                value={addrPhone}
                onChange={(e) => setAddrPhone(e.target.value)}
                placeholder="Mobile Number"
                className="border border-[#E8DCC3] px-3 py-2 text-sm"
              />
              <select
                value={addrCity}
                onChange={(e) => setAddrCity(e.target.value)}
                className="border border-[#E8DCC3] px-3 py-2 text-sm bg-white"
              >
                {PAKISTAN_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                required
                value={addrArea}
                onChange={(e) => setAddrArea(e.target.value)}
                placeholder="Area / Phase"
                className="border border-[#E8DCC3] px-3 py-2 text-sm"
              />
              <input
                required
                value={addrStreet}
                onChange={(e) => setAddrStreet(e.target.value)}
                placeholder="Complete Street Address"
                className="sm:col-span-2 border border-[#E8DCC3] px-3 py-2 text-sm"
              />
              <input
                value={addrPostal}
                onChange={(e) => setAddrPostal(e.target.value)}
                placeholder="Postal Code"
                className="border border-[#E8DCC3] px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={addrDefault}
                  onChange={(e) => setAddrDefault(e.target.checked)}
                />
                <span>Set as default address</span>
              </label>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#222222] text-white text-xs uppercase tracking-[0.14em]"
                >
                  Save Address
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div key={addr.id} className="bg-white border border-[#E8DCC3] p-5 flex justify-between">
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-[#222222]">
                    {addr.fullName}{' '}
                    {addr.isDefault && <span className="text-xs text-[#9D7B38]">· Default</span>}
                  </p>
                  <p className="text-[#777777]">{addr.completeAddress}</p>
                  <p className="text-[#777777]">
                    {addr.area}, {addr.city} {addr.postalCode}
                  </p>
                  <p className="text-xs text-[#777777]">{addr.phone}</p>
                </div>
                <button
                  type="button"
                  aria-label="Delete address"
                  onClick={() => deleteAddress(addr.id)}
                  className="text-[#777777] hover:text-red-700 self-start"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="bg-white border border-[#E8DCC3] divide-y divide-[#E8DCC3]">
          {notifications.length === 0 ? (
            <p className="p-8 text-sm text-[#777777] text-center">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-5 flex items-center justify-between gap-4 ${
                  n.read ? 'bg-white' : 'bg-[#FAF8F3]'
                }`}
              >
                <div>
                  <p className="font-medium text-sm text-[#222222]">{n.title}</p>
                  <p className="text-xs text-[#777777] mt-1">{n.message}</p>
                </div>
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => markNotificationRead(n.id)}
                    className="text-xs text-[#9D7B38] underline shrink-0"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white border border-[#E8DCC3] p-6 max-w-xl space-y-4">
          <h2 className="font-serif text-2xl text-[#222222]">Profile &amp; Security</h2>
          <div>
            <label className="block text-xs uppercase tracking-[0.12em] text-[#777777] mb-1">
              Full Name
            </label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-[#E8DCC3] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.12em] text-[#777777] mb-1">
              Phone Number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0300-1234567"
              className="w-full border border-[#E8DCC3] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.12em] text-[#777777] mb-1">
              Profile Photo URL
            </label>
            <input
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full border border-[#E8DCC3] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.12em] text-[#777777] mb-1">
              New Password (Optional, min 6 chars)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              className="w-full border border-[#E8DCC3] px-3 py-2 text-sm"
            />
          </div>
          {profileMsg && <p className="text-xs text-[#9D7B38]">{profileMsg}</p>}
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#222222] text-white text-xs uppercase tracking-[0.15em]"
          >
            Save Profile Changes
          </button>
        </form>
      )}
    </main>
  );
};
