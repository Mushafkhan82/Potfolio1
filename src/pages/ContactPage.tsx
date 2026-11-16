import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Box,
  Check,
  Clock,
  Code2,
  Film,
  Layout,
  Mail,
  MessageSquare,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Video,
} from 'lucide-react';
import { SERVICES, STUDIO_INFO } from '../data/studioData';
import { useCurrency } from '../context/CurrencyContext';
import { openExternalUrl, usePageMeta } from '../hooks/usePortfolioHelpers';
import { submitEnquiry } from '../lib/liveContent';
import { CustomBriefSection } from '../components/HomeSections';
import { AmbientVideo } from '../components/BackgroundVideos';

function getContactServiceIcon(slug: string) {
  switch (slug) {
    case 'web-development':
      return <Code2 size={16} />;
    case 'seo':
      return <Search size={16} />;
    case 'social-media-management':
      return <Share2 size={16} />;
    case 'ui-ux-graphic-design':
      return <Layout size={16} />;
    case 'video-editing':
      return <Video size={16} />;
    case 'motion-graphics':
      return <Film size={16} />;
    case '3d-blender':
      return <Box size={16} />;
    case 'ai-automation':
      return <Bot size={16} />;
    default:
      return <Sparkles size={16} />;
  }
}

const TIMELINE_OPTIONS = [
  'Urgent Sprint (1-2 Weeks)',
  'This Month (2-4 Weeks)',
  'Flexible (1-2 Months)',
  'Ongoing Retainer',
];

