import React, { useState } from 'react';
import { ArrowRight, MapPin, ShieldCheck, Truck } from 'lucide-react';
import { BRAND_LOGO_URL } from '../data/seedCatalog';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';

export const Footer: React.FC = () => {
  const { pathname, navigate } = useRouter();
  const { subscribeNewsletter, analyticsConsent, setAnalyticsConsent } = useStore();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (pathname.startsWith('/admin')) return null;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');
    try {
      await subscribeNewsletter(email, 'footer');
      setStatus('done');
      setEmail('');
      setMessage('Welcome to the Deboo.pk private atelier list.');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Unable to subscribe.');
    }
  };

  return (
    <>
      <footer className="bg-[#222222] text-[#FAF8F3] border-t border-[#C8A45D]/30 no-print">
        {/* Trust Strip */}
        <div className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#C8A45D] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="font-medium text-white">Karachi Main Warehouse</p>
                <p className="text-xs text-[#E8DCC3]/80 mt-0.5">
                  Quality checked and dispatched daily from our Karachi studio.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-[#C8A45D] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="font-medium text-white">Nationwide Tracked Courier</p>
                <p className="text-xs text-[#E8DCC3]/80 mt-0.5">
                  Insured delivery across all Pakistani cities via TCS &amp; Leopards.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#C8A45D] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="font-medium text-white">Cash on Delivery &amp; Digital Pay</p>
                <p className="text-xs text-[#E8DCC3]/80 mt-0.5">
                  COD, Easypaisa, JazzCash, and Direct Bank Transfer supported.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-4">
            <div className="inline-block bg-white px-3.5 py-2.5">
              <img
                src={BRAND_LOGO_URL}
                alt="Deboo.pk — Everything, But Better."
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-sm text-[#E8DCC3]/85 leading-relaxed max-w-xs">
              Everything, But Better. A Pakistani luxury women&apos;s fashion house dedicated to refined textiles, artisanal needlework, and enduring silhouettes.
            </p>
          </div>

          {/* Shop Links */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="font-serif text-lg text-[#C8A45D]">Atelier</h3>
            <ul className="space-y-2 text-sm text-[#E8DCC3]/85">
              {[
                ['Shop All', '/shop'],
                ['New Arrivals', '/new-arrivals'],
                ['Best Sellers', '/best-sellers'],
                ['Collections', '/collections'],
                ['Seasonal Sale', '/sale'],
              ].map(([label, href]) => (
                <li key={href}>
                  <a
                    href={href}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(href);
                    }}
                    className="hover:text-white transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Client Care */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="font-serif text-lg text-[#C8A45D]">Client Care</h3>
            <ul className="space-y-2 text-sm text-[#E8DCC3]/85">
              {[
                ['Track Your Order', '/track-order'],
                ['About Us', '/about'],
                ['Contact Us', '/contact'],
                ['Frequently Asked Questions', '/faq'],
                ['Shipping Policy', '/shipping-policy'],
                ['Return & Exchange Policy', '/return-policy'],
              ].map(([label, href]) => (
                <li key={href}>
                  <a
                    href={href}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(href);
                    }}
                    className="hover:text-white transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="font-serif text-lg text-[#C8A45D]">Private Invitation</h3>
            <p className="text-xs text-[#E8DCC3]/80 leading-relaxed">
              Receive early access to seasonal lawn, winter velvet, and bridal couture releases.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <label htmlFor="footer-newsletter" className="sr-only">
                Email address for newsletter
              </label>
              <div className="flex border border-white/25 bg-white/5">
                <input
                  id="footer-newsletter"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/50 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  aria-label="Subscribe to newsletter"
                  className="px-4 bg-[#C8A45D] text-[#222222] hover:bg-[#E8DCC3] transition-colors flex items-center justify-center"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              {message && (
                <p
                  className={`text-xs ${
                    status === 'error' ? 'text-red-300' : 'text-[#C8A45D]'
                  }`}
                >
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#E8DCC3]/70">
            <p>© {new Date().getFullYear()} Deboo.pk — All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a
                href="/privacy-policy"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/privacy-policy');
                }}
                className="hover:text-white"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/terms');
                }}
                className="hover:text-white"
              >
                Terms &amp; Conditions
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Privacy-conscious Cookie Consent Bar */}
      {analyticsConsent === 'pending' && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-white border border-[#E8DCC3] shadow-lg p-4 flex flex-col gap-3 no-print">
          <p className="text-xs text-[#222222] leading-relaxed">
            Deboo.pk uses privacy-conscious analytics to understand popular collections and improve your shopping experience.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setAnalyticsConsent('declined')}
              className="px-3 py-1.5 text-xs text-[#777777] hover:text-[#222222]"
            >
              Essential Only
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsConsent('granted')}
              className="px-4 py-1.5 bg-[#222222] text-white text-xs uppercase tracking-wider hover:bg-[#3A3A3A]"
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </>
  );
};
