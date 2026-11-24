import React, { useMemo, useState } from 'react';
import { ArrowDownUp, Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import { SafeImage } from '../SafeImage';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { IMG_ASSETS } from '../../data/seedCatalog';
import type { InventoryMovementType, Product, ProductStatus } from '../../types/ecommerce';
import { calculateProfitAndMargin, formatPKR } from '../../utils/commerce';

interface AdminCatalogProps {
  section: 'products' | 'categories' | 'inventory';
}

export const AdminCatalog: React.FC<AdminCatalogProps> = ({ section }) => {
  const { can } = useAuth();
  const {
    adminProducts,
    categories,
    collections,
    inventoryMovements,
    upsertProduct,
    deleteProduct,
    adjustInventory,
    upsertCategory,
    upsertCollection,
  } = useStore();

  const canWriteProducts = can('products.write');
  const canAdjustInventory = can('inventory.adjust');

  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productError, setProductError] = useState('');
  const [saving, setSaving] = useState(false);

  // Inventory adjustment modal state
  const [invTarget, setInvTarget] = useState<Product | null>(null);
  const [invType, setInvType] = useState<InventoryMovementType>('Purchase');
  const [invDelta, setInvDelta] = useState(10);
  const [invReason, setInvReason] = useState('');
  const [invSupplier, setInvSupplier] = useState('');
  const [invError, setInvError] = useState('');

  // Category & Collection creation state
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [colName, setColName] = useState('');
  const [colSeason, setColSeason] = useState('');

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return adminProducts.filter((p) => {
      if (!q) return true;
      return `${p.name} ${p.sku} ${p.categoryName}`.toLowerCase().includes(q);
    });
  }, [adminProducts, searchTerm]);

  const inventoryMetrics = useMemo(() => {
    const totalUnits = adminProducts.reduce((s, p) => s + p.stockQuantity, 0);
    const totalCostValue = adminProducts.reduce((s, p) => s + p.stockQuantity * p.costPrice, 0);
    const lowStock = adminProducts.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 5).length;
    const outOfStock = adminProducts.filter((p) => p.stockQuantity <= 0).length;
    return { totalUnits, totalCostValue, lowStock, outOfStock };
  }, [adminProducts]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name || !editingProduct.sku || !editingProduct.price) return;
    setSaving(true);
    setProductError('');
    try {
      await upsertProduct({
        ...editingProduct,
        name: editingProduct.name,
        sku: editingProduct.sku,
        categoryName: editingProduct.categoryName || categories[0]?.name || 'Stitched Suits',
        price: Number(editingProduct.price),
      });
      setEditingProduct(null);
    } catch (err) {
      setProductError(err instanceof Error ? err.message : 'Could not save product changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invTarget) return;
    setSaving(true);
    setInvError('');
    try {
      const signedDelta = ['Damage', 'Sale', 'Reservation'].includes(invType)
        ? -Math.abs(invDelta)
        : Math.abs(invDelta);
      await adjustInventory({
        productId: invTarget.id,
        type: invType,
        quantityDelta: invType === 'Adjustment' ? invDelta : signedDelta,
        reason: invReason || `${invType} update`,
        supplier: invSupplier,
      });
      setInvTarget(null);
      setInvReason('');
      setInvSupplier('');
    } catch (err) {
      setInvError(err instanceof Error ? err.message : 'Could not update inventory.');
    } finally {
      setSaving(false);
    }
  };

  if (section === 'categories') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="bg-white border border-neutral-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-900">Product Categories</h2>
          {canWriteProducts && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!catName.trim()) return;
                await upsertCategory({
                  name: catName.trim(),
                  slug: catName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  description: catDesc.trim(),
                  image: IMG_ASSETS.catStitched,
                });
                setCatName('');
                setCatDesc('');
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2"
            >
              <input
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Category name"
                className="border border-neutral-200 px-3 py-2 text-xs"
              />
              <input
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Short description"
                className="border border-neutral-200 px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#222222] text-white text-xs font-medium hover:bg-[#3A3A3A]"
              >
                Add Category
              </button>
            </form>
          )}
          <div className="divide-y divide-neutral-100">
            {categories.map((cat) => (
              <div key={cat.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-medium text-neutral-900">{cat.name}</p>
                  <p className="text-neutral-500">/{cat.slug}</p>
                </div>
                <span className="text-[#16A34A]">Active</span>
              </div>
            ))}
          </div>
        </div>

        {/* Collections */}
        <div className="bg-white border border-neutral-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-900">Seasonal Collections</h2>
          {canWriteProducts && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!colName.trim()) return;
                await upsertCollection({
                  name: colName.trim(),
                  slug: colName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  season: colSeason.trim() || '2026 Edit',
                  image: IMG_ASSETS.heroFestive,
                  featured: true,
                });
                setColName('');
                setColSeason('');
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2"
            >
              <input
                required
                value={colName}
                onChange={(e) => setColName(e.target.value)}
                placeholder="Collection name"
                className="border border-neutral-200 px-3 py-2 text-xs"
              />
              <input
                value={colSeason}
                onChange={(e) => setColSeason(e.target.value)}
                placeholder="Season (e.g. Eid Edit)"
                className="border border-neutral-200 px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#222222] text-white text-xs font-medium hover:bg-[#3A3A3A]"
              >
                Add Collection
              </button>
            </form>
          )}
          <div className="divide-y divide-neutral-100">
            {collections.map((col) => (
              <div key={col.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-medium text-neutral-900">{col.name}</p>
                  <p className="text-neutral-500">{col.season}</p>
                </div>
                <span className="text-[#9D7B38]">{col.featured ? 'Featured' : 'Standard'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (section === 'inventory') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-neutral-200 p-4">
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">Total Stock Units</p>
            <p className="text-xl font-semibold text-neutral-900 mt-1 tabular-nums">{inventoryMetrics.totalUnits}</p>
          </div>
          <div className="bg-white border border-neutral-200 p-4">
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">Cost Valuation</p>
            <p className="text-xl font-semibold text-neutral-900 mt-1 tabular-nums">
              {formatPKR(inventoryMetrics.totalCostValue)}
            </p>
          </div>
          <div className="bg-white border border-neutral-200 p-4">
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">Low Stock Alerts</p>
            <p className="text-xl font-semibold text-[#D97706] mt-1 tabular-nums">{inventoryMetrics.lowStock}</p>
          </div>
          <div className="bg-white border border-neutral-200 p-4">
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">Out of Stock</p>
            <p className="text-xl font-semibold text-[#DC2626] mt-1 tabular-nums">{inventoryMetrics.outOfStock}</p>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-600">
                <th className="py-3 px-4 font-medium">Product</th>
                <th className="py-3 px-4 font-medium">SKU</th>
                <th className="py-3 px-4 font-medium text-right">Stock</th>
                <th className="py-3 px-4 font-medium">State</th>
                <th className="py-3 px-4 font-medium text-right">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {adminProducts.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="py-3 px-4 font-medium text-neutral-900">{p.name}</td>
                  <td className="py-3 px-4 font-mono text-neutral-600">{p.sku}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">{p.stockQuantity}</td>
                  <td className="py-3 px-4">
                    {p.stockQuantity <= 0 ? (
                      <span className="text-[#DC2626] font-medium">Out of Stock</span>
                    ) : p.stockQuantity <= 5 ? (
                      <span className="text-[#D97706] font-medium">Low Stock</span>
                    ) : (
                      <span className="text-[#16A34A] font-medium">In Stock</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {canAdjustInventory && (
                      <button
                        type="button"
                        onClick={() => setInvTarget(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 border border-neutral-300 hover:bg-neutral-100"
                      >
                        <ArrowDownUp className="w-3 h-3" />
                        <span>Adjust</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stock Movement Ledger */}
        <div className="bg-white border border-neutral-200 p-5">
          <h2 className="text-sm font-semibold text-neutral-900 mb-3">Stock Movement History</h2>
          {inventoryMovements.length === 0 ? (
            <p className="text-xs text-neutral-500">Stock purchases, damages, and manual adjustments are logged here.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 text-left">
                    <th className="py-2">Date</th>
                    <th className="py-2">Product</th>
                    <th className="py-2">Type</th>
                    <th className="py-2 text-right">Delta</th>
                    <th className="py-2 text-right">New Stock</th>
                    <th className="py-2 pl-4">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {inventoryMovements.slice(0, 15).map((m) => (
                    <tr key={m.id}>
                      <td className="py-2 tabular-nums text-neutral-500">
                        {new Date(m.createdAt).toLocaleDateString('en-PK')}
                      </td>
                      <td className="py-2 font-medium text-neutral-900">{m.productName}</td>
                      <td className="py-2">{m.type}</td>
                      <td className="py-2 text-right font-mono tabular-nums">
                        {m.quantityDelta >= 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                      </td>
                      <td className="py-2 text-right font-mono tabular-nums">{m.newStock}</td>
                      <td className="py-2 pl-4 text-neutral-600">{m.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inventory Adjustment Modal */}
        {invTarget && (
          <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
            <form
              onSubmit={handleSaveInventory}
              className="bg-white border border-neutral-200 max-w-md w-full p-6 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900">Adjust Stock: {invTarget.name}</h3>
                <button type="button" onClick={() => setInvTarget(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Movement Type</label>
                <select
                  value={invType}
                  onChange={(e) => setInvType(e.target.value as InventoryMovementType)}
                  className="w-full border border-neutral-300 px-3 py-2"
                >
                  {(['Purchase', 'Return', 'Damage', 'Adjustment', 'Reservation', 'Release'] as InventoryMovementType[]).map(
                    (t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Quantity Change</label>
                <input
                  type="number"
                  required
                  value={invDelta}
                  onChange={(e) => setInvDelta(Number(e.target.value))}
                  className="w-full border border-neutral-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Supplier (optional)</label>
                <input
                  value={invSupplier}
                  onChange={(e) => setInvSupplier(e.target.value)}
                  placeholder="Karachi Textile Mill"
                  className="w-full border border-neutral-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Reason / Audit Note</label>
                <input
                  required
                  value={invReason}
                  onChange={(e) => setInvReason(e.target.value)}
                  placeholder="Restock batch #2026-04"
                  className="w-full border border-neutral-300 px-3 py-2"
                />
              </div>
              {invError && (
                <p role="alert" className="text-[11px] text-[#DC2626] bg-red-50 border border-red-200 px-3 py-2">
                  {invError}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setInvTarget(null);
                    setInvError('');
                  }}
                  className="px-4 py-2 border border-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#222222] text-white"
                >
                  {saving ? 'Saving...' : 'Commit Adjustment'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // Products Catalog Section
  return (
    <div className="space-y-4">
      <div className="bg-white border border-neutral-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products, SKU, category..."
            className="w-full pl-9 pr-3 py-2 border border-neutral-200 text-xs"
          />
        </div>

        {canWriteProducts && (
          <button
            type="button"
            onClick={() =>
              setEditingProduct({
                name: '',
                sku: `DEB-${Math.floor(100 + Math.random() * 899)}`,
                categoryName: categories[0]?.name || 'Stitched Suits',
                categoryId: categories[0]?.id || 'cat_stitched',
                collectionName: collections[0]?.name || '',
                price: 12500,
                costPrice: 7000,
                stockQuantity: 15,
                productType: 'Stitched',
                fabricDetails: 'Pure Luxury Pakistani Textile',
                status: 'Active',
                images: [IMG_ASSETS.prodChikankari],
                colors: [{ name: 'Ivory', hex: '#FAF8F3' }],
                sizes: ['S', 'M', 'L'],
                featured: false,
                newArrival: true,
                bestSeller: false,
                onSale: false,
              })
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#222222] text-white text-xs font-medium hover:bg-[#3A3A3A]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        )}
      </div>

      <div className="bg-white border border-neutral-200 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-600">
              <th className="py-3 px-4 font-medium">Product</th>
              <th className="py-3 px-4 font-medium">Category</th>
              <th className="py-3 px-4 font-medium text-right">Cost</th>
              <th className="py-3 px-4 font-medium text-right">Selling</th>
              <th className="py-3 px-4 font-medium text-right">Profit / Margin</th>
              <th className="py-3 px-4 font-medium text-right">Stock</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredProducts.map((p) => {
              const { sellingPrice, profit, marginPercent } = calculateProfitAndMargin(
                p.price,
                p.onSale ? p.salePrice : undefined,
                p.costPrice
              );
              return (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <SafeImage
                        src={p.images[0]}
                        alt={p.name}
                        className="w-9 h-11 object-cover bg-neutral-100 shrink-0"
                      />
                      <div>
                        <p className="font-medium text-neutral-900">{p.name}</p>
                        <p className="text-[11px] font-mono text-neutral-500">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-neutral-700">{p.categoryName}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-600">
                    {formatPKR(p.costPrice)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-neutral-900">
                    {formatPKR(sellingPrice)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-[#16A34A]">
                    {formatPKR(profit)} ({marginPercent}%)
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">{p.stockQuantity}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[11px] font-medium ${
                        p.status === 'Active'
                          ? 'text-[#16A34A]'
                          : p.status === 'Out of Stock'
                            ? 'text-[#DC2626]'
                            : 'text-neutral-500'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {canWriteProducts && (
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Edit ${p.name}`}
                          onClick={() => setEditingProduct(p)}
                          className="p-1.5 border border-neutral-200 hover:bg-neutral-100"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${p.name}`}
                          onClick={() => deleteProduct(p.id)}
                          className="p-1.5 border border-neutral-200 text-[#DC2626] hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white border border-neutral-200 max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="text-base font-semibold text-neutral-900">
                {editingProduct.id ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button type="button" onClick={() => setEditingProduct(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-600 mb-1">Product Name *</label>
                <input
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full border border-neutral-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">SKU *</label>
                <input
                  required
                  value={editingProduct.sku || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                  className="w-full border border-neutral-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Category *</label>
                <select
                  value={editingProduct.categoryName || ''}
                  onChange={(e) => {
                    const cat = categories.find((c) => c.name === e.target.value);
                    setEditingProduct({
                      ...editingProduct,
                      categoryName: e.target.value,
                      categoryId: cat?.id || 'cat_stitched',
                    });
                  }}
                  className="w-full border border-neutral-300 px-3 py-2 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Status</label>
                <select
                  value={editingProduct.status || 'Active'}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, status: e.target.value as ProductStatus })
                  }
                  className="w-full border border-neutral-300 px-3 py-2 bg-white"
                >
                  {(['Draft', 'Active', 'Out of Stock', 'Archived'] as ProductStatus[]).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Regular Price (PKR) *</label>
                <input
                  type="number"
                  required
                  value={editingProduct.price ?? 0}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  className="w-full border border-neutral-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Sale Price (PKR, optional)</label>
                <input
                  type="number"
                  value={editingProduct.salePrice ?? ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      salePrice: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full border border-neutral-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Cost Price (PKR - Admin Only)</label>
                <input
                  type="number"
                  value={editingProduct.costPrice ?? 0}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, costPrice: Number(e.target.value) })
                  }
                  className="w-full border border-neutral-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={editingProduct.stockQuantity ?? 0}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, stockQuantity: Number(e.target.value) })
                  }
                  className="w-full border border-neutral-300 px-3 py-2 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-600 mb-1">Image URL</label>
              <input
                value={editingProduct.images?.[0] || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, images: [e.target.value] })}
                className="w-full border border-neutral-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-neutral-600 mb-1">Fabric Details</label>
              <input
                value={editingProduct.fabricDetails || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, fabricDetails: e.target.value })}
                className="w-full border border-neutral-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-neutral-600 mb-1">Description</label>
              <textarea
                rows={3}
                value={editingProduct.description || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                className="w-full border border-neutral-300 px-3 py-2"
              />
            </div>

            <div className="flex flex-wrap gap-4 pt-1">
              {(
                [
                  ['featured', 'Featured'],
                  ['newArrival', 'New Arrival'],
                  ['bestSeller', 'Best Seller'],
                  ['onSale', 'On Sale'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct[key])}
                    onChange={(e) => setEditingProduct({ ...editingProduct, [key]: e.target.checked })}
                    className="accent-[#9D7B38]"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            {productError && (
              <p role="alert" className="text-[11px] text-[#DC2626] bg-red-50 border border-red-200 px-3 py-2">
                {productError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setProductError('');
                }}
                className="px-4 py-2 border border-neutral-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-[#222222] text-white font-medium"
              >
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
