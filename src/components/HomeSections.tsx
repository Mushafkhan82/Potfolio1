import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  FolderKanban,
  HelpCircle,
  MessageCircle,
  MessageCircleQuestion,
  Minus,
  Plus,
  Repeat,
  Store,
} from 'lucide-react';
import {
  BUDGET_TIERS,
  FAQ_ITEMS,
  PORTRAIT_URL,
  PROJECTS,
  PROJECT_PRICES,
  SEED_REVIEWS,
  SERVICES,
  STUDIO_INFO,
  type StudioProject,
} from '../data/studioData';
import { playFlipTickSound } from '../context/ThemeContext';
import { roundNiceAmount, useCurrency } from '../context/CurrencyContext';
import { useStore } from '../context/StoreContext';
import { useIsMobile, useIsReducedMotion } from '../hooks/usePortfolioHelpers';
import { submitEnquiry } from '../lib/liveContent';
import { AmbientVideo, ScrollScrubVideo } from './BackgroundVideos';
import { MobileReadMore } from './MobileReadMore';

const MOCKUP_PALETTES: [string, string][] = [
  ['#F1F5EB', '#6BAA00'],
  ['#EEF6F5', '#0D9488'],
  ['#FBF4EC', '#C26A1B'],
  ['#F3F0FA', '#6D28D9'],
  ['#EDF7F1', '#15803D'],
  ['#FBF0F4', '#BE185D'],
];

function hashSlug(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const WireframeScreen: React.FC<{
  name: string;
  bg: string;
  ac: string;
  mobile?: boolean;
}> = ({ name, bg, ac, mobile }) => (
  <div
    style={{ containerType: 'inline-size', background: bg }}
    className="w-full h-full flex flex-col justify-between p-[8%] select-none"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-[4%]">
        <span className="rounded-full" style={{ width: '4cqw', height: '4cqw', background: ac }} />
        <span style={{ width: '16cqw', height: '1.8cqw', borderRadius: 99, background: 'rgba(17,17,17,0.22)' }} />
      </div>
      {!mobile && (
        <span style={{ width: '12cqw', height: '1.8cqw', borderRadius: 99, background: 'rgba(17,17,17,0.12)' }} />
      )}
    </div>
    <div className="space-y-[5%]">
      <div
        className="font-display text-[#111111] leading-tight truncate font-medium"
        style={{ fontSize: mobile ? '11cqw' : '7.5cqw' }}
      >
        {name}
      </div>
      <div
        style={{
          width: mobile ? '76%' : '56%',
          height: '2.2cqw',
          borderRadius: 99,
          background: ac,
          opacity: 0.85,
        }}
      />
      <div className="space-y-[3%]">
        <div style={{ width: '88%', height: '1.6cqw', borderRadius: 99, background: 'rgba(17,17,17,0.15)' }} />
        <div style={{ width: '64%', height: '1.6cqw', borderRadius: 99, background: 'rgba(17,17,17,0.10)' }} />
      </div>
    </div>
    <div className="flex items-center justify-between pt-[4%] border-t border-[#E7E3DA]">
      <span style={{ width: '28%', height: '2cqw', borderRadius: 99, background: 'rgba(17,17,17,0.12)' }} />
      <span style={{ width: '18%', height: '4.5cqw', borderRadius: 99, background: ac }} />
    </div>
  </div>
);

export const DeviceMockup: React.FC<{
  project: StudioProject;
  hovered?: boolean;
  subtleBackdrop?: boolean;
}> = ({ project, hovered = false, subtleBackdrop = false }) => {
  const [bg, ac] = MOCKUP_PALETTES[hashSlug(project.id) % MOCKUP_PALETTES.length];
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      data-device-mockup="true"
      style={{
        background: subtleBackdrop
          ? `linear-gradient(135deg, rgba(250,248,244,0.38), rgba(255,255,255,0.22))`
          : `radial-gradient(ellipse at 70% 20%, ${ac}18, transparent 60%), linear-gradient(135deg, #FAF8F4, ${bg})`,
      }}
    >
      <div
        className="absolute rounded-xl overflow-hidden shadow-lg border border-[#E7E3DA] bg-white transition-transform duration-500"
        style={{
          left: '4%',
          top: '5%',
          width: '88%',
          aspectRatio: '16 / 10',
          transform: hovered ? 'translateY(-2%)' : 'none',
        }}
      >
        <div className="flex items-center gap-1 px-2.5 bg-[#FAF8F4] border-b border-[#E7E3DA]" style={{ height: '9%' }}>
          <i className="block rounded-full bg-[#E7E3DA]" style={{ width: '34%', height: '46%' }} />
        </div>
        <div style={{ height: '91%' }}>
          {project.desktopShot ? (
            <img
              src={project.desktopShot}
              alt={`${project.name} website on desktop`}
              width={800}
              height={500}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <WireframeScreen name={project.name} bg={bg} ac={ac} />
          )}
        </div>
      </div>

      <div
        className="absolute rounded-[1.1rem] overflow-hidden shadow-xl border-[3px] border-[#111111] bg-white transition-transform duration-500"
        style={{
          right: '4%',
          bottom: '4%',
          width: '28%',
          aspectRatio: '9 / 18.5',
          transform: hovered ? 'translateY(-5%)' : 'none',
        }}
      >
        <i
          className="absolute left-1/2 top-[2.5%] -translate-x-1/2 z-10 rounded-full bg-[#111111]"
          style={{ width: '34%', height: '3.2%' }}
        />
        {project.mobileShot ? (
          <img
            src={project.mobileShot}
            alt={`${project.name} website on mobile`}
            width={360}
            height={740}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <WireframeScreen name={project.name} bg={bg} ac={ac} mobile />
        )}
      </div>
    </div>
  );
};

