import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Compass,
  Gauge,
  Layout,
  PhoneCall,
  Rocket,
  Sparkles,
} from 'lucide-react';
import { PROCESS_STEPS } from '../data/studioData';
import { useIsMobile, usePageMeta } from '../hooks/usePortfolioHelpers';
import { FaqSection } from '../components/HomeSections';
import { MobileReadMore } from '../components/MobileReadMore';

const SPRINT_PHASES = [
  {
    days: 'Days 1–3',
    dayRange: [1, 3],
    title: 'Design Discovery',
    tagline: 'Architecture & Visual Direction',
    icon: Compass,
    deliverables: [
      'Brand audit & competitor teardown',
      'Interactive Figma wireframes',
      'Menu & reservation user journey',
    ],
  },
  {
    days: 'Days 4–8',
    dayRange: [4, 8],
    title: 'Component Build',
    tagline: 'Clean Code & Micro-Interactions',
    icon: Code2,
    deliverables: [
      'Custom React 19 + TypeScript build',
      'Mobile-first responsive styling',
      'Direct API integrations (Resy/POS)',
    ],
  },
  {
    days: 'Days 9–11',
    dayRange: [9, 11],
    title: 'Performance & SEO',
    tagline: 'Sub-Second Speed & Local Ranking',
    icon: Gauge,
    deliverables: [
      '95+ Google PageSpeed tuning',
      'Local SEO & Schema.org JSON-LD',
      'Asset caching & image compression',
    ],
  },
  {
    days: 'Days 12–14',
    dayRange: [12, 14],
    title: 'Final Launch',
    tagline: 'Handover & Live Production',
    icon: Rocket,
    deliverables: [
      'Cross-device QA on iOS & Android',
      'Analytics & WhatsApp inquiry setup',
      'Domain switch & 30-day post-launch support',
    ],
  },
];

