import React, { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { SafeImage } from '../components/SafeImage';
import { ProductGridSkeleton } from '../components/SkeletonLoader';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { useSeoMetadata } from '../hooks/useSeoMetadata';
import { filterAndSortProducts, formatPKR, type ProductFilterOptions } from '../utils/commerce';

interface ShopPageProps {
  mode?: 'all' | 'new' | 'best' | 'sale' | 'collections' | 'category' | 'search';
  categorySlug?: string;
}

export const ShopPage: React.FC<ShopPageProps> = ({ mode = 'all', categorySlug }) => {
  const { searchParams, navigate } = useRouter();
  const { products, categories, collections, catalogLoading } = useStore();

  const initialQuery = searchParams.get('q') || '';
  const initialCol = searchParams.get('collection') || 'all';

  const [selectedCategory, setSelectedCategory] = useState(categorySlug || 'all');
  const [selectedCollection, setSelectedCollection] = useState(initialCol);
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [maxPrice, setMaxPrice] = useState<number>(60000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<ProductFilterOptions['sortBy']>(
    mode === 'new' ? 'newest' : mode === 'best' ? 'bestselling' : 'featured'
  );
  const [localSearch, setLocalSearch] = useState(initialQuery);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setSelectedCategory(categorySlug || 'all');
  }, [categorySlug]);

  useEffect(() => {
    setLocalSearch(searchParams.get('q') || '');
    const colParam = searchParams.get('collection');
    if (colParam) setSelectedCollection(colParam);
  }, [searchParams]);

  const activeCategory = useMemo(
    () => (categorySlug ? categories.find((c) => c.slug === categorySlug) : undefined),
    [categorySlug, categories]
  );

  const pageHeading = useMemo(() => {
    if (mode === 'new') return 'New Arrivals';
    if (mode === 'best') return 'Best Sellers';
    if (mode === 'sale') return 'Seasonal Offers';
    if (mode === 'collections') return 'Curated Collections';
    if (mode === 'search') return localSearch ? `Search: "${localSearch}"` : 'Search Catalog';
    if (mode === 'category' && categorySlug) {
      return activeCategory ? activeCategory.name : 'Category Collection';
    }
    return 'All Luxury Apparel';
  }, [mode, categorySlug, activeCategory, localSearch]);

  const seoDescription = useMemo(() => {
    if (mode === 'category' && activeCategory?.description) {
      return `${activeCategory.name} by Deboo.pk — ${activeCategory.description}`;
    }
    if (mode === 'search' && localSearch) {
      return `Search results for "${localSearch}" at Deboo.pk — luxury Pakistani unstitched, stitched suits, and accessories.`;
    }
    return `Browse ${pageHeading} at Deboo.pk — luxury Pakistani unstitched & stitched suits dispatched nationwide from Karachi.`;
  }, [mode, activeCategory, localSearch, pageHeading]);

  useSeoMetadata({
    title: `${pageHeading} | Deboo.pk`,
    description: seoDescription,
    keywords: [pageHeading, 'Deboo.pk', 'Pakistani women fashion', 'Karachi couture'],
    image: activeCategory?.image,
    noIndex: mode === 'search',
  });

  const allColors = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.colors.forEach((c) => set.add(c.name)));
    return Array.from(set);
  }, [products]);

  const allSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.sizes.forEach((s) => set.add(s)));
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return filterAndSortProducts(products, {
      categorySlug: selectedCategory,
      collectionSlug: selectedCollection,
      searchQuery: localSearch,
      color: selectedColor,
      size: selectedSize,
      maxPrice,
      onlyNewArrivals: mode === 'new',
      onlyBestSellers: mode === 'best',
      onlySale: mode === 'sale',
      inStockOnly,
      sortBy,
    });
  }, [
    products,
    selectedCategory,
    selectedCollection,
    localSearch,
    selectedColor,
    selectedSize,
    maxPrice,
    mode,
    inStockOnly,
    sortBy,
  ]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedCollection('all');
    setSelectedColor('all');
    setSelectedSize('all');
    setMaxPrice(60000);
    setInStockOnly(false);
    setLocalSearch('');
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Title */}
      <div className="border-b border-[#E8DCC3] pb-8 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9D7B38]">Deboo.pk Catalogue</p>
          <h1 className="font-serif text-4xl text-[#222222] mt-1">{pageHeading}</h1>
          <p className="text-sm text-[#777777] mt-2 tabular-nums">
            Showing {filteredProducts.length} handcrafted {filteredProducts.length === 1 ? 'piece' : 'pieces'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2 border border-[#E8DCC3] bg-white text-xs uppercase tracking-[0.14em]"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <label htmlFor="shop-sort" className="sr-only">
            Sort products
          </label>
          <select
            id="shop-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ProductFilterOptions['sortBy'])}
            className="bg-white border border-[#E8DCC3] px-3.5 py-2 text-xs uppercase tracking-[0.12em] text-[#222222] focus:outline-none focus:border-[#C8A45D]"
          >
            <option value="featured">Sort: Featured</option>
            <option value="newest">Sort: Newest</option>
            <option value="bestselling">Sort: Best Selling</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Collections Editorial Row when in /collections */}
      {mode === 'collections' && (
        <section className="mb-14 grid grid-cols-1 md:grid-cols-2 gap-6">
          {collections.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => setSelectedCollection(col.slug)}
              className={`text-left group bg-white border transition-colors overflow-hidden flex flex-col sm:flex-row ${
                selectedCollection === col.slug ? 'border-[#C8A45D]' : 'border-[#E8DCC3]'
              }`}
            >
              <div className="sm:w-48 h-48 sm:h-auto bg-[#F3EFE6] shrink-0 overflow-hidden">
                <SafeImage
                  src={col.image}
                  alt={col.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex flex-col justify-center">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#9D7B38]">{col.season}</p>
                <h2 className="font-serif text-2xl text-[#222222] mt-1">{col.name}</h2>
                <p className="text-sm text-[#777777] mt-2 line-clamp-2">{col.description}</p>
              </div>
            </button>
          ))}
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Filters */}
        <aside
          className={`lg:col-span-3 space-y-6 ${
            mobileFiltersOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="bg-white border border-[#E8DCC3] p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E8DCC3] pb-3">
              <h2 className="font-serif text-lg text-[#222222]">Refine Selection</h2>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-[#9D7B38] hover:underline inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <div>
              <label htmlFor="filter-search" className="block text-xs uppercase tracking-[0.14em] text-[#777777] mb-2">
                Keyword / SKU
              </label>
              <input
                id="filter-search"
                type="search"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Silk, Lawn, Zardozi..."
                className="w-full border border-[#E8DCC3] px-3 py-2 text-sm bg-[#FAF8F3] focus:outline-none focus:border-[#C8A45D]"
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[#777777] mb-2">Category</p>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`block w-full text-left text-sm py-1 ${
                    selectedCategory === 'all' ? 'text-[#9D7B38] font-semibold' : 'text-[#222222]'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`block w-full text-left text-sm py-1 ${
                      selectedCategory === cat.slug ? 'text-[#9D7B38] font-semibold' : 'text-[#222222]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[#777777] mb-2">Collection</p>
              <select
                aria-label="Filter by collection"
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="w-full border border-[#E8DCC3] px-3 py-2 text-sm bg-white"
              >
                <option value="all">All Collections</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.slug}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[#777777] mb-2">Size</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedSize('all')}
                  className={`px-2.5 py-1 text-xs border ${
                    selectedSize === 'all'
                      ? 'bg-[#222222] text-white border-[#222222]'
                      : 'border-[#E8DCC3] text-[#222222]'
                  }`}
                >
                  All
                </button>
                {allSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`px-2.5 py-1 text-xs border ${
                      selectedSize === size
                        ? 'bg-[#222222] text-white border-[#222222]'
                        : 'border-[#E8DCC3] text-[#222222]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[#777777] mb-2">Color</p>
              <select
                aria-label="Filter by color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full border border-[#E8DCC3] px-3 py-2 text-sm bg-white"
              >
                <option value="all">All Colors</option>
                {allColors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-[#777777] mb-2">
                <span>Max Price</span>
                <span className="tabular-nums text-[#222222] font-medium">{formatPKR(maxPrice)}</span>
              </div>
              <input
                aria-label="Maximum price filter"
                type="range"
                min={5000}
                max={60000}
                step={1000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#C8A45D]"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-[#222222] cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-[#222222]"
              />
              <span>In stock only</span>
            </label>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-9">
          {catalogLoading ? (
            <ProductGridSkeleton count={6} columns={3} label="Loading luxury catalog" />
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white border border-[#E8DCC3] p-12 text-center">
              <p className="font-serif text-2xl text-[#222222]">No matching pieces found</p>
              <p className="text-sm text-[#777777] mt-2 mb-6">
                Try clearing a filter or exploring our full curated collection.
              </p>
              <button
                type="button"
                onClick={() => {
                  resetFilters();
                  navigate('/shop');
                }}
                className="px-6 py-2.5 bg-[#222222] text-white text-xs uppercase tracking-[0.16em]"
              >
                Show All Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
