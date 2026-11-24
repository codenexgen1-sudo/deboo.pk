import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Trust proxy headers in Cloud Run / reverse-proxy environments
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));

// Security headers (iframe-compatible: never set X-Frame-Options)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Simple in-memory rate limiter for /api/* routes
const rateBucket = new Map<string, { count: number; resetAt: number }>();
app.use('/api', (req, res, next) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const entry = rateBucket.get(ip);
  if (!entry || now > entry.resetAt) {
    rateBucket.set(ip, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  if (entry.count >= 120) {
    return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
  }
  entry.count += 1;
  return next();
});

// SEO: robots.txt
app.get('/robots.txt', (req, res) => {
  const origin = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /account',
      'Disallow: /checkout',
      `Sitemap: ${origin}/sitemap.xml`,
    ].join('\n')
  );
});

// SEO: Dynamic XML Sitemap
app.get('/sitemap.xml', (req, res) => {
  const origin = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const routes = [
    '/',
    '/shop',
    '/new-arrivals',
    '/best-sellers',
    '/sale',
    '/collections',
    '/track-order',
    '/about',
    '/contact',
    '/faq',
    '/shipping-policy',
    '/return-policy',
    '/privacy-policy',
    '/terms',
  ];
  const urls = routes
    .map(
      (route) =>
        `<url><loc>${origin}${route}</loc><changefreq>daily</changefreq><priority>${route === '/' ? '1.0' : '0.8'}</priority></url>`
    )
    .join('');

  res
    .type('application/xml')
    .send(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
    );
});

// Health & Shipping Estimator APIs
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', brand: 'Deboo.pk', warehouse: 'Karachi, Pakistan' });
});

app.get('/api/shipping-estimate', (req, res) => {
  const city = String(req.query.city || 'Karachi').trim();
  const normalized = city.toLowerCase();
  let fee = 350;
  let estimate = '3-5 business days via TCS / Leopards Courier';

  if (normalized === 'karachi') {
    fee = 200;
    estimate = '1-2 business days (Same-city Karachi dispatch)';
  } else if (['lahore', 'islamabad', 'rawalpindi', 'hyderabad'].includes(normalized)) {
    fee = 300;
    estimate = '2-4 business days via tracked air/express courier';
  }

  res.json({
    origin: 'Karachi Main Warehouse',
    city,
    feePKR: fee,
    freeThresholdPKR: 8500,
    estimate,
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Deboo.pk server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
