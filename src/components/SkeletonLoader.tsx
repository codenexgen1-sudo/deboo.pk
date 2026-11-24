import React from 'react';

interface SkeletonBlockProps {
  className?: string;
}

/**
 * Atomic GPU-composited shimmer block styled in Deboo.pk's warm ivory & champagne palette.
 */
export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`relative overflow-hidden bg-[#EFEAE0] ${className}`}
  >
    <div
      className="deboo-shimmer-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#FAF8F3]/80 to-transparent will-change-transform"
    />
  </div>
);

/**
 * Structural twin of ProductCard to eliminate layout shift during catalog loading.
 */
export const ProductCardSkeleton: React.FC = () => (
  <div
    aria-hidden="true"
    className="flex flex-col bg-white border border-[#E8DCC3]/70"
  >
    <div className="relative aspect-[3/4] bg-[#F3EFE6] overflow-hidden">
      <SkeletonBlock className="w-full h-full" />
      <div className="absolute top-3 left-3 w-12 h-6 bg-[#FAF8F3]/75" />
      <div className="absolute top-3 right-3 w-9 h-9 bg-[#FAF8F3]/75" />
    </div>
    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
      <div className="space-y-2">
        <SkeletonBlock className="h-3 w-2/3" />
        <SkeletonBlock className="h-5 w-full" />
        <SkeletonBlock className="h-5 w-3/4" />
      </div>
      <div className="pt-1 flex items-center gap-2.5">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-3.5 w-16" />
      </div>
    </div>
  </div>
);

interface ProductGridSkeletonProps {
  count?: number;
  columns?: 2 | 3 | 4;
  label?: string;
}

export const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({
  count = 6,
  columns = 3,
  label = 'Loading curated silhouettes',
}) => {
  const gridColsClass =
    columns === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={`grid ${gridColsClass} gap-6`}
    >
      <span className="sr-only">{label}...</span>
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  );
};

export type PageSkeletonVariant =
  | 'home'
  | 'catalog'
  | 'product-detail'
  | 'tracking'
  | 'account'
  | 'default';

interface PageContentSkeletonProps {
  variant?: PageSkeletonVariant;
  label?: string;
}

/**
 * Global page-level skeleton loader matched to Deboo.pk's storefront & portal archetypes.
 */
