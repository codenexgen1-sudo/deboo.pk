import type { Product } from '../types/ecommerce';
import { getEffectivePrice } from './commerce';
import { normalizeRoutePath } from './routeTransitions';

export const SEO_DEFAULTS = {
  siteName: 'Deboo.pk',
  defaultTitle: "Deboo.pk — Everything, But Better. | Luxury Pakistani Women's Fashion",
  defaultDescription:
    "Everything, But Better. Discover timeless Pakistani women's fashion at Deboo.pk — unstitched fabrics, stitched suits, seasonal collections, and accessories delivered across Pakistan.",
  defaultKeywords: [
    'Deboo.pk',
    "Pakistani women's fashion",
    'luxury unstitched lawn',
    'stitched 3-piece suits',
    'festive formals',
    'Karachi fashion house',
  ],
  defaultImage: '/src/assets/images/hero_atelier_luxury.jpg',
};

export interface SeoMetadataInput {
  title?: string;
  description?: string;
  keywords?: string[];
  pathname?: string;
  origin?: string;
  ogType?: 'website' | 'product' | 'article';
  image?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | null;
}

export interface ResolvedSeoMetadata {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  ogType: 'website' | 'product' | 'article';
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogSiteName: string;
  twitterCard: 'summary_large_image';
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  robots: 'index, follow' | 'noindex, nofollow';
  jsonLd: Record<string, unknown> | null;
}

