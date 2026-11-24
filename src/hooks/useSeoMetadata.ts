import { useEffect, useMemo } from 'react';
import { useRouter } from '../context/RouterContext';
import type { Product } from '../types/ecommerce';
import {
  buildProductSeoMetadata,
  buildSeoMetadata,
  type ResolvedSeoMetadata,
  type SeoMetadataInput,
} from '../utils/seo';

export interface UseSeoMetadataOptions extends SeoMetadataInput {
  product?: Product | null;
  enabled?: boolean;
}

function upsertMetaTag(attrName: 'name' | 'property', attrValue: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonicalLink(href: string) {
  if (typeof document === 'undefined' || !href) return;
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertDynamicJsonLd(jsonLd: Record<string, unknown> | null) {
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector<HTMLScriptElement>(
    'script[type="application/ld+json"][data-deboo-dynamic-seo="true"]'
  );

  if (!jsonLd) {
    if (existing) existing.remove();
    return;
  }

  const script = existing || document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-deboo-dynamic-seo', 'true');
  script.textContent = JSON.stringify(jsonLd);
  if (!existing) {
    document.head.appendChild(script);
  }
}

export function applySeoMetadataToDocument(meta: ResolvedSeoMetadata) {
  if (typeof document === 'undefined') return;

  document.title = meta.title;

  upsertMetaTag('name', 'description', meta.description);
  upsertMetaTag('name', 'keywords', meta.keywords);
  upsertMetaTag('name', 'robots', meta.robots);

  upsertMetaTag('property', 'og:type', meta.ogType);
  upsertMetaTag('property', 'og:site_name', meta.ogSiteName);
  upsertMetaTag('property', 'og:title', meta.ogTitle);
  upsertMetaTag('property', 'og:description', meta.ogDescription);
  if (meta.canonicalUrl) upsertMetaTag('property', 'og:url', meta.canonicalUrl);
  if (meta.ogImage) upsertMetaTag('property', 'og:image', meta.ogImage);

  upsertMetaTag('name', 'twitter:card', meta.twitterCard);
  upsertMetaTag('name', 'twitter:title', meta.twitterTitle);
  upsertMetaTag('name', 'twitter:description', meta.twitterDescription);
  if (meta.twitterImage) upsertMetaTag('name', 'twitter:image', meta.twitterImage);

  upsertCanonicalLink(meta.canonicalUrl);
  upsertDynamicJsonLd(meta.jsonLd);
}

/**
 * Dynamically synchronizes document.title, meta description, keywords, robots,
 * canonical URL, OpenGraph/Twitter social cards, and Schema.org JSON-LD.
 */
export function useSeoMetadata(options: UseSeoMetadataOptions | null) {
  const { pathname } = useRouter();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const enabled = options?.enabled ?? true;
  const product = options?.product;
  const title = options?.title;
  const description = options?.description;
  const ogType = options?.ogType;
  const image = options?.image;
  const noIndex = options?.noIndex;
  const targetPath = options?.pathname ?? pathname;
  const keywordsKey = options?.keywords ? options.keywords.join('|') : '';
  const jsonLdKey = options?.jsonLd ? JSON.stringify(options.jsonLd) : '';

  const resolved = useMemo(() => {
    if (!enabled || !options) return null;
    if (product) {
      return buildProductSeoMetadata(product, { origin, pathname: targetPath });
    }
    return buildSeoMetadata({
      title,
      description,
      keywords: keywordsKey ? keywordsKey.split('|') : undefined,
      pathname: targetPath,
      origin,
      ogType,
      image,
      noIndex,
      jsonLd: jsonLdKey ? (JSON.parse(jsonLdKey) as Record<string, unknown>) : null,
    });
  }, [
    enabled,
    options,
    product,
    origin,
    targetPath,
    title,
    description,
    keywordsKey,
    ogType,
    image,
    noIndex,
    jsonLdKey,
  ]);

  useEffect(() => {
    if (!resolved) return;
    applySeoMetadataToDocument(resolved);
  }, [resolved]);

  return resolved;
}
