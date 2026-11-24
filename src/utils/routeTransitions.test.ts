import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getNavigationDirection,
  getRouteRank,
  normalizeRoutePath,
} from './routeTransitions';

test('normalizeRoutePath strips trailing slashes cleanly', () => {
  assert.equal(normalizeRoutePath('/'), '/');
  assert.equal(normalizeRoutePath('/shop/'), '/shop');
  assert.equal(normalizeRoutePath('/product/noor-suit///'), '/product/noor-suit');
});

test('getRouteRank places storefront browsing, product details, bag, and checkout in progressive order', () => {
  assert.ok(getRouteRank('/') < getRouteRank('/shop'));
  assert.ok(getRouteRank('/shop') < getRouteRank('/categories/bridal'));
  assert.ok(getRouteRank('/categories/bridal') < getRouteRank('/product/noor-suit'));
  assert.ok(getRouteRank('/product/noor-suit') < getRouteRank('/cart'));
  assert.ok(getRouteRank('/cart') < getRouteRank('/checkout'));
});

test('getNavigationDirection returns forward (1) when drilling deeper and backward (-1) when returning', () => {
  assert.equal(getNavigationDirection('/', '/shop'), 1);
  assert.equal(getNavigationDirection('/shop', '/product/noor-suit'), 1);
  assert.equal(getNavigationDirection('/cart', '/checkout'), 1);

  assert.equal(getNavigationDirection('/product/noor-suit', '/shop'), -1);
  assert.equal(getNavigationDirection('/checkout', '/cart'), -1);
  assert.equal(getNavigationDirection('/sale', '/'), -1);
});
