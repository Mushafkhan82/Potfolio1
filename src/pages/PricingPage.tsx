import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check } from 'lucide-react';
import { SERVICES, SITE_META } from '../data/studioData';
import { usePageMeta } from '../hooks/usePortfolioHelpers';
import { MobileReadMore } from '../components/MobileReadMore';

export const PricingPage: React.FC = () => {
  usePageMeta({
    title: 'Services & Pricing | Mushaf Khan',
    description:
      'What each service includes and how to request a quote for web, design, video, motion, 3D, SEO, social media and AI automation work.',
    canonicalUrl: 'https://mushafkhan.com/pricing',
  });

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-32 pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <p className="hidden md:block font-mono text-xs uppercase tracking-widest text-[#4C7A00] font-bold mb-3">
          Services and pricing
        </p>
        <h1 className="font-display text-4xl sm:text-6xl font-medium text-[#111111] tracking-tight mb-4">
          Clear scope, quoted per project.
        </h1>
        <MobileReadMore lines={2} className="mb-10 md:mb-12">
          <p className="text-[#5B5B56] max-w-2xl">
            Every project is scoped to your goal. Tell me what you need and you get a written quote with deliverables and a timeline.
          </p>
        </MobileReadMore>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((svc, idx) => (
            <article key={svc.slug} className="group relative overflow-hidden glass hover:border-[#6BAA00]/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl rounded-3xl p-6 flex flex-col">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-14 -right-14 w-40 h-40 rounded-full opacity-40 group-hover:opacity-80 transition-opacity duration-300 blur-2xl"
                style={{
                  background:
                    idx % 2 === 0
                      ? 'radial-gradient(circle, rgba(182, 245, 0, 0.25), transparent 70%)'
                      : 'radial-gradient(circle, rgba(14, 165, 233, 0.2), transparent 70%)',
                }}
              />
              <h2 className="relative z-10 font-display text-xl font-semibold text-[#111111] mb-1">{svc.name}</h2>
              <p className="relative z-10 text-sm text-[#5B5B56] mb-4">{svc.headline}</p>
              <ul className="relative z-10 space-y-2 mb-5 text-sm text-[#111111]">
                {(svc.included || []).slice(0, 4).map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check size={14} className="mt-0.5 shrink-0 text-[#4C7A00]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="relative z-10 mt-auto flex items-center justify-between pt-4 border-t border-[#E7E3DA]">
                <span className="font-mono text-xs text-[#5B5B56]">
                  {SITE_META.startingPrices[svc.slug] || 'Custom quote'}
                </span>
                <Link
                  to={`/contact?service=${svc.slug}`}
                  className="inline-flex items-center gap-1 min-h-[44px] px-3.5 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] text-xs font-bold hover:bg-[#a9e600] transition-colors shadow-xs"
                >
                  Request a quote <ArrowUpRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-sm text-[#5B5B56]">
          Prefer to talk first?{' '}
          <Link to="/book" className="inline-flex items-center min-h-[44px] text-[#4C7A00] underline font-semibold">
            Book a call
          </Link>{' '}
          or{' '}
          <Link to="/contact" className="inline-flex items-center min-h-[44px] text-[#4C7A00] underline font-semibold">
            send a brief
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default PricingPage;