export const PageContentSkeleton: React.FC<PageContentSkeletonProps> = ({
  variant = 'default',
  label = 'Loading Deboo.pk atelier content',
}) => {
  if (variant === 'home') {
    return (
      <main role="status" aria-busy="true" aria-label={label}>
        <span className="sr-only">{label}...</span>
        {/* Hero campaign skeleton */}
        <section className="relative bg-[#EAE4D7] h-[540px] sm:h-[620px] lg:h-[680px] overflow-hidden border-b border-[#E8DCC3]">
          <div className="deboo-shimmer-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#FAF8F3]/45 to-transparent will-change-transform" />
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
            <div className="max-w-xl space-y-4">
              <div className="h-3.5 w-48 bg-[#D8CEBA]" />
              <div className="h-12 sm:h-14 w-full bg-[#D8CEBA]" />
              <div className="h-12 sm:h-14 w-3/4 bg-[#D8CEBA]" />
              <div className="h-4 w-80 bg-[#DFD7C6]" />
              <div className="pt-4 flex gap-4">
                <div className="h-12 w-44 bg-[#C8A45D]/45" />
                <div className="h-12 w-44 bg-[#FAF8F3]/80 border border-[#D8CEBA]" />
              </div>
            </div>
          </div>
        </section>

        {/* Category cards skeleton */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-32" />
              <SkeletonBlock className="h-9 w-64" />
            </div>
            <SkeletonBlock className="h-4 w-36" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-white border border-[#E8DCC3]/70 overflow-hidden">
                <SkeletonBlock className="aspect-[4/3] w-full" />
                <div className="p-5 space-y-2">
                  <SkeletonBlock className="h-5 w-32" />
                  <SkeletonBlock className="h-3.5 w-full" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Product showcase grid skeleton */}
        <section className="bg-white border-y border-[#E8DCC3]/70 py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div className="space-y-2">
                <SkeletonBlock className="h-3 w-36" />
                <SkeletonBlock className="h-9 w-56" />
              </div>
              <SkeletonBlock className="h-10 w-80" />
            </div>
            <ProductGridSkeleton count={6} columns={3} label={label} />
          </div>
        </section>
      </main>
    );
  }

  if (variant === 'catalog') {
    return (
      <main
        role="status"
        aria-busy="true"
        aria-label={label}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <span className="sr-only">{label}...</span>
        <div className="border-b border-[#E8DCC3] pb-8 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-36" />
            <SkeletonBlock className="h-10 w-72" />
            <SkeletonBlock className="h-4 w-48" />
          </div>
          <SkeletonBlock className="h-10 w-44" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3 hidden lg:block">
            <div className="bg-white border border-[#E8DCC3] p-5 space-y-6">
              <SkeletonBlock className="h-6 w-36" />
              <SkeletonBlock className="h-10 w-full" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <SkeletonBlock key={idx} className="h-4 w-3/4" />
                ))}
              </div>
              <SkeletonBlock className="h-10 w-full" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <SkeletonBlock key={idx} className="h-7 w-10" />
                ))}
              </div>
            </div>
          </aside>
          <div className="lg:col-span-9">
            <ProductGridSkeleton count={6} columns={3} label={label} />
          </div>
        </div>
      </main>
    );
  }

  if (variant === 'product-detail') {
    return (
      <main
        role="status"
        aria-busy="true"
        aria-label={label}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
      >
        <span className="sr-only">{label}...</span>
        <SkeletonBlock className="h-4 w-64 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-3">
            <SkeletonBlock className="aspect-[3/4] w-full" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <SkeletonBlock key={idx} className="aspect-[3/4] w-full" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3 border-b border-[#E8DCC3] pb-6">
              <SkeletonBlock className="h-3.5 w-48" />
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-7 w-32" />
            </div>
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-5/6" />
            </div>
            <div className="space-y-3">
              <SkeletonBlock className="h-4 w-28" />
              <div className="flex gap-2">
                <SkeletonBlock className="h-10 w-28" />
                <SkeletonBlock className="h-10 w-28" />
              </div>
            </div>
            <div className="space-y-3">
              <SkeletonBlock className="h-4 w-24" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <SkeletonBlock key={idx} className="h-10 w-12" />
                ))}
              </div>
            </div>
            <SkeletonBlock className="h-12 w-full" />
            <SkeletonBlock className="h-12 w-full" />
          </div>
        </div>
      </main>
    );
  }

  if (variant === 'tracking') {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label={label}
        className="bg-white border border-[#E8DCC3] p-6 sm:p-8 space-y-8"
      >
        <span className="sr-only">{label}...</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-[#E8DCC3]">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="space-y-2">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-5 w-28" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <SkeletonBlock className="w-7 h-7 shrink-0" />
              <SkeletonBlock className="h-4 w-48" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'account') {
    return (
      <main
        role="status"
        aria-busy="true"
        aria-label={label}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8"
      >
        <span className="sr-only">{label}...</span>
        <div className="border-b border-[#E8DCC3] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-36" />
            <SkeletonBlock className="h-10 w-64" />
          </div>
          <SkeletonBlock className="h-9 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-[#E8DCC3] p-6 space-y-3">
              <SkeletonBlock className="h-3 w-28" />
              <SkeletonBlock className="h-8 w-20" />
            </div>
          ))}
        </div>
        <div className="bg-white border border-[#E8DCC3] p-6 space-y-4">
          <SkeletonBlock className="h-6 w-48" />
          {Array.from({ length: 3 }).map((_, idx) => (
            <SkeletonBlock key={idx} className="h-14 w-full" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main
      role="status"
      aria-busy="true"
      aria-label={label}
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8"
    >
      <span className="sr-only">{label}...</span>
      <div className="space-y-3 border-b border-[#E8DCC3] pb-6">
        <SkeletonBlock className="h-3 w-32" />
        <SkeletonBlock className="h-10 w-80" />
      </div>
      <div className="space-y-4">
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-11/12" />
        <SkeletonBlock className="h-4 w-3/4" />
      </div>
    </main>
  );
};