export const ContactPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialServiceSlug = searchParams.get('service') || '';

  usePageMeta({
    title: 'Contact Mushaf Khan | Start Your Project',
    description:
      'Start a project with Mushaf Khan. Direct communication with guaranteed 24-hour reply on all project inquiries.',
    canonicalUrl: 'https://mushafkhan.com/contact',
  });

  const { formatUSD, formatUSDRange } = useCurrency();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const resolvedService = useMemo(() => {
    if (!initialServiceSlug) return 'Web Development';
    const match = SERVICES.find(
      (s) => s.slug.toLowerCase() === initialServiceSlug.toLowerCase()
    );
    return match ? match.name : 'Web Development';
  }, [initialServiceSlug]);

  const [selectedService, setSelectedService] = useState(resolvedService);

  useEffect(() => {
    if (initialServiceSlug) {
      const match = SERVICES.find(
        (s) => s.slug.toLowerCase() === initialServiceSlug.toLowerCase()
      );
      if (match) setSelectedService(match.name);
    }
  }, [initialServiceSlug]);

  const [selectedBudgetId, setSelectedBudgetId] = useState('tier-2');

  const budgetTiers = useMemo(
    () => [
      { id: 'tier-1', label: formatUSDRange(1500, 3500) },
      { id: 'tier-2', label: formatUSDRange(3500, 7500) },
      { id: 'tier-3', label: formatUSDRange(7500, 15000) },
      { id: 'tier-4', label: `${formatUSD(15000)}+ Enterprise` },
    ],
    [formatUSD, formatUSDRange]
  );

  const activeBudgetLabel = useMemo(
    () => budgetTiers.find((t) => t.id === selectedBudgetId)?.label || budgetTiers[1].label,
    [budgetTiers, selectedBudgetId]
  );

  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    timeline: 'Urgent Sprint (1-2 Weeks)',
    message: '',
    preferredChannel: 'email' as 'email' | 'whatsapp' | 'instagram',
  });
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const buildQuickText = () =>
    `Hi Mushaf, my name is ${form.name || '[Name]'}. I need help with "${selectedService}". Budget scope: ${activeBudgetLabel}. Details: ${
      form.message || 'I would like to start a project with you.'
    }`;

  const buildMailtoUrl = () => {
    const subject = `[Project Inquiry] ${selectedService} - ${form.name || 'New Client'}`;
    const body = [
      'Hi Mushaf,',
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Company: ${form.company || 'N/A'}`,
      `Service Needed: ${selectedService}`,
      `Estimated Budget: ${activeBudgetLabel}`,
      `Target Timeline: ${form.timeline}`,
      `Preferred Channel: ${form.preferredChannel}`,
      `Project Scope & Goals: ${form.message || "Let's connect to discuss deliverables."}`,
    ].join('\n');
    return `mailto:${STUDIO_INFO.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setErrorMsg('Please enter your name and email address.');
      setStep(4);
      return;
    }
    setErrorMsg('');
    setSubmitting(true);

    try {
      await submitEnquiry({
        name: form.name,
        businessType: `${selectedService} (${form.company || 'Independent'})`,
        budget: activeBudgetLabel,
        message: `${form.message} [Timeline: ${form.timeline}, Email: ${form.email}]`,
        preferredChannel: form.preferredChannel,
        honeypot,
      });
    } catch (err) {
      console.warn('Direct inquiry logged locally or database fallback triggered', err);
    }

    setSubmitting(false);
    setSubmitted(true);

    if (form.preferredChannel === 'email') {
      window.location.href = buildMailtoUrl();
    } else if (form.preferredChannel === 'whatsapp' && STUDIO_INFO.whatsapp) {
      openExternalUrl(
        `https://wa.me/${STUDIO_INFO.whatsapp}?text=${encodeURIComponent(buildQuickText())}`
      );
    } else if (form.preferredChannel === 'instagram') {
      try {
        await navigator.clipboard.writeText(buildQuickText());
        setCopiedNotice(true);
        window.setTimeout(() => setCopiedNotice(false), 4000);
      } catch {}
      openExternalUrl(`https://instagram.com/${STUDIO_INFO.instagramUsername}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#111111] pt-28 sm:pt-32 pb-32 sm:pb-36 px-4 sm:px-6 lg:px-8 selection:bg-[#B6F500] selection:text-[#111111] relative overflow-x-clip">
      <AmbientVideo
        mp4Src="/videos/testimonials-ambient-light.mp4"
        webmSrc="/videos/hero-ambient-light.webm"
        posterSrc="/videos/hero-ambient-light-poster.webp"
        videoClassName="opacity-20 blur-[2px]"
        overlayClassName="bg-[#FAF8F4]/80"
        className="pointer-events-none !absolute inset-0 z-0"
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-6 flex items-center gap-2 font-mono text-xs text-[#5B5B56]">
          <span className="w-2 h-2 rounded-full bg-[#6BAA00]" />
          <span className="uppercase tracking-widest text-[#4C7A00] font-bold">
            Direct Inquiry
          </span>
          <span>/</span>
          <span>Project Brief Wizard</span>
        </div>

        <div className="max-w-3xl mb-14">
          <h1 className="font-display font-medium text-4xl sm:text-6xl text-[#111111] tracking-tight leading-[1.08] mb-6">
            Let's build something{' '}
            <span className="sage-underline font-semibold">exceptional</span> together.
          </h1>
          <p className="font-sans text-base sm:text-lg text-[#5B5B56] leading-relaxed">
            Direct collaboration without middle managers or 3-week agency delays. You speak straight with the person who designs, codes, and ships your product.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-14">
          <div className="lg:col-span-7 bg-white border border-[#E7E3DA] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E7E3DA]">
              <div className="flex items-center gap-2">
                {([1, 2, 3, 4] as const).map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setStep(idx)}
                    className={`w-11 h-11 rounded-full text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                      step === idx
                        ? 'bg-[#B6F500] text-[#111111] border border-[#96CF00] shadow-xs scale-105'
                        : step > idx
                          ? 'bg-[#B6F500]/30 text-[#4C7A00]'
                          : 'bg-[#FAF8F4] border border-[#E7E3DA] text-[#5B5B56]'
                    }`}
                  >
                    {step > idx ? '✓' : idx}
                  </button>
                ))}
              </div>
              <span className="font-mono text-xs text-[#5B5B56]">
                Step {step} of 4:{' '}
                <strong className="text-[#111111]">
                  {step === 1 && 'Service'}
                  {step === 2 && 'Budget'}
                  {step === 3 && 'Timeline'}
                  {step === 4 && 'Details'}
                </strong>
              </span>
            </div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 rounded-2xl bg-[#B6F500]/20 border border-[#6BAA00]/30 text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] font-bold flex items-center justify-center mx-auto text-xl">
                  ✓
                </div>
                <h3 className="font-display font-medium text-2xl text-[#111111]">
                  Message Sent Successfully
                </h3>
                <p className="text-sm font-sans text-[#5B5B56] max-w-md mx-auto">
                  Your project brief has been received. I review every message personally and reply within 24 hours.
                </p>
                {copiedNotice && (
                  <p className="text-xs font-mono text-[#4C7A00] font-semibold">
                    ✓ Project details copied to your clipboard!
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setStep(1);
                  }}
                  className="mt-4 px-5 py-2 rounded-full bg-white border border-[#E7E3DA] hover:border-[#6BAA00] text-xs font-mono tracking-wider uppercase font-semibold transition-colors text-[#111111] cursor-pointer"
                >
                  Send another inquiry
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <input
                  type="text"
                  name="user_organization_website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      className="space-y-4"
                    >
                      <div>
                        <h3 className="font-display font-medium text-xl text-[#111111] mb-1">
                          Which service do you need?
                        </h3>
                        <p className="text-xs font-mono text-[#5B5B56]">
                          Select one primary focus (you can add notes in step 4).
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {SERVICES.map((svc) => {
                          const active = selectedService === svc.name;
                          return (
                            <button
                              key={svc.slug}
                              type="button"
                              onClick={() => setSelectedService(svc.name)}
                              className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                                active
                                  ? 'border-[#6BAA00] bg-[#B6F500] text-[#111111] shadow-xs font-bold'
                                  : 'border-[#E7E3DA] bg-[#FAF8F4] text-[#111111] hover:border-[#6BAA00]/60'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={
                                    active ? 'text-[#111111]' : 'text-[#4C7A00]'
                                  }
                                >
                                  {getContactServiceIcon(svc.slug)}
                                </span>
                                <span className="font-sans text-xs font-semibold">{svc.name}</span>
                              </div>
                              {active && <Check size={14} />}
                            </button>
                          );
                        })}
                      </div>
                      <div className="pt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="min-h-[44px] w-full sm:w-auto justify-center px-6 py-2.5 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] font-mono text-xs uppercase tracking-wider font-bold hover:bg-[#a9e600] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Next: Budget</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      className="space-y-4"
                    >
                      <div>
                        <h3 className="font-display font-medium text-xl text-[#111111] mb-1">
                          What is your budget scope?
                        </h3>
                        <p className="text-xs font-mono text-[#5B5B56]">
                          Formatted in your active currency. Transparent milestones with zero surprises.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {budgetTiers.map((tier) => {
                          const active = selectedBudgetId === tier.id;
                          return (
                            <button
                              key={tier.id}
                              type="button"
                              onClick={() => setSelectedBudgetId(tier.id)}
                              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                                active
                                  ? 'border-[#6BAA00] bg-[#B6F500] text-[#111111] shadow-xs font-bold'
                                  : 'border-[#E7E3DA] bg-[#FAF8F4] text-[#5B5B56] hover:text-[#111111] hover:border-[#6BAA00]/60'
                              }`}
                            >
                              <span className="font-mono text-xs block">{tier.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="pt-4 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="min-h-[44px] px-4 py-2 rounded-full text-xs font-mono text-[#5B5B56] hover:text-[#111111] flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft size={13} />
                          <span>Back</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep(3)}
                          className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] font-mono text-xs uppercase tracking-wider font-bold hover:bg-[#a9e600] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Next: Timeline</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step-3"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      className="space-y-4"
                    >
                      <div>
                        <h3 className="font-display font-medium text-xl text-[#111111] mb-1">
                          Target launch timeline?
                        </h3>
                        <p className="text-xs font-mono text-[#5B5B56]">
                          Standard builds ship in a structured 14-day production sprint.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {TIMELINE_OPTIONS.map((tl) => {
                          const active = form.timeline === tl;
                          return (
                            <button
                              key={tl}
                              type="button"
                              onClick={() => setForm((prev) => ({ ...prev, timeline: tl }))}
                              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                                active
                                  ? 'border-[#6BAA00] bg-[#B6F500] text-[#111111] shadow-xs font-bold'
                                  : 'border-[#E7E3DA] bg-[#FAF8F4] text-[#5B5B56] hover:text-[#111111] hover:border-[#6BAA00]/60'
                              }`}
                            >
                              <span className="font-mono text-xs block">{tl}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="pt-4 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="min-h-[44px] px-4 py-2 rounded-full text-xs font-mono text-[#5B5B56] hover:text-[#111111] flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft size={13} />
                          <span>Back</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep(4)}
                          className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] font-mono text-xs uppercase tracking-wider font-bold hover:bg-[#a9e600] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Next: Your Details</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div
                      key="step-4"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-mono text-[11px] uppercase tracking-wider text-[#5B5B56] mb-1.5">
                            Your Name *
                          </label>
                          <input
                            type="text"
                            required
                            autoComplete="name"
                            value={form.name}
                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="Alex Mercer"
                            className="w-full min-h-[44px] px-4 py-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] text-base sm:text-sm text-[#111111] placeholder:text-[#5B5B56]/60 focus:outline-none focus:border-[#6BAA00] focus:bg-white transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block font-mono text-[11px] uppercase tracking-wider text-[#5B5B56] mb-1.5">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            autoComplete="email"
                            value={form.email}
                            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                            placeholder="alex@company.com"
                            className="w-full min-h-[44px] px-4 py-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] text-base sm:text-sm text-[#111111] placeholder:text-[#5B5B56]/60 focus:outline-none focus:border-[#6BAA00] focus:bg-white transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-mono text-[11px] uppercase tracking-wider text-[#5B5B56] mb-1.5">
                            Company / Brand
                          </label>
                          <input
                            type="text"
                            autoComplete="organization"
                            value={form.company}
                            onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                            placeholder="Optional"
                            className="w-full min-h-[44px] px-4 py-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] text-base sm:text-sm text-[#111111] placeholder:text-[#5B5B56]/60 focus:outline-none focus:border-[#6BAA00] focus:bg-white transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block font-mono text-[11px] uppercase tracking-wider text-[#5B5B56] mb-1.5">
                            Preferred Reply Channel
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(['email', 'whatsapp', 'instagram'] as const).map((ch) => (
                              <button
                                key={ch}
                                type="button"
                                onClick={() => setForm((p) => ({ ...p, preferredChannel: ch }))}
                                className={`min-h-[44px] py-2.5 rounded-xl font-mono text-[11px] uppercase border transition-all cursor-pointer ${
                                  form.preferredChannel === ch
                                    ? 'bg-[#B6F500] text-[#111111] border-[#96CF00] font-bold'
                                    : 'bg-[#FAF8F4] border-[#E7E3DA] text-[#5B5B56] hover:text-[#111111]'
                                }`}
                              >
                                {ch}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block font-mono text-[11px] uppercase tracking-wider text-[#5B5B56] mb-1.5">
                          Project Scope & Goals
                        </label>
                        <textarea
                          rows={4}
                          value={form.message}
                          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                          placeholder="Tell me about your goals, current challenges, or links you admire..."
                          className="w-full px-4 py-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] text-base sm:text-sm text-[#111111] placeholder:text-[#5B5B56]/60 focus:outline-none focus:border-[#6BAA00] focus:bg-white transition-colors resize-none"
                        />
                      </div>

                      {errorMsg && (
                        <p className="font-mono text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                          {errorMsg}
                        </p>
                      )}

                      <div className="pt-2 flex items-center justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => setStep(3)}
                          className="min-h-[44px] px-4 py-2 rounded-full text-xs font-mono text-[#5B5B56] hover:text-[#111111] flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft size={13} />
                          <span>Back</span>
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 min-h-[48px] rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] font-bold py-3.5 px-6 text-xs sm:text-sm tracking-wide uppercase font-mono hover:bg-[#a9e600] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm group"
                        >
                          <Send size={14} />
                          <span>{submitting ? 'Submitting...' : 'Send Project Inquiry'}</span>
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            )}
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border-2 border-[#00B22D]/35 rounded-3xl p-6 relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xl tracking-tight text-[#111111] font-sans">
                    fi<span className="text-[#00B22D]">verr</span>
                  </span>
                  <span className="bg-[#00B22D]/10 text-[#007D1F] text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#00B22D]/25 uppercase tracking-widest font-bold">
                    Official Pro
                  </span>
                </div>
                <span className="text-xs font-mono text-[#5B5B56] flex items-center gap-1 font-semibold">
                  ⭐ 5.0 Rating
                </span>
              </div>
              <h3 className="font-display font-medium text-lg text-[#111111] mb-1">
                Fiverr: Mushaf Khan
              </h3>
              <p className="font-sans text-xs text-[#5B5B56] mb-5 leading-relaxed">
                Prefer escrow payment protection with credit card or PayPal? You can hire me securely through my verified Fiverr profile.
              </p>
              <a
                href={STUDIO_INFO.fiverr}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] inline-flex items-center justify-between w-full px-4 py-3 rounded-2xl bg-[#00B22D] hover:bg-[#009b27] text-white font-mono text-xs uppercase tracking-wider font-bold transition-colors shadow-xs"
              >
                <span>Hire on Fiverr</span>
                <ArrowUpRight size={14} />
              </a>
            </div>

            <div className="bg-white border border-[#E7E3DA] rounded-3xl p-6 space-y-4 shadow-sm">
              <h3 className="font-display font-medium text-xl text-[#111111]">
                Direct Communication
              </h3>
              <p className="font-mono text-xs text-[#5B5B56]">
                For quick consultations, urgent questions, or informal project chats:
              </p>
              <div className="space-y-3">
                <a
                  href={`mailto:${STUDIO_INFO.email}`}
                  className="min-h-[56px] flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#E7E3DA] hover:border-[#6BAA00] group transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white border border-[#E7E3DA] flex items-center justify-center text-[#4C7A00] shrink-0">
                      <Mail size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-mono text-[#111111] block font-semibold">
                        Direct Email
                      </span>
                      <span className="text-[11px] font-mono text-[#5B5B56] truncate block">
                        {STUDIO_INFO.email}
                      </span>
                    </div>
                  </div>
                  <ArrowUpRight
                    size={14}
                    className="shrink-0 text-[#5B5B56] group-hover:text-[#4C7A00]"
                  />
                </a>

                <a
                  href={`https://instagram.com/${STUDIO_INFO.instagramUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[56px] flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#E7E3DA] hover:border-[#6BAA00] group transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white border border-[#E7E3DA] flex items-center justify-center text-[#4C7A00] shrink-0">
                      <Sparkles size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-mono text-[#111111] block font-semibold">
                        Instagram
                      </span>
                      <span className="text-[11px] font-mono text-[#5B5B56] truncate block">
                        @{STUDIO_INFO.instagramUsername}
                      </span>
                    </div>
                  </div>
                  <ArrowUpRight
                    size={14}
                    className="shrink-0 text-[#5B5B56] group-hover:text-[#4C7A00]"
                  />
                </a>

                {STUDIO_INFO.whatsapp && (
                  <a
                    href={`https://wa.me/${STUDIO_INFO.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[56px] flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#E7E3DA] hover:border-[#16833E] group transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white border border-[#E7E3DA] flex items-center justify-center text-[#16833E] shrink-0">
                        <MessageSquare size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-mono text-[#111111] block font-semibold">
                          WhatsApp
                        </span>
                        <span className="text-[11px] font-mono text-[#5B5B56] truncate block">
                          {STUDIO_INFO.whatsappFormatted || STUDIO_INFO.whatsapp}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight
                      size={14}
                      className="shrink-0 text-[#5B5B56] group-hover:text-[#16833E]"
                    />
                  </a>
                )}
              </div>
            </div>

            <div className="bg-white border border-[#E7E3DA] rounded-3xl p-6 space-y-4 shadow-sm">
              <h4 className="font-mono text-xs uppercase tracking-wider text-[#5B5B56] font-bold">
                Operating Guarantees
              </h4>
              <ul className="space-y-3 font-mono text-xs text-[#5B5B56]">
                <li className="flex items-start gap-2.5">
                  <Clock size={14} className="text-[#4C7A00] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#111111]">24-Hour Reply:</strong> You will always receive an evaluated response with initial roadmap within one business day.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck size={14} className="text-[#4C7A00] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#111111]">Fixed-Scope Pricing:</strong> No surprise invoices. We establish fixed milestone deliverables before work begins.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Sparkles size={14} className="text-[#4C7A00] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#111111]">Direct Access:</strong> Daily WhatsApp updates plus short screen recording video walkthroughs.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <CustomBriefSection />
      </div>
    </div>
  );
};

export default ContactPage;
