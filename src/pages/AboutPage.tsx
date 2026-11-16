import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { ORIGIN_MILESTONES, PORTRAIT_URL, STUDIO_INFO } from '../data/studioData';
import { useIsMobile, usePageMeta } from '../hooks/usePortfolioHelpers';
import { useCurrency } from '../context/CurrencyContext';
import { useStore } from '../context/StoreContext';
import { AmbientVideo } from '../components/BackgroundVideos';
import { MobileReadMore } from '../components/MobileReadMore';

export const OriginTimelineSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = ORIGIN_MILESTONES[activeIndex] || ORIGIN_MILESTONES[0];

  return (
    <section className="relative w-full py-20 sm:py-28 overflow-x-clip select-none">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 ghost-word">
        ORIGIN
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-10 md:mb-12 pb-6 border-b border-[#E7E3DA]">
          <div className="hidden md:flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#6BAA00]" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#5B5B56] font-semibold">
              Studio Origin & Journey
            </span>
          </div>
          <h2 className="headline-section text-[#111111]">
            Let’s go back in time.
          </h2>
          <MobileReadMore lines={2} className="mt-2">
            <p className="font-body text-sm sm:text-base text-[#5B5B56] max-w-xl">
              Six years of cutting through agency layers, unbuildable Figma graveyards, and sluggish load times.
            </p>
          </MobileReadMore>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-28 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="relative py-6 sm:py-10">
              <div
                className="absolute inset-0 rounded-full blur-[64px] pointer-events-none transition-all duration-700"
                style={{
                  background:
                    'radial-gradient(circle, rgba(182, 245, 0, 0.22) 0%, rgba(107, 170, 0, 0.08) 45%, transparent 72%)',
                }}
              />
              <motion.div
                key={current.year}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="numeral-giant text-[#111111] relative z-10"
              >
                {current.year}
              </motion.div>
            </div>
            <div className="space-y-1.5 relative z-10">
              <span className="font-mono text-xs text-[#4C7A00] font-semibold tracking-wider uppercase block">
                Chapter {current.index} of {String(ORIGIN_MILESTONES.length).padStart(2, '0')}
              </span>
              <h3 className="font-display font-semibold text-xl sm:text-2xl text-[#111111]">
                {current.title}
              </h3>
              <p className="font-body text-xs sm:text-sm text-[#5B5B56] max-w-sm">
                {current.tag} · Direct commercial work
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            {ORIGIN_MILESTONES.map((m, idx) => {
              const active = activeIndex === idx;
              return (
                <div
                  key={m.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`p-6 sm:p-8 rounded-[28px] transition-all duration-300 cursor-pointer border ${
                    active
                      ? 'bg-white border-[#6BAA00] shadow-lg scale-[1.01]'
                      : 'bg-white/80 border-[#E7E3DA] hover:bg-white hover:border-[#6BAA00]/45'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E7E3DA]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-xs px-2.5 py-0.5 rounded-full ${
                          active
                            ? 'bg-[#B6F500] text-[#111111] font-bold'
                            : 'bg-[#FAF8F4] border border-[#E7E3DA] text-[#5B5B56]'
                        }`}
                      >
                        {m.index} / {String(ORIGIN_MILESTONES.length).padStart(2, '0')}
                      </span>
                      <span className="font-display font-semibold text-sm sm:text-base text-[#111111]">
                        {m.title}
                      </span>
                    </div>
                    <span className="font-display font-light text-lg sm:text-xl text-[#5B5B56]">
                      {m.year}
                    </span>
                  </div>
                  <MobileReadMore lines={2} className="mb-4">
                    <p className="font-body text-xs sm:text-sm text-[#5B5B56] leading-relaxed">
                      {m.context}
                    </p>
                  </MobileReadMore>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#E7E3DA]">
                    <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA]">
                      <span className="font-mono text-[10px] uppercase text-[#5B5B56] block mb-0.5">
                        Delivered
                      </span>
                      <span className="font-body text-xs text-[#111111] font-medium leading-snug">
                        {m.deliverable}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA]">
                      <span className="font-mono text-[10px] uppercase text-[#4C7A00] block mb-0.5 font-semibold">
                        Real Outcome
                      </span>
                      <span className="font-body text-xs text-[#111111] font-medium leading-snug">
                        {m.result}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export const AboutPage: React.FC = () => {
  const { isMobile } = useIsMobile();
  const { formatUSD } = useCurrency();
  const { siteContent } = useStore();
  const heroSettings = siteContent?.sections?.find((s) => s.type === 'hero')?.settings;
  const portraitSrc = heroSettings?.portraitUrl?.trim() || PORTRAIT_URL;
  const portraitAlt = heroSettings?.portraitAlt?.trim() || 'Mushaf Khan — Digital Studio Founder';
  const portraitFocal = heroSettings?.portraitFocalPoint?.trim() || '50% 12%';

  usePageMeta({
    title: 'About Mushaf | Multi-Disciplinary Digital Partner',
    description:
      'One direct partner for fast websites, Google search setup, brand design, and AI automation. Fast delivery, clear communication, zero agency delays.',
    canonicalUrl: 'https://mushafkhan.com/about',
  });

  const highlights = [
    `Fixed milestone scopes starting from ${formatUSD(1500)}`,
    '14-day build & launch delivery schedule',
    'Direct founder-to-builder Slack & WhatsApp updates',
    '8 disciplines under one accountable digital partner',
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-32 pb-32 sm:pb-36 px-4 sm:px-6 lg:px-8 selection:bg-[#B6F500] selection:text-[#111111] relative">
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="hidden md:flex items-center gap-2 font-mono text-xs text-[#5B5B56] mb-8">
          <Link to="/" className="hover:text-[#111111] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#4C7A00] font-semibold">About</span>
        </div>

        <header className="relative pb-10 mb-12 border-b border-[#E7E3DA] grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8">
            <div className="hidden md:flex flex-wrap items-center gap-2.5 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E7E3DA] shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6BAA00]" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#111111] font-bold">
                  M. Studio
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E7E3DA] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#6BAA00]" />
                <span className="font-mono text-xs uppercase tracking-wider text-[#5B5B56] font-bold">
                  About Mushaf — Direct Digital Partner
                </span>
              </div>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: isMobile ? 12 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl sm:text-5xl lg:text-6xl font-display font-medium text-[#111111] tracking-tight leading-[1.1] mb-5 md:mb-6"
            >
              One direct partner for{' '}
              <span className="sage-underline font-semibold">code, design, search & AI.</span>
            </motion.h1>

            <MobileReadMore lines={2}>
              <p className="font-sans text-base sm:text-lg text-[#5B5B56] leading-relaxed max-w-2xl">
                You work directly with me from day one. I make sure your website looks sharp, loads fast on all mobile devices, and brings in real paying customers without agency bloat.
              </p>
            </MobileReadMore>
          </div>

          <div className="md:col-span-4 flex justify-center md:justify-end">
            <div className="w-full max-w-[320px] md:max-w-[260px] aspect-[4/5] arch-hero bg-white border border-[#E7E3DA] p-2 shadow-md">
              <div className="w-full h-full arch-hero overflow-hidden bg-[#FAF8F4]">
                <img
                  src={portraitSrc}
                  alt={portraitAlt}
                  loading="eager"
                  decoding="async"
                  style={{ objectPosition: portraitFocal }}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.fallbackApplied) {
                      target.dataset.fallbackApplied = '1';
                      target.src = '/assets/studio/embedded-1.jpg';
                    }
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        <section className="mb-16 p-6 sm:p-10 rounded-3xl bg-white border border-[#E7E3DA] shadow-sm relative overflow-hidden">
          <div className="hidden md:flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#4C7A00] font-bold mb-4">
            <Sparkles size={16} />
            <span>The Single-Partner Advantage</span>
          </div>
          <h2 className="font-display font-medium text-2xl sm:text-3xl text-[#111111] mb-6">
            Why hiring one experienced builder beats managing five disconnected freelancers.
          </h2>
          <AmbientVideo
            mp4Src="/videos/studio-workspace-broll.mp4"
            webmSrc="/videos/studio-workspace-broll.webm"
            posterSrc="/videos/hero-ambient-light-poster.webp"
            aspectRatioClass="aspect-[16/9]"
            overlayClassName="bg-white/15"
            className="rounded-2xl border border-[#E7E3DA] mb-8 shadow-sm"
          />
          <MobileReadMore lines={3} className="mb-8">
            <div className="space-y-4 font-sans text-sm sm:text-base text-[#5B5B56] leading-relaxed">
              <p>
                Most business owners lose weeks managing disconnected freelancers. The web developer ignores SEO. The graphic designer does not optimize for mobile screens.
              </p>
              <p>
                I take care of the entire picture. You get clean code, Google search visibility, sharp social branding, and automated workflows in one cohesive package.
              </p>
              <p>
                You talk straight to the builder doing the actual work. No junior handoffs, no middle managers, and no endless meetings. Everything is delivered on time.
              </p>
            </div>
          </MobileReadMore>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-[#E7E3DA]">
            {highlights.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FAF8F4] border border-[#E7E3DA]"
              >
                <div className="w-6 h-6 rounded-full bg-[#B6F500]/40 text-[#4C7A00] flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={13} />
                </div>
                <span className="font-sans text-xs sm:text-sm text-[#111111] font-medium">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </section>

        <OriginTimelineSection />

        <section className="p-8 sm:p-10 rounded-3xl bg-white border border-[#E7E3DA] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display font-medium text-2xl text-[#111111]">
              Work directly with {STUDIO_INFO.name}
            </h3>
            <p className="font-mono text-xs text-[#5B5B56] mt-1">
              Let’s scope your next sprint with clear deliverables and zero middlemen.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Link
              to="/contact"
              className="min-h-[44px] w-full sm:w-auto px-6 py-3 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 hover:bg-[#a9e600] active:scale-95 transition-all shadow-sm font-sans"
            >
              <span>Start a Project</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/work"
              className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-full bg-[#FAF8F4] border border-[#E7E3DA] hover:border-[#6BAA00] text-[#111111] text-xs sm:text-sm font-semibold transition-colors"
            >
              View Portfolio
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