export const ProjectStartingPrice: React.FC<{ projectId: string; className?: string }> = ({
  projectId,
  className,
}) => {
  const { currency, rates, activeCurrencyInfo } = useCurrency();
  const entry = PROJECT_PRICES[projectId];
  if (!entry) return null;

  let amount = entry[currency];
  if (amount == null && entry.USD != null) {
    amount = roundNiceAmount(entry.USD * (rates[currency] || activeCurrencyInfo.defaultRateToUSD || 1));
  }
  if (amount == null) return null;

  return (
    <span className={className || 'font-display text-2xl text-[color:var(--text-primary)]'}>
      <span className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--text-muted)] mr-1.5 align-middle">
        From
      </span>
      {activeCurrencyInfo.symbol}
      {amount.toLocaleString('en-US')}
    </span>
  );
};

export const HeroPortrait: React.FC = () => {
  const { siteContent } = useStore();
  const heroSettings = siteContent?.sections?.find((s) => s.type === 'hero')?.settings;
  const portraitSrc = heroSettings?.portraitUrl?.trim() || PORTRAIT_URL;
  const portraitAlt = heroSettings?.portraitAlt?.trim() || 'Portrait of Mushaf Khan';
  const portraitFocal = heroSettings?.portraitFocalPoint?.trim() || '50% 12%';
  const isLocalMushafPortrait = portraitSrc.includes('/assets/studio/mushaf-khan-portrait.webp');

  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useIsReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { damping: 20, stiffness: 160 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { damping: 20, stiffness: 160 });
  const hue = useTransform(mx, (v) => 95 + v * 120);
  const px = useTransform(mx, [-0.5, 0.5], [12, 88]);
  const py = useTransform(my, [-0.5, 0.5], [8, 82]);
  const glow = useMotionTemplate`radial-gradient(circle at ${px}% ${py}%, hsla(${hue}, 92%, 62%, 0.62) 0%, transparent 58%), radial-gradient(circle at ${py}% ${px}%, hsla(${hue}, 80%, 50%, 0.38) 0%, transparent 52%)`;
  const sheen = useMotionTemplate`radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.34) 0%, transparent 40%)`;
  const imgX = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), { damping: 20, stiffness: 140 });
  const imgY = useSpring(useTransform(my, [-0.5, 0.5], [-9, 9]), { damping: 20, stiffness: 140 });

  return (
    <div
      ref={containerRef}
      onPointerMove={(e) => {
        if (reducedMotion || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mx.set((e.clientX - rect.left) / rect.width - 0.5);
        my.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      className="relative w-full max-w-md mx-auto aspect-[4/5] [perspective:1000px] select-none"
    >
      <motion.div
        aria-hidden="true"
        style={{ background: glow }}
        className="pointer-events-none absolute -inset-4 rounded-[160px_160px_48px_48px] opacity-55 blur-2xl"
      />
      <motion.div
        style={{ rotateX: reducedMotion ? 0 : rotateX, rotateY: reducedMotion ? 0 : rotateY }}
        className="relative w-full h-full arch-hero glass-strong overflow-hidden p-2.5 sm:p-3 transition-shadow duration-500 shadow-xl [transform-style:preserve-3d]"
      >
        <div className="relative w-full h-full arch-hero overflow-hidden bg-[#FAF8F4]/60">
          <motion.img
            src={portraitSrc}
            srcSet={
              isLocalMushafPortrait
                ? '/assets/studio/mushaf-khan-portrait-400w.webp 400w, /assets/studio/mushaf-khan-portrait-800w.webp 800w, /assets/studio/mushaf-khan-portrait.webp 900w'
                : undefined
            }
            sizes={isLocalMushafPortrait ? '(max-width: 640px) 92vw, 448px' : undefined}
            alt={portraitAlt}
            width={900}
            height={1195}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.fallbackApplied) {
                target.dataset.fallbackApplied = '1';
                target.srcset = '';
                target.src = '/assets/studio/embedded-1.jpg';
              }
            }}
            style={{
              x: reducedMotion ? 0 : imgX,
              y: reducedMotion ? 0 : imgY,
              scale: 1.05,
              objectPosition: portraitFocal,
            }}
            className="relative z-10 w-full h-full object-cover"
          />
          <motion.div
            aria-hidden="true"
            style={{ background: sheen }}
            className="absolute inset-0 z-20 pointer-events-none mix-blend-soft-light"
          />

          <Link
            to="/skills"
            aria-label="Open my skills page"
            className="group absolute left-3 right-3 bottom-3 sm:left-4 sm:right-4 sm:bottom-4 z-30 rounded-2xl p-3.5 sm:p-4 glass-strong text-[#111111] hover:border-[#6BAA00] transition-colors shadow-lg"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="hidden md:block font-mono text-[10px] uppercase tracking-widest text-[#6BAA00] font-bold mb-1">
                  Skills
                </p>
                <p className="font-display text-base sm:text-xl leading-tight text-[#111111]">
                  Web &middot; Design &middot; Video &middot; 3D &middot; SEO &middot; AI
                </p>
              </div>
              <span className="shrink-0 w-11 h-11 rounded-full bg-[#B6F500] text-[#111111] flex items-center justify-center transition-transform group-hover:translate-x-0.5 shadow-xs">
                <ArrowUpRight size={18} />
              </span>
            </div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

const ROLE_TITLES = [
  { title: 'Web Developer', note: 'React · TypeScript · Speed' },
  { title: 'SEO Specialist', note: 'Local Search · Schema · Core Vitals' },
  { title: 'UI/UX & Brand Designer', note: 'Figma · Design Systems' },
  { title: 'Video Editor & Producer', note: 'Commercials · Color Grading' },
  { title: 'Motion Graphics Designer', note: '2D Animation · Micro-Interactions' },
  { title: '3D & Blender Artist', note: 'Physical Shaders · Spatial Web' },
  { title: 'AI Automation Specialist', note: 'Workflows · APIs · WhatsApp' },
  { title: 'Full-Stack Digital Partner', note: 'Single Point of Contact' },
];

export const RoleFlipper: React.FC = () => {
  const [idx, setIdx] = useState(0);
  const reducedMotion = useIsReducedMotion();

  useEffect(() => {
    const timer = setInterval(() => {
      playFlipTickSound();
      setIdx((i) => (i + 1) % ROLE_TITLES.length);
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  const current = ROLE_TITLES[idx];

  return (
    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 select-none my-3">
      <span className="font-body text-sm sm:text-base text-[#5B5B56]">
        I am a
      </span>
      <div className="relative inline-flex items-center min-w-0 flex-1 sm:flex-none sm:min-w-[310px] max-w-full h-11 sm:h-12 rounded-xl glass-strong text-[#111111] px-3.5 sm:px-4 overflow-hidden [perspective:800px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.title}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, rotateX: -85, y: 4 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, rotateX: 0, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, rotateX: 85, y: -4 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-between gap-3 w-full"
          >
            <span className="font-display text-base sm:text-lg text-[#4C7A00] font-semibold tracking-tight truncate">
              {current.title}
            </span>
            <span className="hidden sm:inline font-mono text-[10px] text-[#5B5B56] truncate">
              {current.note}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
      <span className="font-mono text-[11px] text-[#5B5B56]">
        {String(idx + 1).padStart(2, '0')} / {String(ROLE_TITLES.length).padStart(2, '0')}
      </span>
    </div>
  );
};

export const StickyCaseStudies: React.FC<{ projects?: StudioProject[] }> = ({
  projects = PROJECTS.slice(0, 6),
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <ScrollScrubVideo>
      <section className="relative w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
        <div className="pb-6 mb-8 md:mb-10 border-b border-[color:var(--border-subtle)] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="hidden md:block font-mono text-xs uppercase tracking-widest text-[color:var(--accent-text)] font-bold mb-2">
              Featured Flagships
            </span>
            <h2 className="headline-section text-[color:var(--text-primary)]">
              Work built for <span className="sage-underline">measurable conversions</span>.
            </h2>
          </div>
          <Link
            to="/work"
            className="min-h-[44px] font-mono text-xs uppercase tracking-wider text-[color:var(--accent-text)] hover:underline inline-flex items-center gap-1"
          >
            View All {PROJECTS.length} Projects <ArrowRight size={13} />
          </Link>
        </div>

        <div className="relative w-full pb-8">
          {projects.map((proj, idx) => {
            const isHovered = hoveredId === proj.id;
            return (
              <div
                key={proj.id}
                className="sticky top-24 sm:top-28 mb-12 sm:mb-16 will-change-transform"
                style={{ zIndex: idx + 10 }}
              >
                <motion.div
                  onMouseEnter={() => setHoveredId(proj.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="group/case relative rounded-[32px] sm:rounded-[36px] p-6 sm:p-10 glass-strong overflow-hidden hover:border-[#6BAA00]/55 transition-colors duration-300"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-45 group-hover/case:opacity-80 transition-opacity duration-500 blur-3xl"
                    style={{
                      background:
                        idx % 3 === 0
                          ? 'radial-gradient(circle, rgba(182, 245, 0, 0.30), transparent 70%)'
                          : idx % 3 === 1
                            ? 'radial-gradient(circle, rgba(20, 184, 166, 0.24), transparent 70%)'
                            : 'radial-gradient(circle, rgba(245, 158, 11, 0.24), transparent 70%)',
                    }}
                  />
                  <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
                    <div className="lg:col-span-5 flex flex-col justify-between space-y-4 md:space-y-6">
                      <div>
                        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-[#5B5B56] mb-3">
                          <span>{proj.industryCategory || 'Commercial'}</span>
                          <span aria-hidden="true">&middot;</span>
                          <span>{proj.clientType}</span>
                          <span aria-hidden="true">&middot;</span>
                          <span>{proj.year}</span>
                        </div>
                        <h3 className="font-display font-semibold text-2xl sm:text-4xl text-[#111111] tracking-tight leading-snug mb-2 md:mb-3">
                          {proj.name}
                        </h3>
                        <MobileReadMore lines={2} className="mb-3 md:mb-6">
                          <p className="font-body text-sm sm:text-base text-[#5B5B56] leading-relaxed">
                            {proj.outcome}
                          </p>
                        </MobileReadMore>
                        <div className="hidden md:flex flex-wrap gap-1.5 pt-4 border-t border-[#E7E3DA]">
                          {proj.stack.slice(0, 4).map((tech) => (
                            <span
                              key={tech}
                              className="font-mono text-[11px] px-2.5 py-1 rounded-md glass-pill text-[#111111]"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-1 md:pt-2">
                        <Link
                          to={`/work/${proj.id}`}
                          className="group min-h-[44px] w-full sm:w-auto justify-center inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B6F500] text-[#111111] font-display font-semibold text-xs sm:text-sm transition-all hover:opacity-90 active:scale-95 shadow-xs cursor-pointer"
                        >
                          <span>View case study</span>
                          <span className="w-5 h-5 rounded-full bg-[#111111]/10 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                            <ArrowUpRight size={12} />
                          </span>
                        </Link>
                        {proj.deliveryDays && (
                          <span className="hidden md:inline font-mono text-xs text-[#5B5B56]">
                            {proj.deliveryDays}-day turnaround
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-7 relative order-first md:order-none">
                      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-[16/10] bg-[#FAF8F4]/60 border border-white/60 shadow-md group">
                        <DeviceMockup project={proj} hovered={isHovered} />
                        {proj.resultSignal && (
                          <div className="absolute left-3 bottom-3 right-3 sm:right-auto sm:max-w-xs rounded-2xl glass-strong px-4 py-2.5 pointer-events-none">
                            <span className="hidden md:block font-mono text-[10px] uppercase tracking-widest text-[#6BAA00] font-bold">
                              Measured Lift
                            </span>
                            <div className="font-display font-semibold text-sm sm:text-base text-[#111111] leading-tight">
                              {proj.resultSignal}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
    </ScrollScrubVideo>
  );
};

const CountUpValue: React.FC<{ target: number; suffix?: string }> = ({ target, suffix = '' }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [val, setVal] = useState(0);
  const reducedMotion = useIsReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reducedMotion) {
      setVal(target);
      return;
    }
    const duration = 1100;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, reducedMotion]);

  return (
    <span
      ref={ref}
      className="font-display font-light text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[color:var(--text-primary)] block"
    >
      {val}
      {suffix && <span className="text-[color:var(--accent-text)] font-normal">{suffix}</span>}
    </span>
  );
};

export const MeasuredOutcomes: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const totalProjects = PROJECTS.length;
  const industriesCount =
    new Set(PROJECTS.map((p) => p.industryCategory).filter(Boolean)).size || 5;

  const cards = [
    {
      key: 'projects',
      value: totalProjects,
      suffix: '',
      label: 'Commercial projects delivered',
      sublabel: 'Bespoke websites, menus, and digital platforms with verified client outcomes.',
      Icon: FolderKanban,
    },
    {
      key: 'industries',
      value: industriesCount,
      suffix: '',
      label: 'Industries served',
      sublabel:
        'From specialty dining and natural wine izakayas to medical clinics and fashion studios.',
      Icon: Store,
    },
    {
      key: 'days',
      value: 12,
      suffix: 'd',
      label: 'Average delivery sprint',
      sublabel: 'From initial brief and interactive wireframe to live production launch.',
      Icon: Clock,
    },
    {
      key: 'repeat',
      value: 82,
      suffix: '%',
      label: 'Repeat & referral rate',
      sublabel: 'Founders returning for expansion sprints, 3D drops, and ongoing SEO.',
      Icon: Repeat,
    },
  ];

  return (
    <section ref={ref} className="relative w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 select-none">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 mb-8 md:mb-12 border-b border-[#E7E3DA]">
          <div>
            <div className="hidden md:flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#6BAA00]" />
              <span className="font-mono text-xs uppercase tracking-widest text-[#5B5B56] font-semibold">
                Track Record &amp; Metrics
              </span>
            </div>
            <h2 className="headline-section text-[#111111]">
              Measured outcomes, single source of truth.
            </h2>
          </div>
          <p className="hidden md:block font-body text-xs sm:text-sm text-[#5B5B56] max-w-xs">
            Directly evaluated by customer bookings, speed benchmarks, and on-time delivery guarantees.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((card, i) => {
            const Icon = card.Icon;
            return (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="glass hover:border-[#6BAA00]/55 hover:-translate-y-1 transition-all duration-300 rounded-3xl p-6 flex flex-col justify-between gap-5"
              >
                <div className="flex items-center justify-between">
                  <CountUpValue target={card.value} suffix={card.suffix} />
                  <div className="w-10 h-10 rounded-xl glass-pill flex items-center justify-center text-[#6BAA00]">
                    <Icon size={18} />
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-xl text-[#111111] mb-1">
                    {card.label}
                  </h3>
                  <p className="text-xs text-[#5B5B56] leading-relaxed line-clamp-2 md:line-clamp-none">
                    {card.sublabel}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const TestimonialsCarousel: React.FC = () => {
  const { isMobile } = useIsMobile();
  const ref = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useIsReducedMotion();

  const reviews = SEED_REVIEWS;

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % reviews.length);
  }, [reviews.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + reviews.length) % reviews.length);
  }, [reviews.length]);

  useEffect(() => {
    if (paused || reducedMotion || reviews.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [paused, reducedMotion, reviews.length, next]);

  if (!reviews.length) return null;
  const active = reviews[index];

  return (
    <section
      ref={ref}
      id="reviews"
      aria-labelledby="reviews-heading"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative isolate w-full bg-[#FAF8F4] text-[#111111] py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-t border-[#E7E3DA] overflow-hidden"
    >
      <AmbientVideo
        mp4Src="/videos/testimonials-ambient-light.mp4"
        webmSrc="/videos/hero-ambient-light.webm"
        posterSrc="/videos/hero-ambient-light-poster.webp"
        videoClassName="opacity-20 blur-[2px]"
        overlayClassName="bg-[#FAF8F4]/78"
        className="pointer-events-none !absolute inset-0 z-0"
      />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 mb-8 md:mb-12 border-b border-[#E7E3DA]">
          <div>
            <span className="hidden md:block font-mono text-xs uppercase tracking-widest text-[#6BAA00] font-bold mb-2">
              Client Proof
            </span>
            <h2
              id="reviews-heading"
              className="headline-section text-[#111111]"
            >
              Trusted by founders who sign the checks.
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous review"
              className="w-11 h-11 rounded-full glass-pill text-[#111111] flex items-center justify-center hover:border-[#6BAA00] transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next review"
              className="w-11 h-11 rounded-full glass-pill text-[#111111] flex items-center justify-center hover:border-[#6BAA00] transition-colors cursor-pointer"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={isMobile || reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={isMobile || reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="glass rounded-3xl p-6 sm:p-12 relative overflow-hidden"
          >
            <MobileReadMore lines={3} className="mb-6 md:mb-8">
              <blockquote className="font-display text-xl sm:text-4xl text-[#111111] leading-snug max-w-4xl">
                &ldquo;{active.text}&rdquo;
              </blockquote>
            </MobileReadMore>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 md:pt-6 border-t border-[#E7E3DA]">
              <div>
                <p className="font-display text-xl text-[#111111]">
                  {active.name}
                </p>
                <p className="font-mono text-xs text-[#5B5B56] truncate">
                  {active.businessName} <span className="hidden md:inline">&middot; {active.businessType} &middot; {active.city}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {reviews.map((r, i) => (
                  <button
                    key={r.id}
                    type="button"
                    aria-label={`Jump to review ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      i === index ? 'w-7 bg-[#6BAA00]' : 'w-2 bg-[#E7E3DA]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export const FaqSection: React.FC = () => {
  const { isMobile } = useIsMobile();
  const [openIndex, setOpenIndex] = useState<number>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? -1 : 0
  );
  const reducedMotion = useIsReducedMotion();
  const { formatFromUSD } = useCurrency();

  useEffect(() => {
    if (isMobile) setOpenIndex(-1);
  }, [isMobile]);

  const lowStr = formatFromUSD(2500);
  const highStr = formatFromUSD(7500);

  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative w-full bg-[color:var(--bg-canvas)] text-[color:var(--text-primary)] py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-[color:var(--border-subtle)] overflow-hidden transition-colors duration-500"
    >
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="pb-6 mb-8 md:mb-10 border-b border-[color:var(--border-subtle)] text-center sm:text-left">
          <span className="hidden md:block font-mono text-xs uppercase tracking-widest text-[color:var(--accent-text)] mb-2 font-bold">
            Frequently Asked Questions
          </span>
          <h2
            id="faq-title"
            className="text-3xl sm:text-4xl md:text-5xl font-display font-medium text-[color:var(--text-primary)] tracking-tight"
          >
            Clear Answers. <span className="sage-underline font-semibold">No Confusion.</span>
          </h2>
          <p className="hidden md:block font-sans text-xs sm:text-sm text-[color:var(--text-secondary)] mt-2 max-w-xl">
            Direct, transparent details about costs, turnaround milestones, and how we collaborate.
          </p>
        </div>

        <div className="space-y-3.5">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            const formattedAnswer = item.answer
              .replace('$2,500', lowStr)
              .replace('$7,500', highStr);
            return (
              <div
                key={item.question}
                className={`rounded-2xl transition-all duration-300 relative overflow-hidden glass ${
                  isOpen
                    ? 'border-l-4 border-l-[#6BAA00] shadow-md'
                    : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  aria-expanded={isOpen}
                  className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left cursor-pointer focus:outline-none"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl glass-pill flex items-center justify-center shrink-0 text-[#6BAA00]">
                      <HelpCircle size={16} />
                    </div>
                    <span className="font-display font-medium text-lg sm:text-xl text-[#111111] leading-snug">
                      {item.question}
                    </span>
                  </div>
                  <span
                    className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen
                        ? 'rotate-45 bg-[#111111] text-white border-[#111111]'
                        : 'glass-pill text-[#5B5B56]'
                    }`}
                  >
                    <Plus size={14} />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reducedMotion ? 0.2 : 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-6 sm:px-6 sm:pb-6 pt-3 border-t border-[#E7E3DA] sm:pl-16">
                        <p className="font-sans text-xs sm:text-sm text-[#5B5B56] leading-relaxed">
                          {formattedAnswer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="mt-10 p-6 rounded-2xl glass-strong flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl glass-pill flex items-center justify-center text-[#6BAA00] shrink-0 hidden sm:flex">
              <MessageCircleQuestion size={22} />
            </div>
            <div>
              <span className="hidden md:block font-mono text-[10px] uppercase tracking-wider text-[#6BAA00] font-bold mb-0.5">
                Have a different question?
              </span>
              <h3 className="font-display font-medium text-lg sm:text-xl text-[#111111]">
                Ask a Question Directly
              </h3>
              <p className="font-sans text-xs text-[#5B5B56] mt-0.5 max-w-md line-clamp-2 md:line-clamp-none">
                Get direct answers about project scope, tech stack, or an exact fixed quote within 24 hours.
              </p>
            </div>
          </div>
          <Link
            to="/contact"
            className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#B6F500] text-[#111111] font-sans text-xs sm:text-sm font-semibold text-center hover:opacity-90 transition cursor-pointer shrink-0 shadow-xs"
          >
            Contact Studio &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
};

const TIMELINE_OPTIONS = ['As soon as possible', 'Within a month', '2 to 3 months', 'Flexible'];

export const CustomBriefSection: React.FC = () => {
  const { currency, rates, activeCurrencyInfo } = useCurrency();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    title: '',
    description: '',
    links: '',
    extra: '',
    timeline: TIMELINE_OPTIONS[1],
    tier: 1,
    customBudget: '',
    useCustom: false,
  });

  const sym = activeCurrencyInfo.symbol;
  const formatAmount = (val: number) => `${sym}${Math.round(val).toLocaleString('en-US')}`;

  const tierLabels = useMemo(() => {
    const rate = rates[currency] || activeCurrencyInfo.defaultRateToUSD || 1;
    const raw =
      BUDGET_TIERS[currency] ||
      BUDGET_TIERS.USD.map(([lo, hi]) => [
        roundNiceAmount(lo * rate),
        hi == null ? null : roundNiceAmount(hi * rate),
      ]);
    return raw.map(([lo, hi]) =>
      hi == null ? `${formatAmount(lo)}+` : `${formatAmount(lo)} to ${formatAmount(hi)}`
    );
  }, [currency, rates, sym, activeCurrencyInfo.defaultRateToUSD]);

  const budgetStr = form.useCustom
    ? `${formatAmount(Number(form.customBudget) || 0)} (custom)`
    : tierLabels[form.tier] || tierLabels[0];

  const compiledMessage = `Project: ${form.title || 'Custom project'}\n${form.description}\nServices: ${selectedServices.join(', ') || 'Not sure yet'}\nTimeline: ${form.timeline}\nBudget (${currency}): ${budgetStr}\nReferences: ${form.links || 'None'}\nExtra: ${form.extra || 'None'}\nEmail: ${form.email}`;

  const submit = async () => {
    setError('');
    if (form.name.trim().length < 2) return setError('Please enter your name.');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Please enter a valid email address.');
    if (form.description.trim().length < 20)
      return setError('Please describe your project in a few sentences.');
    if (form.useCustom && !(Number(form.customBudget) > 0))
      return setError('Please enter your budget amount.');

    setBusy(true);
    await submitEnquiry({
      name: form.name,
      email: form.email,
      businessType: `Custom project: ${selectedServices.join(', ') || 'Not sure yet'}`,
      budget: `${budgetStr} (${currency})`,
      message: compiledMessage,
    });
    setBusy(false);
    setSubmitted(true);
  };

  return (
    <section className="my-10 glass rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="hidden md:block font-mono text-xs uppercase tracking-widest text-[#6BAA00] font-bold mb-2">
            Custom project
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-[#111111]">
            Need something that is not listed?
          </h2>
          <MobileReadMore lines={2} className="mt-2">
            <p className="text-sm text-[#5B5B56] max-w-xl">
              Describe your idea, choose a budget in your own currency and I will come back with a
              scoped plan.
            </p>
          </MobileReadMore>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="shrink-0 min-h-[44px] w-full sm:w-auto justify-center inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#B6F500] text-[#111111] text-sm font-semibold hover:opacity-90 transition cursor-pointer shadow-xs"
        >
          {open ? <Minus size={16} /> : <Plus size={16} />}
          <span>{open ? 'Close' : 'Start a custom project'}</span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {submitted ? (
              <div className="pt-8 text-center">
                <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-[#B6F500] text-[#111111] flex items-center justify-center">
                  <Check size={22} />
                </div>
                <h3 className="font-display text-2xl text-[#111111] mb-2">
                  Thanks, your brief is in.
                </h3>
                <p className="text-sm text-[#5B5B56] mb-6">
                  I will review it and reply to {form.email}.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {STUDIO_INFO.whatsapp && (
                    <a
                      href={`https://wa.me/${STUDIO_INFO.whatsapp}?text=${encodeURIComponent(compiledMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#B6F500] text-[#111111] text-sm font-semibold"
                    >
                      <MessageCircle size={16} /> Send on WhatsApp
                    </a>
                  )}
                  <a
                    href={`mailto:${STUDIO_INFO.email}?subject=${encodeURIComponent('Custom project: ' + (form.title || 'New brief'))}&body=${encodeURIComponent(compiledMessage)}`}
                    className="min-h-[44px] inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#FAF8F4] border border-[#E7E3DA] text-sm font-semibold text-[#111111]"
                  >
                    Email instead
                  </a>
                </div>
              </div>
            ) : (
              <div className="pt-8 grid gap-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    className="w-full min-h-[44px] rounded-2xl px-4 py-3 text-base sm:text-sm bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] outline-none focus:border-[#6BAA00] focus:bg-white"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    aria-label="Your name"
                  />
                  <input
                    className="w-full min-h-[44px] rounded-2xl px-4 py-3 text-base sm:text-sm bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] outline-none focus:border-[#6BAA00] focus:bg-white"
                    placeholder="Email address"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    aria-label="Email address"
                  />
                </div>

                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-[#5B5B56] mb-3">
                    Services Needed
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SERVICES.map((svc) => {
                      const active = selectedServices.includes(svc.name);
                      return (
                        <button
                          key={svc.slug}
                          type="button"
                          onClick={() =>
                            setSelectedServices((prev) =>
                              active ? prev.filter((x) => x !== svc.name) : [...prev, svc.name]
                            )
                          }
                          className={`min-h-[44px] px-4 py-2 rounded-full border text-xs font-mono transition cursor-pointer ${
                            active
                              ? 'bg-[#B6F500] text-[#111111] border-transparent font-semibold'
                              : 'bg-[#FAF8F4] text-[#5B5B56] border-[#E7E3DA] hover:border-[#6BAA00] hover:text-[#111111]'
                          }`}
                        >
                          {svc.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <textarea
                  rows={4}
                  className="w-full rounded-2xl px-4 py-3 text-base sm:text-sm bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] outline-none focus:border-[#6BAA00] focus:bg-white"
                  placeholder="Describe what we are building and any goals or deadlines..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-widest text-[#5B5B56] mb-2">
                      Budget ({currency})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tierLabels.map((lbl, idx) => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => setForm({ ...form, tier: idx, useCustom: false })}
                          className={`min-h-[44px] px-3.5 py-2 rounded-full border text-xs font-mono cursor-pointer ${
                            !form.useCustom && form.tier === idx
                              ? 'bg-[#B6F500] text-[#111111] border-transparent font-semibold'
                              : 'bg-[#FAF8F4] text-[#5B5B56] border-[#E7E3DA]'
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-mono uppercase tracking-widest text-[#5B5B56] mb-2">
                      Timeline
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {TIMELINE_OPTIONS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm({ ...form, timeline: t })}
                          className={`min-h-[44px] px-3.5 py-2 rounded-full border text-xs font-mono cursor-pointer ${
                            form.timeline === t
                              ? 'bg-[#B6F500] text-[#111111] border-transparent font-semibold'
                              : 'bg-[#FAF8F4] text-[#5B5B56] border-[#E7E3DA]'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="text-xs text-rose-600">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  disabled={busy}
                  onClick={submit}
                  className="min-h-[48px] px-6 py-3 rounded-full bg-[#B6F500] text-[#111111] text-sm font-semibold hover:opacity-90 transition cursor-pointer disabled:opacity-60 w-full sm:w-fit shadow-xs"
                >
                  {busy ? 'Sending...' : 'Send Project Brief'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
