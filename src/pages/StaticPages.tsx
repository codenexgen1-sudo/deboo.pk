import React, { useState } from 'react';
import { ChevronDown, Mail, MapPin, Phone } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { IMG_ASSETS } from '../data/seedCatalog';
import { useSeoMetadata } from '../hooks/useSeoMetadata';

export const AboutPage: React.FC = () => {
  const { navigate } = useRouter();
  useSeoMetadata({
    title: 'About Deboo.pk | Karachi Luxury Fashion House',
    description:
      'Learn about Deboo.pk — a contemporary Pakistani women’s luxury fashion label crafting heirloom textiles and tailored silhouettes in Karachi.',
    image: IMG_ASSETS.heroSilk,
  });

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[#9D7B38]">Our Heritage</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#222222] leading-tight">
            Everything, But Better. Crafted in Karachi.
          </h1>
          <p className="text-base text-[#777777] leading-relaxed">
            Deboo.pk is a contemporary Pakistani luxury fashion label dedicated to elevating women&apos;s unstitched fabrics, tailored stitched suits, festive formals, and handcrafted accessories.
          </p>
          <p className="text-sm text-[#777777] leading-relaxed">
            Operating from our main atelier and fulfillment warehouse in Karachi, every piece undergoes rigorous textile inspection before being dispatched via tracked national courier across Pakistan.
          </p>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="px-7 py-3 bg-[#222222] text-white text-xs uppercase tracking-[0.16em]"
          >
            Explore Our Collections
          </button>
        </div>
        <div className="lg:col-span-6 aspect-[4/3] bg-[#F3EFE6] overflow-hidden border border-[#E8DCC3]">
          <SafeImage src={IMG_ASSETS.heroSilk} alt="Deboo.pk Karachi Studio" className="w-full h-full object-cover" />
        </div>
      </div>
    </main>
  );
};

