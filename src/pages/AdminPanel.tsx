import React, { useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Boxes,
  ClipboardList,
  FolderTree,
  History,
  Menu,
  MessageSquare,
  Package,
  RefreshCw,
  Settings,
  ShieldCheck,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { AdminCatalog } from '../components/admin/AdminCatalog';
import { AdminOperations } from '../components/admin/AdminOperations';
import { AdminOrders } from '../components/admin/AdminOrders';
import { AdminOverview } from '../components/admin/AdminOverview';
import { PageContentSkeleton } from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { BRAND_LOGO_URL } from '../data/seedCatalog';
import { useSeoMetadata } from '../hooks/useSeoMetadata';
import type { PermissionKey } from '../types/ecommerce';

type AdminTab =
  | 'overview'
  | 'orders'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'marketing'
  | 'reviews'
  | 'staff'
  | 'audit'
  | 'settings';

export const AdminPanel: React.FC = () => {
  const { navigate } = useRouter();
  const { firebaseUser, isAuthReady, isStaff, role, can, signInWithGoogle, logout } = useAuth();
  const { refreshAdminData } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [authError, setAuthError] = useState('');

  useSeoMetadata({
    title: 'Executive Console | Deboo.pk',
    description: 'Restricted administrative console for Deboo.pk catalog, orders, and analytics.',
    noIndex: true,
  });

  const navItems: {
    id: AdminTab;
    label: string;
    icon: React.ReactNode;
    perm?: PermissionKey;
  }[] = [
    { id: 'overview', label: 'Analytics & Interest', icon: <BarChart3 className="w-4 h-4" />, perm: 'analytics.view' },
    { id: 'orders', label: 'Orders & Dispatch', icon: <ClipboardList className="w-4 h-4" />, perm: 'orders.manage' },
    { id: 'products', label: 'Products Catalog', icon: <Package className="w-4 h-4" />, perm: 'products.write' },
    { id: 'categories', label: 'Categories & Collections', icon: <FolderTree className="w-4 h-4" />, perm: 'products.write' },
    { id: 'inventory', label: 'Inventory & Ledger', icon: <Boxes className="w-4 h-4" />, perm: 'inventory.adjust' },
    { id: 'marketing', label: 'Banners, Coupons & List', icon: <Tag className="w-4 h-4" />, perm: 'marketing.manage' },
    { id: 'reviews', label: 'Reviews Moderation', icon: <MessageSquare className="w-4 h-4" />, perm: 'reviews.moderate' },
    { id: 'staff', label: 'Staff & Customers', icon: <Users className="w-4 h-4" />, perm: 'customers.view' },
    { id: 'audit', label: 'Audit Logs', icon: <History className="w-4 h-4" />, perm: 'audit.view' },
    { id: 'settings', label: 'Settings & Demo Sync', icon: <Settings className="w-4 h-4" />, perm: 'settings.manage' },
  ];

  const allowedTabs = navItems.filter((item) => !item.perm || can(item.perm) || role === 'Super Admin');
  const currentTabMeta = allowedTabs.find((t) => t.id === activeTab) || allowedTabs[0];

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <PageContentSkeleton variant="account" label="Verifying administrative credentials" />
      </div>
    );
  }

  if (!firebaseUser || !firebaseUser.emailVerified || !isStaff) {
    return (
      <main className="min-h-screen bg-[#FAF8F3] flex items-center justify-center p-6">
        <div className="bg-white border border-[#E8DCC3] max-w-md w-full p-8 space-y-5 text-center">
          <div className="flex justify-center">
            <img src={BRAND_LOGO_URL} alt="Deboo.pk — Everything, But Better." className="h-10 w-auto object-contain" />
          </div>
          <div className="w-10 h-10 mx-auto border border-[#C8A45D] flex items-center justify-center text-[#9D7B38]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="font-serif text-3xl text-[#222222]">Executive Admin Portal</h1>
          <p className="text-sm text-[#777777] leading-relaxed">
            Restricted to verified Deboo.pk staff and administrators. Sign in with an authorized staff account to manage orders, inventory, analytics, and RBAC roles.
          </p>

          {firebaseUser && !isStaff && (
            <p className="text-xs text-[#DC2626] bg-red-50 border border-red-200 p-3">
              Signed in as {firebaseUser.email}, which does not hold staff privileges.
            </p>
          )}
          {authError && (
            <p className="text-xs text-[#DC2626] bg-red-50 border border-red-200 p-3">{authError}</p>
          )}

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={async () => {
                setAuthError('');
                try {
                  await signInWithGoogle(true);
                } catch (err) {
                  setAuthError(err instanceof Error ? err.message : 'Unable to sign in with Google.');
                }
              }}
              className="w-full py-3 bg-[#222222] text-white text-xs uppercase tracking-[0.16em] hover:bg-[#3A3A3A]"
            >
              Sign In with Authorized Google Account
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3 border border-[#E8DCC3] text-xs uppercase tracking-[0.16em] text-[#222222] hover:bg-[#FAF8F3]"
            >
              Email &amp; Password Staff Login
            </button>
            {firebaseUser && (
              <button
                type="button"
                onClick={() => logout()}
                className="w-full py-2 text-xs text-[#777777] hover:text-[#222222]"
              >
                Sign out current session
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-2 text-xs text-[#9D7B38] hover:underline"
            >
              Return to Storefront
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-neutral-900 flex">
      {/* Desktop Sidebar (260px) */}
      <aside className="hidden lg:flex w-[260px] shrink-0 bg-white border-r border-neutral-200 flex-col justify-between">
        <div>
          <div className="h-16 px-5 border-b border-neutral-200 flex items-center justify-between">
            <img src={BRAND_LOGO_URL} alt="Deboo.pk — Everything, But Better." className="h-8 w-auto object-contain" />
            <span className="text-[10px] uppercase tracking-wider font-mono text-[#9D7B38] font-semibold">
              Atelier ERP
            </span>
          </div>

          <nav aria-label="Admin Navigation" className="p-3 space-y-1">
            {allowedTabs.map((item) => {
              const active = (currentTabMeta?.id || 'overview') === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-left transition-colors ${
                    active
                      ? 'bg-[#222222] text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <span className={active ? 'text-[#C8A45D]' : 'text-neutral-500'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-neutral-200 space-y-3 text-xs">
          <div>
            <p className="font-medium text-neutral-900 truncate">{firebaseUser.displayName || firebaseUser.email}</p>
            <p className="text-[11px] text-[#9D7B38] font-medium">{role}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full inline-flex items-center justify-center gap-2 py-2 border border-neutral-300 text-neutral-800 hover:bg-neutral-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Storefront</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 w-72 bg-white h-full flex flex-col justify-between p-4">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                <img src={BRAND_LOGO_URL} alt="Deboo.pk — Everything, But Better." className="h-8 w-auto object-contain" />
                <button type="button" aria-label="Close admin menu" onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="mt-4 space-y-1">
                {allowedTabs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium ${
                      activeTab === item.id ? 'bg-[#222222] text-white' : 'text-neutral-700'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="py-2 border border-neutral-300 text-xs"
            >
              Back to Storefront
            </button>
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-neutral-200 px-4 sm:px-6 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open admin sidebar"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-neutral-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-xs text-neutral-500 truncate">
              <span>Deboo.pk Admin</span>
              <span className="mx-2">/</span>
              <span className="font-semibold text-neutral-900">
                {currentTabMeta?.label || 'Overview'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={async () => {
                setRefreshing(true);
                try {
                  await refreshAdminData();
                } finally {
                  setRefreshing(false);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 text-xs font-medium text-neutral-800 hover:bg-neutral-50 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Live Data</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-3 py-1.5 bg-[#222222] text-white text-xs font-medium hover:bg-[#3A3A3A] whitespace-nowrap"
            >
              View Storefront
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {currentTabMeta?.id === 'overview' && <AdminOverview />}
          {currentTabMeta?.id === 'orders' && <AdminOrders />}
          {(currentTabMeta?.id === 'products' ||
            currentTabMeta?.id === 'categories' ||
            currentTabMeta?.id === 'inventory') && <AdminCatalog section={currentTabMeta.id} />}
          {(currentTabMeta?.id === 'marketing' ||
            currentTabMeta?.id === 'reviews' ||
            currentTabMeta?.id === 'staff' ||
            currentTabMeta?.id === 'audit' ||
            currentTabMeta?.id === 'settings') && <AdminOperations section={currentTabMeta.id} />}
        </main>
      </div>
    </div>
  );
};
