export type TransitionDirection = 1 | -1;

const ROUTE_RANKS: Record<string, number> = {
  '/': 0,
  '/shop': 1,
  '/categories': 1,
  '/new-arrivals': 2,
  '/collections': 3,
  '/best-sellers': 4,
  '/sale': 5,
  '/search': 6,
  '/wishlist': 8,
  '/cart': 9,
  '/checkout': 10,
  '/login': 11,
  '/register': 11,
  '/verify-email': 12,
  '/forgot-password': 12,
  '/account': 13,
  '/orders': 14,
  '/track-order': 15,
  '/about': 16,
  '/contact': 17,
  '/faq': 18,
  '/shipping-policy': 19,
  '/return-policy': 20,
  '/privacy-policy': 21,
  '/terms': 22,
};

export function normalizeRoutePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function getRouteRank(pathname: string): number {
  const clean = normalizeRoutePath(pathname);
  if (clean in ROUTE_RANKS) {
    return ROUTE_RANKS[clean];
  }
  if (clean.startsWith('/categories/')) return 6;
  if (clean.startsWith('/product/')) return 7;
  if (clean.startsWith('/admin')) return 30;
  return 25;
}

export function getNavigationDirection(
  fromPathname: string,
  toPathname: string
): TransitionDirection {
  const fromClean = normalizeRoutePath(fromPathname);
  const toClean = normalizeRoutePath(toPathname);

  if (fromClean === toClean) return 1;

  const fromRank = getRouteRank(fromClean);
  const toRank = getRouteRank(toClean);

  if (toRank !== fromRank) {
    return toRank > fromRank ? 1 : -1;
  }

  return toClean.localeCompare(fromClean) >= 0 ? 1 : -1;
}