const SprintPhaseDial: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  return (
    <div className="w-full rounded-3xl bg-white border border-[#E7E3DA] p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden">
      <span className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-[#6BAA00]/60 pointer-events-none" />
      <span className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-[#6BAA00]/60 pointer-events-none" />
      <span className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-[#6BAA00]/60 pointer-events-none" />
      <span className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-[#6BAA00]/60 pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#E7E3DA]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#6BAA00] animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#4C7A00] font-bold">
              14-Day Delivery Sprint
            </span>
          </div>
          <h3 className="font-serif italic text-2xl sm:text-3xl text-[#111111]">
            Rapid Production Milestone Tracker
          </h3>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF8F4] border border-[#E7E3DA] text-xs font-mono text-[#5B5B56]">
          <Clock size={13} className="text-[#4C7A00]" />
          <span>Fixed 14 Calendar Days · On-Time Guarantee</span>
        </div>
      </div>

      <div className="mb-10">
        <div className="relative mb-3">
          <div className="h-1.5 w-full bg-[#E7E3DA] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#6BAA00]"
              initial={{ width: '25%' }}
              animate={{ width: `${((selectedIdx + 1) / SPRINT_PHASES.length) * 100}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="flex justify-between items-center mt-2 px-1 text-[10px] font-mono text-[#5B5B56]">
            <span>Day 01</span>
            <span className="hidden sm:inline">Day 04</span>
            <span>Day 07</span>
            <span className="hidden sm:inline">Day 10</span>
            <span className="text-[#4C7A00] font-semibold">Day 14 (Launch)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
          {SPRINT_PHASES.map((phase, idx) => {
            const Icon = phase.icon;
            const active = selectedIdx === idx;
            return (
              <button
                key={phase.title}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`text-left min-h-[44px] p-4 rounded-2xl transition-all duration-200 cursor-pointer relative overflow-hidden group touch-manipulation border ${
                  active
                    ? 'bg-[#B6F500]/20 border-[#6BAA00] shadow-sm'
                    : 'bg-[#FAF8F4] border-[#E7E3DA] hover:border-[#6BAA00]/60'
                }`}
              >
                {active && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#6BAA00]" />
                )}
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      active
                        ? 'bg-[#B6F500] text-[#111111] border border-[#96CF00]'
                        : 'bg-white text-[#4C7A00] border border-[#E7E3DA]'
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <div>
                    <span
                      className={`font-mono text-[10px] uppercase font-bold tracking-wider block ${
                        active ? 'text-[#4C7A00]' : 'text-[#5B5B56]'
                      }`}
                    >
                      {phase.days}
                    </span>
                    <h4 className="font-serif italic text-base text-[#111111] leading-none">
                      {phase.title}
                    </h4>
                  </div>
                </div>
                <p className="font-sans text-xs text-[#5B5B56] leading-tight mb-3">
                  {phase.tagline}
                </p>
                <div className="space-y-1.5 pt-2.5 border-t border-[#E7E3DA]">
                  {phase.deliverables.map((deliv, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-1.5 text-[11px] font-mono text-[#5B5B56] leading-tight"
                    >
                      <CheckCircle2
                        size={11}
                        className={`mt-0.5 shrink-0 ${
                          active ? 'text-[#4C7A00]' : 'text-[#5B5B56]/70'
                        }`}
                      />
                      <span>{deliv}</span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF8F4] border border-[#E7E3DA] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#B6F500]/30 border border-[#6BAA00]/30 flex items-center justify-center text-[#4C7A00] shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="font-mono text-[11px] text-[#4C7A00] uppercase font-bold">
              Current Phase Highlight: {SPRINT_PHASES[selectedIdx].days}
            </div>
            <div className="font-sans text-sm text-[#111111] font-medium">
              {SPRINT_PHASES[selectedIdx].title} — {SPRINT_PHASES[selectedIdx].tagline}
            </div>
          </div>
        </div>
        <div className="font-mono text-xs text-[#5B5B56] sm:text-right shrink-0">
          Client check-ins via private Slack/WhatsApp channel with daily loom videos.
        </div>
      </div>
    </div>
  );
};

export const ProcessPage: React.FC = () => {
  const { isMobile } = useIsMobile();

  usePageMeta({
    title: '14-Day Build Process & Sprint Timeline | Mushaf',
    description:
      'A clear 14-day build process from our first call to your live website launch. Fixed price, regular updates, and zero surprise fees.',
    canonicalUrl: 'https://mushafkhan.com/process',
  });

  const stepIcons = [PhoneCall, Layout, Code2, Rocket];

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-32 pb-32 sm:pb-36 px-4 sm:px-6 lg:px-8 selection:bg-[#B6F500] selection:text-[#111111] relative">
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="hidden md:flex items-center gap-2 font-mono text-xs text-[#5B5B56] mb-8">
          <Link to="/" className="hover:text-[#111111] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#4C7A00] font-semibold">Process</span>
        </div>

        <header className="relative pb-10 mb-10 md:mb-14 border-b border-[#E7E3DA]">
          <div className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E7E3DA] shadow-xs mb-4">
            <span className="w-2 h-2 rounded-full bg-[#6BAA00]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#5B5B56] font-bold">
              14-Day Delivery — Step-by-Step Sprint
            </span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: isMobile ? 12 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl sm:text-5xl lg:text-6xl font-display font-medium text-[#111111] tracking-tight leading-[1.1] mb-5 md:mb-6"
          >
            Two weeks from our first call to your{' '}
            <span className="sage-underline font-semibold">live website launch.</span>
          </motion.h1>

          <MobileReadMore lines={2}>
            <p className="font-sans text-base sm:text-lg text-[#5B5B56] leading-relaxed max-w-2xl">
              No endless agency delays or confusing jargon. A fast, structured sprint with direct communication straight with me.
            </p>
          </MobileReadMore>
        </header>

        <section className="mb-16">
          <SprintPhaseDial />
        </section>

        <div className="pb-4 mb-6 border-b border-[#E7E3DA]">
          <span className="font-mono text-xs uppercase tracking-widest text-[#4C7A00] block mb-1 font-bold">
            Phase Breakdown
          </span>
          <h2 className="font-display font-medium text-2xl sm:text-3xl text-[#111111]">
            What Happens Week by Week
          </h2>
        </div>

        <section className="mb-20 space-y-5">
          {PROCESS_STEPS.map((step, idx) => {
            const Icon = stepIcons[idx] || Code2;
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="p-6 sm:p-9 rounded-3xl bg-white border border-[#E7E3DA] transition-all shadow-sm hover:shadow-md"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  <div className="md:col-span-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] flex items-center justify-center text-[#4C7A00]">
                        <Icon size={18} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#111111] bg-[#B6F500] px-2.5 py-0.5 rounded-full border border-[#96CF00]">
                          Step {step.step}
                        </span>
                        <span className="font-mono text-xs text-[#5B5B56] font-semibold uppercase tracking-wider">
                          {step.days}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-display font-medium text-2xl text-[#111111]">
                      {step.title}
                    </h3>
                  </div>

                  <div className="md:col-span-8 flex flex-col justify-between">
                    <MobileReadMore lines={2} className="mb-4 md:mb-6">
                      <p className="font-sans text-sm sm:text-base text-[#5B5B56] leading-relaxed">
                        {step.description}
                      </p>
                    </MobileReadMore>
                    <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] flex items-center gap-3 font-mono text-xs text-[#5B5B56]">
                      <Check size={16} className="text-[#4C7A00] shrink-0" />
                      <span>
                        <strong className="text-[#111111] font-bold">
                          Deliverable:{' '}
                        </strong>
                        {step.deliverable}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </section>

        <div className="mb-20">
          <FaqSection />
        </div>

        <section className="p-8 sm:p-10 rounded-3xl bg-white border border-[#E7E3DA] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display font-medium text-2xl text-[#111111]">
              Ready to schedule your sprint?
            </h3>
            <p className="font-mono text-xs text-[#5B5B56] mt-1">
              Slots for Q2 are now open. First come, first served.
            </p>
          </div>
          <Link
            to="/contact"
            className="min-h-[44px] px-6 py-3 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] font-bold text-xs sm:text-sm inline-flex items-center gap-2 hover:bg-[#a9e600] active:scale-95 transition-all shadow-sm font-sans"
          >
            <span>Book Your Sprint</span>
            <ArrowRight size={15} />
          </Link>
        </section>
      </div>
    </div>
  );
};

export default ProcessPage;