export function sanitizeMetaText(text: string | undefined, maxLength = 160): string {
  const cleaned = (text || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  if (cleaned.length <= maxLength) return cleaned;
  const sliced = cleaned.slice(0, maxLength - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  const base = lastSpace > Math.floor(maxLength * 0.6) ? sliced.slice(0, lastSpace) : sliced;
  return `${base.trimEnd()}…`;
}

function resolveAbsoluteUrl(value: string, origin: string): string {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
    return value;
  }
  const normalizedOrigin = origin.replace(/\/+$/, '');
  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return normalizedOrigin ? `${normalizedOrigin}${normalizedPath}` : normalizedPath;
}

export function buildSeoMetadata(input: SeoMetadataInput = {}): ResolvedSeoMetadata {
  const origin = (input.origin || '').replace(/\/+$/, '');
  const cleanPath = normalizeRoutePath(input.pathname || '/');
  const title = sanitizeMetaText(input.title, 70) || SEO_DEFAULTS.defaultTitle;
  const description =
    sanitizeMetaText(input.description, 160) || SEO_DEFAULTS.defaultDescription;

  const keywordSet = new Set<string>(
    (input.keywords && input.keywords.length > 0 ? input.keywords : SEO_DEFAULTS.defaultKeywords)
      .map((k) => k.trim())
      .filter(Boolean)
  );
  const keywords = Array.from(keywordSet).join(', ');

  const canonicalUrl = origin ? `${origin}${cleanPath}` : cleanPath;
  const ogImage = resolveAbsoluteUrl(input.image || SEO_DEFAULTS.defaultImage, origin);
  const ogType = input.ogType || 'website';

  return {
    title,
    description,
    keywords,
    canonicalUrl,
    ogType,
    ogTitle: title,
    ogDescription: description,
    ogImage,
    ogSiteName: SEO_DEFAULTS.siteName,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: ogImage,
    robots: input.noIndex ? 'noindex, nofollow' : 'index, follow',
    jsonLd: input.jsonLd ?? null,
  };
}

export function buildProductSeoMetadata(
  product: Product,
  options: { origin?: string; pathname?: string } = {}
): ResolvedSeoMetadata {
  const origin = (options.origin || '').replace(/\/+$/, '');
  const pathname = options.pathname || `/product/${product.slug}`;
  const effectivePrice = getEffectivePrice(product);
  const isAvailable = product.stockQuantity > 0 && product.status === 'Active';

  const title =
    product.seoTitle?.trim() || `${product.name} — ${product.categoryName} | Deboo.pk`;
  const rawDescription =
    product.seoDescription?.trim() ||
    product.shortDescription?.trim() ||
    product.description?.trim() ||
    `${product.name} in ${product.fabricDetails || product.categoryName} crafted by Deboo.pk.`;

  const keywords: string[] = [
    ...(product.metaKeywords || []),
    ...(product.tags || []),
    product.categoryName,
    product.collectionName,
    'Deboo.pk',
  ].filter((k): k is string => Boolean(k && k.trim()));

  const primaryImage = resolveAbsoluteUrl(
    product.images[0] || SEO_DEFAULTS.defaultImage,
    origin
  );
  const canonicalUrl = origin ? `${origin}${normalizeRoutePath(pathname)}` : normalizeRoutePath(pathname);

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    description: sanitizeMetaText(rawDescription, 220),
    category: product.categoryName,
    brand: {
      '@type': 'Brand',
      name: product.brand || SEO_DEFAULTS.siteName,
    },
    image: product.images.map((img) => resolveAbsoluteUrl(img, origin)).filter(Boolean),
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'PKR',
      price: effectivePrice,
      availability: isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return buildSeoMetadata({
    title,
    description: rawDescription,
    keywords,
    pathname,
    origin,
    ogType: 'product',
    image: primaryImage,
    noIndex: product.status === 'Draft' || product.status === 'Archived',
    jsonLd,
  });
}

export function buildRouteSeoMetadata(
  pathname: string,
  origin = ''
): ResolvedSeoMetadata {
  const cleanPath = normalizeRoutePath(pathname);

  const staticRoutes: Record<string, Omit<SeoMetadataInput, 'pathname' | 'origin'>> = {
    '/': {
      title: "Deboo.pk — Everything, But Better. | Luxury Pakistani Women's Fashion",
      description:
        "Everything, But Better. Discover timeless Pakistani women's fashion at Deboo.pk — unstitched lawn, stitched 3-piece suits, festive formals, and accessories dispatched from Karachi.",
    },
    '/shop': {
      title: 'All Luxury Apparel | Deboo.pk',
      description:
        'Browse Deboo.pk unstitched 3-piece suits, ready-to-wear silk ensembles, winter velvet, and handcrafted accessories with nationwide delivery across Pakistan.',
    },
    '/new-arrivals': {
      title: 'New Arrivals | Deboo.pk',
      description:
        'Explore the latest seasonal Pakistani womenswear arrivals from Deboo.pk — fresh unstitched lawn, raw silk, and festive couture.',
    },
    '/best-sellers': {
      title: 'Best Sellers | Deboo.pk',
      description:
        'Shop our most requested embroidered suits, chikankari ensembles, and hand-worked zardozi potlis loved across Karachi, Lahore, and Islamabad.',
    },
    '/sale': {
      title: 'Seasonal Offers | Deboo.pk',
      description:
        'Limited seasonal privileges on signature Deboo.pk stitched suits, unstitched fabric sets, and handcrafted festive accessories.',
    },
    '/collections': {
      title: 'Curated Collections | Deboo.pk',
      description:
        'Discover Deboo.pk signature lines including Signature Silk, Winter Velvet, Noor Couture, and Aurelia Chikankari.',
    },
    '/wishlist': {
      title: 'Saved Wishlist | Deboo.pk',
      description: 'Your curated Deboo.pk fashion wishlist saved for effortless shopping.',
      noIndex: true,
    },
    '/cart': {
      title: 'Shopping Bag | Deboo.pk',
      description: 'Review your selected luxury fashion pieces before tracked Pakistan checkout.',
      noIndex: true,
    },
    '/checkout': {
      title: 'Secure Checkout | Deboo.pk',
      description:
        'Complete your Deboo.pk order with Cash on Delivery, Easypaisa, JazzCash, or Direct Bank Transfer.',
      noIndex: true,
    },
    '/track-order': {
      title: 'Track Your Shipment | Deboo.pk',
      description:
        'Track your Deboo.pk parcel dispatched from our Karachi warehouse via TCS and Leopards nationwide courier.',
    },
    '/about': {
      title: 'About Deboo.pk | Karachi Luxury Fashion House',
      description:
        'Learn about Deboo.pk — a contemporary Pakistani women’s luxury fashion label crafting heirloom textiles and tailored silhouettes in Karachi.',
    },
    '/contact': {
      title: 'Contact Us | Deboo.pk Client Concierge',
      description:
        'Reach the Deboo.pk Karachi client concierge via WhatsApp, email, or inquiry form for sizing, orders, and styling assistance.',
    },
    '/faq': {
      title: 'Frequently Asked Questions | Deboo.pk',
      description:
        'Answers about Deboo.pk Karachi dispatch times, nationwide courier delivery, Cash on Delivery, digital payments, and 7-day exchanges.',
    },
    '/shipping-policy': {
      title: 'Shipping Policy | Deboo.pk',
      description:
        'Karachi warehouse dispatch timelines, nationwide TCS & Leopards courier rates, and complimentary shipping thresholds across Pakistan.',
    },
    '/return-policy': {
      title: 'Return & Exchange Policy | Deboo.pk',
      description:
        'Review Deboo.pk’s 7-day effortless exchange and return policy for unworn garments with original tags intact.',
    },
    '/privacy-policy': {
      title: 'Privacy Policy | Deboo.pk',
      description:
        'How Deboo.pk safeguards customer order records, addresses, and consent-based analytics.',
    },
    '/terms': {
      title: 'Terms & Conditions | Deboo.pk',
      description:
        'Terms of purchase, PKR pricing, inventory verification, and nationwide courier fulfillment at Deboo.pk.',
    },
    '/login': {
      title: 'Sign In | Deboo.pk',
      description: 'Sign in to your Deboo.pk client account for order history and saved addresses.',
      noIndex: true,
    },
    '/register': {
      title: 'Create Account | Deboo.pk',
      description: 'Create a Deboo.pk account for tracked orders, wishlist sync, and address book.',
      noIndex: true,
    },
    '/verify-email': {
      title: 'Verify Email | Deboo.pk',
      description: 'Verify your email address to activate your Deboo.pk client account.',
      noIndex: true,
    },
    '/forgot-password': {
      title: 'Reset Password | Deboo.pk',
      description: 'Request a password reset link for your Deboo.pk client account.',
      noIndex: true,
    },
    '/account': {
      title: 'My Account | Deboo.pk',
      description: 'Manage your Deboo.pk orders, saved addresses, profile, and curated wishlist.',
      noIndex: true,
    },
    '/orders': {
      title: 'My Orders | Deboo.pk',
      description: 'View your Deboo.pk order history and live Pakistan courier tracking milestones.',
      noIndex: true,
    },
  };

  if (cleanPath in staticRoutes) {
    return buildSeoMetadata({ ...staticRoutes[cleanPath], pathname: cleanPath, origin });
  }

  if (cleanPath.startsWith('/categories/')) {
    const slug = decodeURIComponent(cleanPath.slice('/categories/'.length)).replace(/-/g, ' ');
    const formatted = slug.replace(/\b\w/g, (c) => c.toUpperCase());
    return buildSeoMetadata({
      title: `${formatted} | Deboo.pk`,
      description: `Shop ${formatted} at Deboo.pk — luxury Pakistani womenswear dispatched nationwide from Karachi.`,
      pathname: cleanPath,
      origin,
    });
  }

  if (cleanPath.startsWith('/product/')) {
    const slug = decodeURIComponent(cleanPath.slice('/product/'.length)).replace(/-/g, ' ');
    const formatted = slug.replace(/\b\w/g, (c) => c.toUpperCase());
    return buildSeoMetadata({
      title: `${formatted} | Deboo.pk`,
      description: `View details, fabric craftsmanship, sizing, and pricing for ${formatted} at Deboo.pk.`,
      pathname: cleanPath,
      origin,
      ogType: 'product',
    });
  }

  if (cleanPath.startsWith('/admin')) {
    return buildSeoMetadata({
      title: 'Executive Console | Deboo.pk',
      description: 'Restricted administrative console for Deboo.pk catalog, orders, and analytics.',
      pathname: cleanPath,
      origin,
      noIndex: true,
    });
  }

  return buildSeoMetadata({
    title: 'Page Not Found | Deboo.pk',
    description: 'The Deboo.pk collection or page you requested could not be found.',
    pathname: cleanPath,
    origin,
    noIndex: true,
  });
}
