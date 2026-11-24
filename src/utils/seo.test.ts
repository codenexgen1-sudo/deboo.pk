import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_PRODUCTS } from '../data/seedCatalog';
import {
  buildProductSeoMetadata,
  buildRouteSeoMetadata,
  buildSeoMetadata,
  sanitizeMetaText,
} from './seo';

test('sanitizeMetaText collapses whitespace and truncates cleanly at word boundaries', () => {
  assert.equal(sanitizeMetaText('  Silk   couture \n from  Karachi  '), 'Silk couture from Karachi');

  const longText =
    'Discover hand-embroidered zardozi raw silk ensembles tailored in our Karachi atelier with complimentary tracked nationwide shipping across Pakistan and bespoke finishes.';
  const truncated = sanitizeMetaText(longText, 100);
  assert.ok(truncated.length <= 100);
  assert.ok(truncated.endsWith('…'));
});

test('buildSeoMetadata resolves canonical URL, OpenGraph, Twitter, and robots cleanly', () => {
  const meta = buildSeoMetadata({
    title: 'Curated Collections | Deboo.pk',
    description: 'Explore Signature Silk and Winter Velvet couture.',
    pathname: '/collections/',
    origin: 'https://deboo.pk/',
    keywords: ['Signature Silk', 'Winter Velvet', 'Deboo.pk'],
  });

  assert.equal(meta.title, 'Curated Collections | Deboo.pk');
  assert.equal(meta.canonicalUrl, 'https://deboo.pk/collections');
  assert.equal(meta.ogTitle, 'Curated Collections | Deboo.pk');
  assert.equal(meta.twitterCard, 'summary_large_image');
  assert.equal(meta.robots, 'index, follow');
  assert.ok(meta.keywords.includes('Signature Silk'));
});

test('buildProductSeoMetadata honors product seo fields, effective PKR price, and Schema.org Product JSON-LD', () => {
  const saleProduct = SEED_PRODUCTS.find((p) => p.onSale && p.salePrice);
  assert.ok(saleProduct, 'expected a seeded product on sale');

  const meta = buildProductSeoMetadata(saleProduct, {
    origin: 'https://deboo.pk',
    pathname: `/product/${saleProduct.slug}`,
  });

  assert.equal(meta.ogType, 'product');
  assert.equal(meta.canonicalUrl, `https://deboo.pk/product/${saleProduct.slug}`);
  assert.equal(meta.robots, 'index, follow');
  assert.ok(meta.jsonLd);
  assert.equal(meta.jsonLd['@type'], 'Product');
  assert.equal(meta.jsonLd.sku, saleProduct.sku);

  const offers = meta.jsonLd.offers as Record<string, unknown>;
  assert.equal(offers.priceCurrency, 'PKR');
  assert.equal(offers.price, saleProduct.salePrice);
  assert.equal(offers.availability, 'https://schema.org/InStock');
});

test('buildProductSeoMetadata marks Draft or Out-of-Stock products accurately', () => {
  const base = SEED_PRODUCTS[0];
  const draftOutProduct = {
    ...base,
    status: 'Draft' as const,
    stockQuantity: 0,
    seoTitle: undefined,
    seoDescription: undefined,
  };

  const meta = buildProductSeoMetadata(draftOutProduct, { origin: 'https://deboo.pk' });
  assert.equal(meta.robots, 'noindex, nofollow');
  assert.ok(meta.title.includes(base.name));

  const offers = (meta.jsonLd?.offers || {}) as Record<string, unknown>;
  assert.equal(offers.availability, 'https://schema.org/OutOfStock');
});

test('buildRouteSeoMetadata marks private/checkout/admin routes noindex while indexing public catalog pages', () => {
  assert.equal(buildRouteSeoMetadata('/shop', 'https://deboo.pk').robots, 'index, follow');
  assert.equal(buildRouteSeoMetadata('/checkout', 'https://deboo.pk').robots, 'noindex, nofollow');
  assert.equal(buildRouteSeoMetadata('/admin', 'https://deboo.pk').robots, 'noindex, nofollow');
  assert.equal(buildRouteSeoMetadata('/unknown-route', 'https://deboo.pk').robots, 'noindex, nofollow');
});