export const ContactPage: React.FC = () => {
  const { settings } = useStore();
  const [sent, setSent] = useState(false);

  useSeoMetadata({
    title: 'Contact Us | Deboo.pk Client Concierge',
    description:
      'Reach the Deboo.pk Karachi client concierge via WhatsApp, email, or inquiry form for sizing, orders, and styling assistance.',
  });

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9D7B38]">Client Concierge</p>
        <h1 className="font-serif text-4xl text-[#222222] mt-1">Contact Deboo.pk</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 bg-white border border-[#E8DCC3] p-6 space-y-5 text-sm">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#9D7B38] shrink-0" />
            <div>
              <p className="font-medium text-[#222222]">Karachi Main Warehouse &amp; Studio</p>
              <p className="text-[#777777] mt-0.5">Clifton / Shahrah-e-Faisal Fulfillment Hub, Karachi, Pakistan</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-[#9D7B38] shrink-0" />
            <div>
              <p className="font-medium text-[#222222]">WhatsApp &amp; Client Line</p>
              <p className="text-[#777777] mt-0.5">{settings.whatsappNumber}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-[#9D7B38] shrink-0" />
            <div>
              <p className="font-medium text-[#222222]">Concierge Email</p>
              <p className="text-[#777777] mt-0.5">{settings.supportEmail}</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="md:col-span-7 bg-white border border-[#E8DCC3] p-6 space-y-4"
        >
          <h2 className="font-serif text-2xl text-[#222222]">Send an Inquiry</h2>
          {sent ? (
            <p className="text-sm text-[#9D7B38] bg-[#FAF8F3] border border-[#C8A45D] p-4">
              Thank you for contacting Deboo.pk. Our Karachi concierge team will reply within 24 hours.
            </p>
          ) : (
            <>
              <input required placeholder="Full Name" className="w-full border border-[#E8DCC3] px-3.5 py-2.5 text-sm" />
              <input required type="email" placeholder="Email Address" className="w-full border border-[#E8DCC3] px-3.5 py-2.5 text-sm" />
              <input placeholder="Order Number (optional)" className="w-full border border-[#E8DCC3] px-3.5 py-2.5 text-sm" />
              <textarea required rows={4} placeholder="How may we assist you?" className="w-full border border-[#E8DCC3] px-3.5 py-2.5 text-sm" />
              <button type="submit" className="px-6 py-3 bg-[#222222] text-white text-xs uppercase tracking-[0.16em]">
                Send Message
              </button>
            </>
          )}
        </form>
      </div>
    </main>
  );
};

export const FaqPage: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    ['Where are Deboo.pk orders dispatched from?', 'All orders are quality-checked, steamed, and dispatched directly from our main warehouse in Karachi via TCS and Leopards Tracked Courier.'],
    ['How long does delivery take across Pakistan?', 'Karachi orders arrive in 1–2 business days. Major cities (Lahore, Islamabad, Rawalpindi, Faisalabad, Multan) take 2–4 business days, and other cities 3–5 business days.'],
    ['Which payment methods do you support?', 'We support Cash on Delivery (COD), Easypaisa, JazzCash, Direct Bank Transfer (IBFT), and Online Card payment gateways.'],
    ['What is your return & exchange policy?', 'Unworn, unwashed outfits with original tags may be exchanged or returned within 7 days of delivery.'],
  ];

  useSeoMetadata({
    title: 'Frequently Asked Questions | Deboo.pk',
    description:
      'Answers about Deboo.pk Karachi dispatch times, nationwide courier delivery, Cash on Delivery, digital payments, and 7-day exchanges.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(([q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: a,
        },
      })),
    },
  });

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      <p className="text-xs uppercase tracking-[0.2em] text-[#9D7B38]">Client Guide</p>
      <h1 className="font-serif text-4xl text-[#222222] mt-1 mb-8">Frequently Asked Questions</h1>
      <div className="bg-white border border-[#E8DCC3] divide-y divide-[#E8DCC3]">
        {faqs.map(([q, a], idx) => (
          <div key={q} className="p-5">
            <button
              type="button"
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="w-full flex items-center justify-between text-left font-serif text-xl text-[#222222]"
            >
              <span>{q}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openIdx === idx ? 'rotate-180' : ''}`} />
            </button>
            {openIdx === idx && <p className="text-sm text-[#777777] mt-3 leading-relaxed">{a}</p>}
          </div>
        ))}
      </div>
    </main>
  );
};

export const PolicyPage: React.FC<{
  type: 'shipping' | 'return' | 'privacy' | 'terms';
}> = ({ type }) => {
  const content = {
    shipping: {
      title: 'Shipping Policy',
      body: 'Orders are dispatched from our Karachi Main Warehouse within 24 working hours. Standard tracked courier charges are PKR 200 within Karachi and PKR 300–350 nationwide, with complimentary delivery on orders above PKR 8,500.',
    },
    return: {
      title: 'Return & Exchange Policy',
      body: 'Items may be exchanged or returned within 7 days of delivery provided original tags, packaging, and fabric condition remain intact. Custom-tailored garments are eligible for alteration support.',
    },
    privacy: {
      title: 'Privacy Policy',
      body: 'Deboo.pk protects your personal details with strict access controls. We never sell client information and collect privacy-conscious storefront analytics only with your consent.',
    },
    terms: {
      title: 'Terms & Conditions',
      body: 'All prices are listed in Pakistani Rupees (PKR). Availability is verified transactionally at order placement to prevent overselling.',
    },
  }[type];

  useSeoMetadata({
    title: `${content.title} | Deboo.pk`,
    description: content.body,
  });

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      <p className="text-xs uppercase tracking-[0.2em] text-[#9D7B38]">Deboo.pk Policies</p>
      <h1 className="font-serif text-4xl text-[#222222] mt-1 mb-6">{content.title}</h1>
      <div className="bg-white border border-[#E8DCC3] p-8 text-sm text-[#777777] leading-relaxed space-y-4">
        <p>{content.body}</p>
        <p>For assistance, reach our Karachi Client Concierge via the Contact Us page.</p>
      </div>
    </main>
  );
};
